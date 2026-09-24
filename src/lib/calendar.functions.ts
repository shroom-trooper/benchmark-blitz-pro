import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import * as sync from "./calendar/sync.server";
import { GATEWAY_BASE_URL, GOOGLE_CALENDAR_CONNECTOR_ID, GOOGLE_CALENDAR_SCOPES } from "./calendar/google-calendar.server";
import { GMAIL_CONNECTOR_ID, GMAIL_SCOPES } from "./calendar/gmail-invitation.server";
import { authorizeAppUserOAuth, exchangeAppUserOAuthCode } from "@/integrations/lovable/appUserConnector";

const KINDS = {
  calendar: { connectorId: GOOGLE_CALENDAR_CONNECTOR_ID, scopes: GOOGLE_CALENDAR_SCOPES, env: "GOOGLE_CALENDAR_APP_USER_CONNECTOR_CLIENT_API_KEY" },
  gmail: { connectorId: GMAIL_CONNECTOR_ID, scopes: GMAIL_SCOPES, env: "GOOGLE_MAIL_APP_USER_CONNECTOR_CLIENT_API_KEY" },
} as const;
const kindInput = z.object({ kind: z.enum(["calendar", "gmail"]) });

async function admin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

export const getCalendarStatus = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const secret = Boolean(process.env["APP_USER_CONNECTION_KEY_SECRET"]);
    const configured = secret && Boolean(process.env[KINDS.calendar.env]);
    const gmailConfigured = secret && Boolean(process.env[KINDS.gmail.env]);
    const gmailConnected = await sync.hasGmail(context.userId);
    const { data: conn } = await context.supabase
      .from("calendar_connections")
      .select("status, provider_email, connected_at, last_successful_sync_at, last_sync_attempt_at, last_error_code")
      .eq("user_id", context.userId)
      .eq("provider", "google")
      .maybeSingle();
    const { data: prefs } = await context.supabase
      .from("notification_preferences")
      .select("*")
      .eq("user_id", context.userId)
      .maybeSingle();
    return {
      configured,
      gmailConfigured,
      gmailConnected,
      connection: conn && conn.status !== "disconnected" ? conn : null,
      prefs: prefs ?? null,
    };
  });

export const startGoogleConnect = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => kindInput.parse(d))
  .handler(async ({ context, data }) => {
    const k = KINDS[data.kind];
    const clientKey = process.env[k.env];
    if (!clientKey) throw new Error("This Google connection is not set up for this workspace yet.");
    const request = getRequest();
    const url = new URL(request.url);
    const sandboxHost = url.hostname === "localhost" ? request.headers.get("x-forwarded-host") : null;
    const returnUrl = new URL("/oauth/google/return", sandboxHost ? `https://${sandboxHost}` : url.origin).toString();
    const existing = await sync.getConnectionKey(context.userId, k.connectorId).catch(() => null);
    const { authorizationUrl } = await authorizeAppUserOAuth({
      gatewayBaseUrl: GATEWAY_BASE_URL,
      connectorId: k.connectorId,
      appUserId: context.userId,
      clientAPIKey: clientKey,
      returnUrl,
      ...(existing ? { connectionAPIKey: existing } : {}),
      credentialsConfiguration: { scopes: [...k.scopes] },
    });
    return { authorizationUrl };
  });

export const completeGoogleConnect = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => kindInput.extend({ code: z.string().min(4).max(2000) }).parse(d))
  .handler(async ({ context, data }) => {
    const k = KINDS[data.kind];
    const { connectionAPIKey, connectorId } = await exchangeAppUserOAuthCode(GATEWAY_BASE_URL, data.code);
    if (connectorId !== k.connectorId) throw new Error("Unexpected connection type");
    await sync.saveConnectionKey(context.userId, connectorId, connectionAPIKey);
    if (data.kind === "gmail") return { ok: true, sync: "ok" as const };
    await sync.recordConnected(context.userId, connectionAPIKey);
    const r = await sync.syncUser(context.userId);
    return { ok: true, sync: r.status };
  });

export const syncCalendarNow = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => sync.syncUser(context.userId));

export const disconnectGoogle = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => kindInput.parse(d))
  .handler(async ({ context, data }) => {
    if (data.kind === "gmail") await sync.disconnectGmail(context.userId);
    else await sync.disconnectCalendar(context.userId);
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
    let invitation: string | null = null;
    if (!ev.is_cancelled) {
      invitation = await sync.matchInvitation(context.userId, ev.id).catch(() => "error");
    }
    const [{ data: cls }, { data: atts }] = await Promise.all([
      a.from("interview_classifications").select("*").eq("normalized_calendar_event_id", ev.id).maybeSingle(),
      a
        .from("calendar_event_attachments")
        .select("id, filename, byte_size, document_classification, processing_status, processing_error_code, approved_for_generation, source_kind")
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
        source: x.source_kind,
      })),
      invitation,
      gmailConnected: await sync.hasGmail(context.userId),
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
