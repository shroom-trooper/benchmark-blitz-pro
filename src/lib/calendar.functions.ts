import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import * as sync from "./calendar/sync.server";
import { GATEWAY_BASE_URL, MICROSOFT_CONNECTOR_ID, MICROSOFT_SCOPES } from "./calendar/microsoft.server";
import { authorizeAppUserOAuth, exchangeAppUserOAuthCode } from "@/integrations/lovable/appUserConnector";

const CLIENT_KEY_ENV = "MICROSOFT_OUTLOOK_APP_USER_CONNECTOR_CLIENT_API_KEY";

async function admin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

export const getCalendarStatus = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const configured = Boolean(process.env[CLIENT_KEY_ENV] && process.env["APP_USER_CONNECTION_KEY_SECRET"]);
    const { data: conn } = await context.supabase
      .from("calendar_connections")
      .select("status, provider_email, connected_at, last_successful_sync_at, last_sync_attempt_at, last_error_code")
      .eq("user_id", context.userId)
      .eq("provider", "microsoft")
      .maybeSingle();
    const { data: prefs } = await context.supabase
      .from("notification_preferences")
      .select("*")
      .eq("user_id", context.userId)
      .maybeSingle();
    return {
      configured,
      connection: conn && conn.status !== "disconnected" ? conn : null,
      prefs: prefs ?? null,
      scopes: MICROSOFT_SCOPES,
    };
  });

export const startOutlookConnect = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const clientKey = process.env[CLIENT_KEY_ENV];
    if (!clientKey) throw new Error("Outlook connection is not set up for this workspace yet.");
    const request = getRequest();
    const url = new URL(request.url);
    const sandboxHost = url.hostname === "localhost" ? request.headers.get("x-forwarded-host") : null;
    const returnUrl = new URL("/oauth/outlook/return", sandboxHost ? `https://${sandboxHost}` : url.origin).toString();
    const existing = await sync.getConnectionKey(context.userId, MICROSOFT_CONNECTOR_ID).catch(() => null);
    const { authorizationUrl } = await authorizeAppUserOAuth({
      gatewayBaseUrl: GATEWAY_BASE_URL,
      connectorId: MICROSOFT_CONNECTOR_ID,
      appUserId: context.userId,
      clientAPIKey: clientKey,
      returnUrl,
      ...(existing ? { connectionAPIKey: existing } : {}),
      credentialsConfiguration: { scopes: MICROSOFT_SCOPES, prompt: "select_account", domain_hint: "none" },
    });
    return { authorizationUrl };
  });

export const completeOutlookConnect = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ code: z.string().min(4).max(2000) }).parse(d))
  .handler(async ({ context, data }) => {
    const { connectionAPIKey, connectorId } = await exchangeAppUserOAuthCode(GATEWAY_BASE_URL, data.code);
    if (connectorId !== MICROSOFT_CONNECTOR_ID) throw new Error("Unexpected connection type");
    await sync.saveConnectionKey(context.userId, connectorId, connectionAPIKey);
    await sync.recordConnected(context.userId, connectionAPIKey);
    const r = await sync.syncUser(context.userId);
    return { ok: true, sync: r.status };
  });

export const syncCalendarNow = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => sync.syncUser(context.userId));

export const disconnectOutlook = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await sync.disconnectCalendar(context.userId);
    return { ok: true };
  });

export const updateNotificationPrefs = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        calendar_detection_enabled: z.boolean(),
        email_preparation_enabled: z.boolean(),
        email_refresher_enabled: z.boolean(),
        preparation_lead_minutes: z.number().int().min(30).max(10080),
        refresher_lead_minutes: z.number().int().min(5).max(240),
        quiet_hours_start: z.number().int().min(0).max(23).nullable(),
        quiet_hours_end: z.number().int().min(0).max(23).nullable(),
        timezone: z.string().min(1).max(64),
      })
      .parse(d),
  )
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase
      .from("notification_preferences")
      .upsert({ user_id: context.userId, ...data, updated_at: new Date().toISOString() }, { onConflict: "user_id" });
    if (error) throw new Error("Could not save preferences");
    await sync.rescheduleAllForUser(context.userId);
    return { ok: true };
  });

