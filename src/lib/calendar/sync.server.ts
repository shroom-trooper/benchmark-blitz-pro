import { classifyEvent, CLASSIFIER_VERSION } from "./classifier";
import { decryptConnectionKey, encryptConnectionKey } from "./crypto.server";
import { googleCalendarProvider as calendarProvider, GATEWAY_BASE_URL } from "./google-calendar.server";
import { findMatchingInvitation, getInvitationAttachment, GMAIL_CONNECTOR_ID } from "./gmail-invitation.server";
import { MAX_EXTRACTED_CHARS, verifyFileSignature } from "./filecheck";
import { DeltaExpiredError, ProviderAuthError, type CalendarProvider, type NormalizedEvent } from "./provider";
import {
  ATTACHMENT_RETENTION_DAYS,
  attachmentSupport,
  classifyDocument,
  computePreparationAt,
  computeRefresherAt,
  DEFAULT_PREFS,
  deliveryKey,
  type Prefs,
} from "./schedule";
import { disconnectAppUser } from "@/integrations/lovable/appUserConnector";
import { contextCompleteness } from "@/lib/readiness/generator";

const SITE_URL = "https://usebenchmark.app";
const WINDOW_DAYS = 30;

async function admin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

export function providerFor(_p: string): CalendarProvider {
  return calendarProvider;
}

/* ---------------- Connection key storage (encrypted, service-role only) ---------------- */