/** Detected events awaiting action. Only the user's own rows, via RLS. */
export const listDetectedEvents = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const a = await admin();
    const { data } = await a
      .from("normalized_calendar_events")
      .select("id, subject, starts_at, ends_at, classification_status, linked_interview_event_id, interview_classifications(confidence_score, detected_role_title, detected_interview_stage)")
      .eq("user_id", context.userId)
      .eq("is_cancelled", false)
      .in("classification_status", ["likely_interview", "possible_interview", "needs_confirmation"])
      .gte("starts_at", new Date().toISOString())
      .order("starts_at");
    return (data ?? []).map((e) => {
      const c = Array.isArray(e.interview_classifications) ? e.interview_classifications[0] : e.interview_classifications;
      return {
        id: e.id,
        subject: e.subject,
        startsAt: e.starts_at,
        band: e.classification_status === "likely_interview" ? ("high" as const) : ("medium" as const),
        confidence: c?.confidence_score ?? 0,
        role: c?.detected_role_title ?? null,
        stage: c?.detected_interview_stage ?? null,
        interviewId: e.linked_interview_event_id,
      };
    });
  });

/** Manual recovery: events the classifier judged unlikely, for the next 30 days. */
export const listOtherCalendarEvents = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase
      .from("normalized_calendar_events")
      .select("id, subject, starts_at")
      .eq("user_id", context.userId)
      .eq("is_cancelled", false)
      .in("classification_status", ["not_interview", "dismissed", "pending"])
      .gte("starts_at", new Date().toISOString())
      .order("starts_at")
      .limit(50);
    return data ?? [];
  });

export const getCalendarEventForConfirm = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }) => {
    const a = await admin();
    const { data: ev } = await a
      .from("normalized_calendar_events")
      .select("id, subject, sanitized_description, starts_at, ends_at, linked_interview_event_id, is_cancelled")
      .eq("id", data.id)
      .eq("user_id", context.userId)
      .maybeSingle();
    if (!ev) throw new Error("Calendar event not found");
    const [{ data: cls }, { data: atts }] = await Promise.all([
      a.from("interview_classifications").select("*").eq("normalized_calendar_event_id", ev.id).maybeSingle(),
      a
        .from("calendar_event_attachments")
        .select("id, filename, byte_size, document_classification, processing_status, processing_error_code, approved_for_generation")
        .eq("normalized_calendar_event_id", ev.id),
    ]);
    return {
      event: { id: ev.id, subject: ev.subject, description: ev.sanitized_description, startsAt: ev.starts_at, endsAt: ev.ends_at, cancelled: ev.is_cancelled },
      detected: {
        role: cls?.detected_role_title ?? null,
        candidate: cls?.detected_candidate_display_name ?? null,
        stage: cls?.detected_interview_stage ?? null,
        reasons: (cls?.detection_reasons as string[]) ?? [],
        confidence: cls?.confidence_score ?? 0,
      },
      attachments: (atts ?? []).map((x) => ({
        id: x.id,
        filename: x.filename,
        size: x.byte_size,
        kind: x.document_classification,
        supported: x.processing_status !== "unsupported",
        reason: x.processing_error_code,
        approved: x.approved_for_generation,
      })),
    };
  });

export const confirmDetectedInterview = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        calendarEventId: z.string().uuid(),
        roleTitle: z.string().trim().min(2).max(160),
        candidateDisplayName: z.string().trim().min(1).max(120),
        stage: z.string().trim().min(2).max(80),
        competencies: z.array(z.string().trim().min(1).max(60)).max(12),
        responsibility: z.string().max(1000).nullable().optional(),
        approvedAttachmentIds: z.array(z.string().uuid()).max(10),
      })
      .parse(d),
  )
  .handler(({ context, data }) =>
    sync.confirmCalendarInterview(context.userId, { ...data, responsibility: data.responsibility ?? null }),
  );

export const dismissDetectedEvent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }) => {
    await sync.dismissCalendarEvent(context.userId, data.id);
    return { ok: true };
  });