export async function saveConnectionKey(userId: string, connectorId: string, key: string) {
  const a = await admin();
  const { error } = await a.from("app_user_connections").upsert(
    {
      user_id: userId,
      connector_id: connectorId,
      connection_key_ciphertext: encryptConnectionKey(key),
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,connector_id" },
  );
  if (error) throw new Error("Could not save calendar connection");
}

export async function getConnectionKey(userId: string, connectorId: string) {
  const a = await admin();
  const { data } = await a
    .from("app_user_connections")
    .select("connection_key_ciphertext")
    .eq("user_id", userId)
    .eq("connector_id", connectorId)
    .maybeSingle();
  return data ? decryptConnectionKey(data.connection_key_ciphertext) : null;
}

export async function loadPrefs(userId: string): Promise<Prefs> {
  const a = await admin();
  const { data } = await a.from("notification_preferences").select("*").eq("user_id", userId).maybeSingle();
  return data ? { ...DEFAULT_PREFS, ...data } : DEFAULT_PREFS;
}

/* ---------------- Connect / disconnect ---------------- */

export async function recordConnected(userId: string, key: string) {
  const a = await admin();
  const provider = calendarProvider;
  let account: { id: string | null; email: string | null } = { id: null, email: null };
  try {
    account = await provider.getAccount(key);
  } catch {
    /* account lookup is optional */
  }
  const now = new Date().toISOString();
  const { data: conn, error } = await a
    .from("calendar_connections")
    .upsert(
      {
        user_id: userId,
        provider: provider.id,
        provider_account_id: account.id,
        provider_email: account.email,
        status: "active",
        scopes: provider.scopes,
        connected_at: now,
        last_error_code: null,
        updated_at: now,
      },
      { onConflict: "user_id,provider" },
    )
    .select("id")
    .single();
  if (error || !conn) throw new Error("Could not record calendar connection");
  await a.from("notification_preferences").upsert({ user_id: userId }, { onConflict: "user_id", ignoreDuplicates: true });
  return conn.id;
}

export async function disconnectCalendar(userId: string) {
  const a = await admin();
  const provider = calendarProvider;
  const key = await getConnectionKey(userId, provider.connectorId);
  if (key) {
    try {
      await disconnectAppUser({ gatewayBaseUrl: GATEWAY_BASE_URL, connectionAPIKey: key, connectorId: provider.connectorId });
    } catch (e) {
      console.error("[calendar] gateway disconnect failed", (e as Error).message);
    }
  }
  await a.from("app_user_connections").delete().eq("user_id", userId).eq("connector_id", provider.connectorId);
  const { data: conn } = await a
    .from("calendar_connections")
    .select("id")
    .eq("user_id", userId)
    .eq("provider", provider.id)
    .maybeSingle();
  if (conn) {
    await a.from("calendar_connections").update({ status: "disconnected", updated_at: new Date().toISOString() }).eq("id", conn.id);
    await a.from("calendar_sync_state").delete().eq("calendar_connection_id", conn.id);
    await purgeAttachmentContentForConnection(conn.id);
  }
  // Stop future notifications for calendar-sourced interviews.
  const { data: evs } = await a.from("interview_events").select("id").eq("interviewer_id", userId).eq("source", "calendar");
  const ids = (evs ?? []).map((e) => e.id);
  if (ids.length) {
    await a
      .from("notification_deliveries")
      .update({ status: "cancelled", updated_at: new Date().toISOString() })
      .in("interview_event_id", ids)
      .eq("status", "scheduled");
  }
}

async function purgeAttachmentContentForConnection(connectionId: string) {
  const a = await admin();
  const { data: evs } = await a.from("normalized_calendar_events").select("id").eq("calendar_connection_id", connectionId);
  const evIds = (evs ?? []).map((e) => e.id);
  if (!evIds.length) return;
  const { data: atts } = await a.from("calendar_event_attachments").select("id").in("normalized_calendar_event_id", evIds);
  const attIds = (atts ?? []).map((x) => x.id);
  if (attIds.length) {
    await a.from("calendar_attachment_content").delete().in("attachment_id", attIds);
    await a.from("calendar_event_attachments").update({ processing_status: "purged" }).in("id", attIds);
  }
}

export async function purgeExpiredAttachmentContent() {
  const a = await admin();
  const { data } = await a
    .from("calendar_attachment_content")
    .delete()
    .lt("retention_expires_at", new Date().toISOString())
    .select("attachment_id");
  const ids = (data ?? []).map((d) => d.attachment_id);
  if (ids.length) await a.from("calendar_event_attachments").update({ processing_status: "purged" }).in("id", ids);
  return ids.length;
}

/* ---------------- Synchronisation ---------------- */

type SyncResult = { status: "ok" | "needs_reauthorization" | "error" | "not_connected"; processed: number };

export async function syncUser(userId: string): Promise<SyncResult> {
  const a = await admin();
  const provider = calendarProvider;
  const { data: conn } = await a
    .from("calendar_connections")
    .select("id, status, provider_email")
    .eq("user_id", userId)
    .eq("provider", provider.id)
    .maybeSingle();
  if (!conn || conn.status === "disconnected") return { status: "not_connected", processed: 0 };
  const key = await getConnectionKey(userId, provider.connectorId);
  if (!key) return { status: "not_connected", processed: 0 };
  const prefs = await loadPrefs(userId);
  const nowIso = new Date().toISOString();
  await a.from("calendar_connections").update({ last_sync_attempt_at: nowIso }).eq("id", conn.id);

  const ownDomain = conn.provider_email?.split("@")[1]?.toLowerCase() ?? null;
  const { data: state } = await a
    .from("calendar_sync_state")
    .select("*")
    .eq("calendar_connection_id", conn.id)
    .eq("external_calendar_id", "primary")
    .maybeSingle();

  const start = new Date();
  const end = new Date(start.getTime() + WINDOW_DAYS * 86_400_000);
  try {
    let page;
    const windowStale = state?.last_window_end && new Date(state.last_window_end).getTime() < end.getTime() - 86_400_000;
    if (state?.delta_token && !windowStale) {
      try {
        page = await provider.deltaSync(key, state.delta_token, ownDomain);
      } catch (e) {
        if (!(e instanceof DeltaExpiredError)) throw e;
        page = await provider.initialSync(key, start, end, ownDomain);
      }
    } else {
      page = await provider.initialSync(key, start, end, ownDomain);
    }
    let processed = 0;
    if (prefs && (await detectionEnabled(userId))) {
      for (const ev of page.events) {
        await processEvent(userId, conn.id, ev, key, provider);
        processed++;
      }
    }
    await a.from("calendar_sync_state").upsert(
      {
        calendar_connection_id: conn.id,
        external_calendar_id: "primary",
        delta_token: page.deltaToken,
        last_window_start: state?.delta_token && !windowStale ? state.last_window_start : start.toISOString(),
        last_window_end: state?.delta_token && !windowStale ? state.last_window_end : end.toISOString(),
        last_successful_sync_at: nowIso,
        updated_at: nowIso,
      },
      { onConflict: "calendar_connection_id,external_calendar_id" },
    );
    await a
      .from("calendar_connections")
      .update({ status: "active", last_successful_sync_at: nowIso, last_error_code: null, updated_at: nowIso })
      .eq("id", conn.id);
    return { status: "ok", processed };
  } catch (e) {
    const reauth = e instanceof ProviderAuthError;
    const code = reauth ? "reauthorization_required" : (e as Error).message.slice(0, 60);
    console.error("[calendar] sync failed", code);
    await a
      .from("calendar_connections")
      .update({
        status: reauth ? "needs_reauthorization" : "error",
        last_error_code: code,
        last_error_at: nowIso,
        updated_at: nowIso,
      })
      .eq("id", conn.id);
    return { status: reauth ? "needs_reauthorization" : "error", processed: 0 };
  }
}

async function detectionEnabled(userId: string) {
  const a = await admin();
  const { data } = await a.from("notification_preferences").select("calendar_detection_enabled").eq("user_id", userId).maybeSingle();
  return data?.calendar_detection_enabled ?? true;
}

export async function processEvent(
  userId: string,
  connectionId: string,
  ev: NormalizedEvent,
  key: string,
  provider: CalendarProvider,
) {
  const a = await admin();
  const { data: existing } = await a
    .from("normalized_calendar_events")
    .select("id, starts_at, classification_status, linked_interview_event_id")
    .eq("calendar_connection_id", connectionId)
    .eq("external_event_id", ev.externalEventId)
    .maybeSingle();

  if (ev.removed || ev.isCancelled) {
    if (existing) {
      await a
        .from("normalized_calendar_events")
        .update({ is_cancelled: true, updated_at: new Date().toISOString() })
        .eq("id", existing.id);
      if (existing.linked_interview_event_id) await cancelInterview(existing.linked_interview_event_id);
    }
    return;
  }

  const row = {
    calendar_connection_id: connectionId,
    user_id: userId,
    external_event_id: ev.externalEventId,
    external_calendar_id: ev.externalCalendarId,
    subject: ev.subject,
    sanitized_description: ev.description,
    starts_at: ev.startsAt,
    ends_at: ev.endsAt,
    timezone: ev.timezone,
    organizer_identifier: ev.organizer,
    attendee_count: ev.attendeeCount,
    meeting_url: ev.meetingUrl,
    is_cancelled: false,
    is_recurring: ev.isRecurring,
    provider_last_modified_at: ev.lastModifiedAt,
    ical_uid: ev.icalUid ?? null,
    updated_at: new Date().toISOString(),
  };
  const { data: saved } = await a
    .from("normalized_calendar_events")
    .upsert(row, { onConflict: "calendar_connection_id,external_event_id" })
    .select("id, classification_status, linked_interview_event_id")
    .single();
  if (!saved) return;

  // User decisions are final — only reconcile timing for linked interviews.
  if (saved.linked_interview_event_id) {
    const timeChanged = existing && new Date(existing.starts_at).getTime() !== new Date(ev.startsAt).getTime();
    if (timeChanged) await rescheduleInterview(saved.linked_interview_event_id, ev.startsAt, ev.endsAt);
    return;
  }
  if (saved.classification_status === "dismissed" || saved.classification_status === "confirmed") return;

  // Recurring events are handled conservatively: never auto-drafted.
  let attachmentNames: string[] = [];
  const pre = classifyEvent({
    subject: ev.subject,
    description: ev.description,
    durationMinutes: (new Date(ev.endsAt).getTime() - new Date(ev.startsAt).getTime()) / 60_000,
    attendeeCount: ev.attendeeCount,
    hasExternalAttendee: ev.hasExternalAttendee,
    attachmentNames: [],
    isAllDay: ev.isAllDay,
  });
  if (pre.confidence >= 0.3 && ev.hasAttachments) {
    try {
      const metas = await provider.listAttachmentMeta(key, ev.externalEventId);
      attachmentNames = metas.map((m) => m.filename);
      for (const m of metas) {
        const sup = attachmentSupport({ filename: m.filename, mimeType: m.mimeType, size: m.size, kind: m.kind });
        await a.from("calendar_event_attachments").upsert(
          {
            normalized_calendar_event_id: saved.id,
            external_attachment_id: m.externalAttachmentId,
            attachment_type: m.kind,
            source_kind: m.kind === "reference" ? "drive_reference" : "calendar_event",
            filename: m.filename,
            mime_type: m.mimeType,
            byte_size: m.size,
            document_classification: classifyDocument(m.filename),
            processing_status: sup.ok ? "discovered" : "unsupported",
            processing_error_code: sup.ok ? null : sup.reason,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "normalized_calendar_event_id,external_attachment_id" },
        );
      }
    } catch (e) {
      if (e instanceof ProviderAuthError) throw e;
    }
  }
  const result = attachmentNames.length
    ? classifyEvent({
        subject: ev.subject,
        description: ev.description,
        durationMinutes: (new Date(ev.endsAt).getTime() - new Date(ev.startsAt).getTime()) / 60_000,
        attendeeCount: ev.attendeeCount,
        hasExternalAttendee: ev.hasExternalAttendee,
        attachmentNames,
        isAllDay: ev.isAllDay,
      })
    : pre;
  let status: string = result.classification;
  if (status === "likely_interview" && ev.isRecurring) status = "possible_interview";

  await a.from("interview_classifications").upsert(
    {
      normalized_calendar_event_id: saved.id,
      classification: status as "likely_interview" | "possible_interview" | "not_interview",
      confidence_score: result.confidence,
      detected_role_title: result.detectedRole,
      detected_candidate_display_name: result.detectedCandidate,
      detected_interview_stage: result.detectedStage,
      detection_reasons: result.reasons,
      classifier_version: CLASSIFIER_VERSION,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "normalized_calendar_event_id" },
  );
  await a.from("normalized_calendar_events").update({ classification_status: status }).eq("id", saved.id);

  if (status === "likely_interview") {
    // Draft interview — visible, but nothing is generated or sent until the user confirms.
    const { data: prof } = await a.from("profiles").select("group_id").eq("id", userId).maybeSingle();
    const draft = await upsertCalendarInterview(userId, ev.externalEventId, {
      created_by: userId,
      group_id: prof?.group_id ?? null,
      source_calendar_event_id: saved.id,
      confirmation_status: "draft",
      role_title: result.detectedRole ?? ev.subject?.slice(0, 160) ?? "Interview",
      candidate_display_name: result.detectedCandidate ?? "Candidate",
      interview_stage: result.detectedStage ?? "Interview",
      starts_at: ev.startsAt,
      duration_minutes: Math.round((new Date(ev.endsAt).getTime() - new Date(ev.startsAt).getTime()) / 60_000),
    });
    if (draft) await a.from("normalized_calendar_events").update({ linked_interview_event_id: draft.id }).eq("id", saved.id);
    await matchInvitation(userId, saved.id).catch((e) => {
      if (e instanceof ProviderAuthError) return;
      console.error("[gmail] match failed", (e as Error).message.slice(0, 40));
    });
  }
}

/* ---------------- Optional Gmail invitation matching ---------------- */

export async function hasGmail(userId: string) {
  return Boolean(await getConnectionKey(userId, GMAIL_CONNECTOR_ID).catch(() => null));
}

/** Match one detected/confirmed event to its Gmail invitation. Runs at most once per event. */
export async function matchInvitation(userId: string, calendarEventId: string) {
  const a = await admin();
  const { data: done } = await a.from("invitation_matches").select("status").eq("normalized_calendar_event_id", calendarEventId).maybeSingle();
  if (done) return done.status;
  const key = await getConnectionKey(userId, GMAIL_CONNECTOR_ID).catch(() => null);
  if (!key) return null;
  const { data: cev } = await a
    .from("normalized_calendar_events")
    .select("id, subject, ical_uid")
    .eq("id", calendarEventId)
    .eq("user_id", userId)
    .maybeSingle();
  if (!cev) return null;
  let result;
  try {
    result = await findMatchingInvitation(key, cev.subject, cev.ical_uid);
  } catch (e) {
    if (e instanceof ProviderAuthError) throw e;
    await a.from("invitation_matches").upsert({ normalized_calendar_event_id: cev.id, user_id: userId, status: "error" });
    return "error";
  }
  if (result.status === "matched") {
    for (const m of result.attachments) {
      const sup = attachmentSupport({ filename: m.filename, mimeType: m.mimeType, size: m.size, kind: m.kind });
      await a.from("calendar_event_attachments").upsert(
        {
          normalized_calendar_event_id: cev.id,
          external_attachment_id: m.externalAttachmentId,
          attachment_type: m.kind,
          source_kind: "gmail_invitation",
          gmail_message_id: result.messageId,
          filename: m.filename,
          mime_type: m.mimeType,
          byte_size: m.size,
          document_classification: classifyDocument(m.filename),
          processing_status: sup.ok ? "discovered" : "unsupported",
          processing_error_code: sup.ok ? null : sup.reason,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "normalized_calendar_event_id,external_attachment_id" },
      );
    }
  }
  await a.from("invitation_matches").upsert({
    normalized_calendar_event_id: cev.id,
    user_id: userId,
    status: result.status,
    gmail_message_id: result.status === "matched" ? result.messageId : null,
  });
  return result.status;
}

export async function disconnectGmail(userId: string) {
  const a = await admin();
  const key = await getConnectionKey(userId, GMAIL_CONNECTOR_ID).catch(() => null);
  if (key) {
    try {
      await disconnectAppUser({ gatewayBaseUrl: GATEWAY_BASE_URL, connectionAPIKey: key, connectorId: GMAIL_CONNECTOR_ID });
    } catch (e) {
      console.error("[gmail] gateway disconnect failed", (e as Error).message.slice(0, 60));
    }
  }
  await a.from("app_user_connections").delete().eq("user_id", userId).eq("connector_id", GMAIL_CONNECTOR_ID);
  const { data: evs } = await a.from("normalized_calendar_events").select("id").eq("user_id", userId);
  const evIds = (evs ?? []).map((e) => e.id);
  if (evIds.length) {
    const { data: atts } = await a
      .from("calendar_event_attachments")
      .select("id")
      .in("normalized_calendar_event_id", evIds)
      .eq("source_kind", "gmail_invitation");
    const ids = (atts ?? []).map((x) => x.id);
    if (ids.length) {
      await a.from("calendar_attachment_content").delete().in("attachment_id", ids);
      await a.from("calendar_event_attachments").delete().in("id", ids);
    }
  }
  await a.from("invitation_matches").delete().eq("user_id", userId);
}

async function upsertCalendarInterview(
  userId: string,
  externalEventId: string,
  fields: Record<string, unknown>,
): Promise<{ id: string } | null> {
  const a = await admin();
  const { data: found } = await a
    .from("interview_events")
    .select("id, confirmation_status")
    .eq("interviewer_id", userId)
    .eq("source", "calendar")
    .eq("external_event_id", externalEventId)
    .maybeSingle();
  if (found) {
    // Never downgrade a confirmed interview back to a draft.
    if (found.confirmation_status === "confirmed" && fields["confirmation_status"] === "draft") return found;
    await a.from("interview_events").update(fields as never).eq("id", found.id);
    return found;
  }
  const { data } = await a
    .from("interview_events")
    .insert({ ...fields, interviewer_id: userId, source: "calendar", external_event_id: externalEventId } as never)
    .select("id")
    .single();
  return data;
}

async function cancelInterview(interviewId: string) {
  const a = await admin();
  await a.from("interview_events").update({ status: "cancelled", updated_at: new Date().toISOString() }).eq("id", interviewId);
  await a
    .from("notification_deliveries")
    .update({ status: "cancelled", updated_at: new Date().toISOString() })
    .eq("interview_event_id", interviewId)
    .eq("status", "scheduled");
  await a
    .from("preparation_schedules")
    .update({ preparation_status: "cancelled", refresher_status: "cancelled" })
    .eq("interview_event_id", interviewId)
    .in("preparation_status", ["scheduled"]);
}

async function rescheduleInterview(interviewId: string, startsAt: string, endsAt: string) {
  const a = await admin();
  await a
    .from("interview_events")
    .update({
      starts_at: startsAt,
      duration_minutes: Math.round((new Date(endsAt).getTime() - new Date(startsAt).getTime()) / 60_000),
      status: "scheduled",
      updated_at: new Date().toISOString(),
    })
    .eq("id", interviewId);
  await scheduleDeliveries(interviewId);
}

/* ---------------- Delivery scheduling ---------------- */

export async function scheduleDeliveries(interviewId: string) {
  const a = await admin();
  const { data: ev } = await a
    .from("interview_events")
    .select("id, interviewer_id, starts_at, status, confirmation_status")
    .eq("id", interviewId)
    .maybeSingle();
  if (!ev) return;
  // Cancel anything scheduled for a previous time; the idempotency key encodes start time.
  await a
    .from("notification_deliveries")
    .update({ status: "cancelled", updated_at: new Date().toISOString() })
    .eq("interview_event_id", interviewId)
    .eq("status", "scheduled")
    .not("idempotency_key", "like", `%:${new Date(ev.starts_at).toISOString()}`);
  if (ev.status !== "scheduled" || ev.confirmation_status !== "confirmed") return;

  const prefs = await loadPrefs(ev.interviewer_id);
  const now = new Date();
  const start = new Date(ev.starts_at);
  const prepAt = prefs.email_preparation_enabled ? computePreparationAt(start, prefs, now) : null;
  const refAt = computeRefresherAt(start, prefs, now);

  await a.from("preparation_schedules").upsert(
    {
      interview_event_id: interviewId,
      preparation_delivery_at: (prepAt ?? start).toISOString(),
      refresher_delivery_at: refAt?.toISOString() ?? null,
      preparation_status: prepAt ? "scheduled" : "skipped",
      refresher_status: refAt ? "scheduled" : "skipped",
      source_timezone: prefs.timezone,
      updated_at: now.toISOString(),
    },
    { onConflict: "interview_event_id" },
  );
  const rows = [
    prepAt && { type: "preparation" as const, at: prepAt },
    refAt && { type: "refresher" as const, at: refAt },
  ].filter(Boolean) as { type: "preparation" | "refresher"; at: Date }[];
  for (const r of rows) {
    await a.from("notification_deliveries").upsert(
      {
        user_id: ev.interviewer_id,
        interview_event_id: interviewId,
        notification_type: r.type,
        scheduled_for: r.at.toISOString(),
        idempotency_key: deliveryKey(interviewId, r.type, ev.starts_at),
      },
      { onConflict: "idempotency_key", ignoreDuplicates: true },
    );
  }
}

export async function rescheduleAllForUser(userId: string) {
  const a = await admin();
  const { data } = await a
    .from("interview_events")
    .select("id")
    .eq("interviewer_id", userId)
    .eq("status", "scheduled")
    .eq("confirmation_status", "confirmed")
    .gte("starts_at", new Date().toISOString());
  for (const e of data ?? []) await scheduleDeliveries(e.id);
}

/* ---------------- Delivery processing ---------------- */

export async function processDueDeliveries(limit = 25) {
  const a = await admin();
  const { sendTemplateEmail } = await import("@/lib/email-templates/send-email");
  const { generatePrep } = await import("@/lib/readiness.server");
  const nowIso = new Date().toISOString();
  const { data: due } = await a
    .from("notification_deliveries")
    .select("*")
    .eq("status", "scheduled")
    .lte("scheduled_for", nowIso)
    .order("scheduled_for")
    .limit(limit);
  let delivered = 0;
  for (const d of due ?? []) {
    // Claim atomically so overlapping cron runs never double-send.
    const { data: claimed } = await a
      .from("notification_deliveries")
      .update({ status: "processing", attempted_at: nowIso })
      .eq("id", d.id)
      .eq("status", "scheduled")
      .select("id")
      .maybeSingle();
    if (!claimed) continue;
    try {
      const [{ data: ev }, { data: prof }, prefs] = await Promise.all([
        a.from("interview_events").select("id, role_title, interview_stage, starts_at, status").eq("id", d.interview_event_id).maybeSingle(),
        a.from("profiles").select("email, display_name, full_name").eq("id", d.user_id).maybeSingle(),
        loadPrefs(d.user_id),
      ]);
      const enabled = d.notification_type === "preparation" ? prefs.email_preparation_enabled : prefs.email_refresher_enabled;
      if (!ev || ev.status !== "scheduled" || !prof?.email || !enabled || new Date(ev.starts_at).getTime() < Date.now()) {
        await a.from("notification_deliveries").update({ status: "skipped", updated_at: nowIso }).eq("id", d.id);
        continue;
      }
      const firstName = (prof.display_name || prof.full_name || "").split(" ")[0] || undefined;
      const when = new Date(ev.starts_at).toLocaleString("en-GB", {
        weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: prefs.timezone,
      });
      let sessionId: string | null = null;
      if (d.notification_type === "preparation") {
        const r = await generatePrep(a, d.user_id, ev.id);
        sessionId = r.sessionId;
        await sendTemplateEmail("interview-prep", prof.email, {
          idempotencyKey: d.idempotency_key,
          templateData: { firstName, roleTitle: ev.role_title, stage: ev.interview_stage, when, prepUrl: `${SITE_URL}/prep/${sessionId}` },
        });
      } else {
        const { data: sess } = await a
          .from("prep_sessions")
          .select("id")
          .eq("interview_event_id", ev.id)
          .order("generated_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        sessionId = sess?.id ?? null;
        const { data: qs } = sessionId
          ? await a.from("prep_questions").select("explanation").eq("prep_session_id", sessionId).order("position").limit(3)
          : { data: [] as { explanation: string }[] };
        const reminders = (qs ?? []).map((q) => q.explanation.split(/(?<=\.)\s/)[0]!.slice(0, 220));
        await sendTemplateEmail("interview-refresher", prof.email, {
          idempotencyKey: d.idempotency_key,
          templateData: {
            firstName, roleTitle: ev.role_title, stage: ev.interview_stage, when, reminders,
            prepUrl: sessionId ? `${SITE_URL}/prep/${sessionId}` : `${SITE_URL}/interviews/${ev.id}`,
          },
        });
      }
      await a
        .from("notification_deliveries")
        .update({ status: "delivered", delivered_at: new Date().toISOString(), prep_session_id: sessionId })
        .eq("id", d.id);
      await a
        .from("preparation_schedules")
        .update(
          d.notification_type === "preparation"
            ? { preparation_status: "delivered", prep_session_id: sessionId }
            : { refresher_status: "delivered" },
        )
        .eq("interview_event_id", ev.id);
      delivered++;
    } catch (e) {
      const retry = d.retry_count + 1;
      console.error("[calendar] delivery failed", d.notification_type, (e as Error).message.slice(0, 80));
      await a
        .from("notification_deliveries")
        .update({
          status: retry >= 3 ? "failed" : "scheduled",
          retry_count: retry,
          failed_at: retry >= 3 ? new Date().toISOString() : null,
          error_code: "send_failed",
          scheduled_for: new Date(Date.now() + retry * 5 * 60_000).toISOString(),
        })
        .eq("id", d.id);
    }
  }
  return { delivered, considered: due?.length ?? 0 };
}

/* ---------------- Confirmation ---------------- */

export type ConfirmInput = {
  calendarEventId: string;
  roleTitle: string;
  candidateDisplayName: string;
  stage: string;
  competencies: string[];
  responsibility?: string | null;
  approvedAttachmentIds: string[];
};

export async function confirmCalendarInterview(userId: string, input: ConfirmInput) {
  const a = await admin();
  const { data: cev } = await a
    .from("normalized_calendar_events")
    .select("*")
    .eq("id", input.calendarEventId)
    .eq("user_id", userId)
    .maybeSingle();
  if (!cev) throw new Error("Calendar event not found");
  if (cev.is_cancelled) throw new Error("This event was cancelled");

  const { data: prof } = await a.from("profiles").select("group_id").eq("id", userId).maybeSingle();
  const fields = {
    role_title: input.roleTitle.trim(),
    candidate_display_name: input.candidateDisplayName.trim(),
    interview_stage: input.stage.trim(),
    starts_at: cev.starts_at,
    duration_minutes: Math.round((new Date(cev.ends_at).getTime() - new Date(cev.starts_at).getTime()) / 60_000),
    confirmation_status: "confirmed",
    status: "scheduled",
    updated_at: new Date().toISOString(),
  };
  let interviewId = cev.linked_interview_event_id;
  if (interviewId) {
    await a.from("interview_events").update(fields).eq("id", interviewId).eq("interviewer_id", userId);
  } else {
    const ins = await upsertCalendarInterview(userId, cev.external_event_id, {
      ...fields,
      created_by: userId,
      group_id: prof?.group_id ?? null,
      source_calendar_event_id: cev.id,
    });
    if (!ins) throw new Error("Could not save interview");
    interviewId = ins.id;
  }

  // Approved attachments from this invitation only.
  const approved = input.approvedAttachmentIds.length
    ? (
        await a
          .from("calendar_event_attachments")
          .select("*")
          .eq("normalized_calendar_event_id", cev.id)
          .in("id", input.approvedAttachmentIds)
          .neq("processing_status", "unsupported")
      ).data ?? []
    : [];
  const gmailKey = approved.some((x) => x.source_kind === "gmail_invitation")
    ? await getConnectionKey(userId, GMAIL_CONNECTOR_ID).catch(() => null)
    : null;
  let jd = "";
  let cv = "";
  const retention = new Date(new Date(cev.ends_at).getTime() + ATTACHMENT_RETENTION_DAYS * 86_400_000).toISOString();
  for (const att of approved) {
    await a.from("calendar_event_attachments").update({ approved_for_generation: true, processing_status: "processing" }).eq("id", att.id);
    try {
      if (att.source_kind !== "gmail_invitation" || !gmailKey) throw new Error("unavailable");
      const file = await getInvitationAttachment(gmailKey, att.external_attachment_id);
      const raw = file ? Buffer.from(file.base64, "base64") : null;
      const sup = file && raw && attachmentSupport({ filename: att.filename, mimeType: file.mime, size: raw.length, kind: "file" });
      if (!file || !raw || !sup || !sup.ok) throw new Error(sup && !sup.ok ? sup.reason : "unsupported");
      const sig = verifyFileSignature(new Uint8Array(raw), sup.mime);
      if (!sig.ok) throw new Error(sig.reason);
      const text = (await extractText(att.filename, sup.mime, file.base64))?.slice(0, MAX_EXTRACTED_CHARS);
      if (!text) throw new Error("empty");
      await a.from("calendar_attachment_content").upsert({ attachment_id: att.id, extracted_text: text, retention_expires_at: retention });
      await a
        .from("calendar_event_attachments")
        .update({ processing_status: "extracted", retention_expires_at: retention, extraction_metadata: { chars: text.length } })
        .eq("id", att.id);
      if (att.document_classification === "cv") cv += `${text}\n`;
      else jd += `${text}\n`;
    } catch (e) {
      await a
        .from("calendar_event_attachments")
        .update({ processing_status: "failed", processing_error_code: (e as Error).message.slice(0, 40) })
        .eq("id", att.id);
    }
  }

  const ctx = {
    roleTitle: input.roleTitle,
    stage: input.stage,
    competencies: input.competencies,
    responsibility: input.responsibility,
    jobDescription: jd.trim() || cev.sanitized_description,
    candidateProfile: cv.trim() || null,
  };
  const usedGmail = approved.some((x) => x.source_kind === "gmail_invitation");
  const sources = ["calendar_event", usedGmail ? "gmail_invitation" : null, jd ? "job_description" : null, cv ? "candidate_profile" : null].filter(Boolean);
  await a.from("interview_contexts").upsert(
    {
      interview_event_id: interviewId,
      job_description_text: ctx.jobDescription?.slice(0, 20000) || null,
      candidate_profile_text: ctx.candidateProfile?.slice(0, 12000) || null,
      interviewer_responsibility: input.responsibility?.trim() || null,
      competencies: input.competencies,
      company_principles: [],
      context_sources: sources,
      context_completeness_score: contextCompleteness(ctx),
    },
    { onConflict: "interview_event_id" },
  );
  await a
    .from("normalized_calendar_events")
    .update({ classification_status: "confirmed", linked_interview_event_id: interviewId })
    .eq("id", cev.id);
  await a
    .from("interview_classifications")
    .update({ confirmed_by_user: true, confirmed_at: new Date().toISOString() })
    .eq("normalized_calendar_event_id", cev.id);
  await scheduleDeliveries(interviewId!);
  return { interviewId: interviewId!, attachmentsUsed: approved.length };
}

export async function dismissCalendarEvent(userId: string, calendarEventId: string) {
  const a = await admin();
  const { data: cev } = await a
    .from("normalized_calendar_events")
    .select("id, linked_interview_event_id")
    .eq("id", calendarEventId)
    .eq("user_id", userId)
    .maybeSingle();
  if (!cev) throw new Error("Calendar event not found");
  if (cev.linked_interview_event_id) {
    const { data: ev } = await a
      .from("interview_events")
      .select("id, confirmation_status")
      .eq("id", cev.linked_interview_event_id)
      .maybeSingle();
    // Only remove unconfirmed drafts with no preparation; confirmed interviews keep their evidence.
    if (ev?.confirmation_status === "draft") {
      const { count } = await a.from("prep_sessions").select("id", { count: "exact", head: true }).eq("interview_event_id", ev.id);
      if (!count) await a.from("interview_events").delete().eq("id", ev.id);
    }
  }
  await a.from("normalized_calendar_events").update({ classification_status: "dismissed", linked_interview_event_id: null }).eq("id", cev.id);
}

/* ---------------- Attachment text extraction ---------------- */

async function extractText(filename: string, mime: string, base64: string): Promise<string | null> {
  if (mime === "text/plain") return Buffer.from(base64, "base64").toString("utf8").slice(0, 12000);
  const apiKey = process.env["LOVABLE_API_KEY"];
  if (!apiKey) return null;
  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Lovable-API-Key": apiKey, "X-Lovable-AIG-SDK": "fetch" },
    body: JSON.stringify({
      model: "google/gemini-3.7-flash",
      messages: [
        {
          role: "system",
          content:
            "Extract factual, job-relevant content from the document for interview preparation: role responsibilities, required skills, and the candidate's stated experience and projects. Omit contact details, age, gender, nationality, photos, family status, health and any protected characteristics. Do not evaluate or score anyone. Plain text, max 600 words.",
        },
        {
          role: "user",
          content: [
            { type: "text", text: "Extract the relevant content." },
            { type: "file", file: { filename, file_data: `data:${mime};base64,${base64}` } },
          ],
        },
      ],
    }),
  });
  if (!res.ok) return null;
  const json = await res.json();
  const text: string | undefined = json?.choices?.[0]?.message?.content;
  return text?.trim().slice(0, 12000) || null;
}
