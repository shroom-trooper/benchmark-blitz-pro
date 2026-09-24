import { appUserReconnectRequired, callAsAppUser } from "@/integrations/lovable/appUserConnector";
import {
  DeltaExpiredError,
  ProviderAuthError,
  type AttachmentMeta,
  type CalendarProvider,
  type NormalizedEvent,
  type SyncPage,
} from "./provider";
import { sanitizeDescription } from "./schedule";

export const GATEWAY_BASE_URL = "https://connector-gateway.lovable.dev";
export const GOOGLE_CALENDAR_CONNECTOR_ID = "google_calendar";
const EVENTS_SCOPE = "https://www.googleapis.com/auth/calendar.events.readonly";
/** Identity (which account is connected) + read-only event access. */
export const GOOGLE_CALENDAR_SCOPES = ["openid", "https://www.googleapis.com/auth/userinfo.email", EVENTS_SCOPE];
const MAX_PAGES = 20;
const WINDOW_DAYS = 30;

export type GoogleEvent = {
  id: string;
  status?: string;
  summary?: string | null;
  description?: string | null;
  start?: { dateTime?: string; date?: string; timeZone?: string } | null;
  end?: { dateTime?: string; date?: string; timeZone?: string } | null;
  organizer?: { email?: string } | null;
  attendees?: { email?: string; resource?: boolean }[] | null;
  hangoutLink?: string | null;
  conferenceData?: { entryPoints?: { uri?: string; entryPointType?: string }[] } | null;
  recurringEventId?: string | null;
  recurrence?: string[] | null;
  attachments?: { fileId?: string; fileUrl?: string; title?: string; mimeType?: string }[] | null;
  updated?: string | null;
  iCalUID?: string | null;
};

async function gcal(key: string, path: string) {
  const res = await callAsAppUser({
    gatewayBaseUrl: GATEWAY_BASE_URL,
    connectionAPIKey: key,
    connectorId: GOOGLE_CALENDAR_CONNECTOR_ID,
    path: `/calendar/v3${path}`,
    requiredScopes: [EVENTS_SCOPE],
  });
  if (await appUserReconnectRequired(res)) throw new ProviderAuthError();
  if (res.status === 410) throw new DeltaExpiredError();
  if (!res.ok) throw new Error(`gcal_${res.status}`); // status only — bodies may hold event content
  return res.json();
}

const toIso = (t?: { dateTime?: string; date?: string } | null) =>
  t?.dateTime ? new Date(t.dateTime).toISOString() : t?.date ? new Date(`${t.date}T00:00:00Z`).toISOString() : null;
const domainOf = (e?: string | null) => e?.split("@")[1]?.toLowerCase() ?? null;

export function normalizeGoogleEvent(e: GoogleEvent, ownDomain: string | null): NormalizedEvent | null {
  if (e.status === "cancelled") {
    const zero = new Date(0).toISOString();
    return {
      externalEventId: e.id, externalCalendarId: "primary", subject: null, description: null,
      startsAt: zero, endsAt: zero, timezone: null, organizer: null, attendeeCount: null,
      hasExternalAttendee: false, meetingUrl: null, isCancelled: true, isRecurring: false,
      isAllDay: false, hasAttachments: false, lastModifiedAt: null, removed: true, icalUid: null,
    };
  }
  const startsAt = toIso(e.start);
  const endsAt = toIso(e.end);
  if (!startsAt || !endsAt) return null;
  const emails = (e.attendees ?? []).filter((a) => !a.resource).map((a) => a.email).filter(Boolean) as string[];
  const video = e.conferenceData?.entryPoints?.find((p) => p.entryPointType === "video")?.uri ?? e.hangoutLink ?? null;
  return {
    externalEventId: e.id,
    externalCalendarId: "primary",
    subject: e.summary?.slice(0, 300) ?? null,
    description: sanitizeDescription(e.description),
    startsAt,
    endsAt,
    timezone: e.start?.timeZone ?? null,
    organizer: domainOf(e.organizer?.email),
    attendeeCount: emails.length,
    hasExternalAttendee: ownDomain ? emails.some((m) => domainOf(m) !== ownDomain) : false,
    meetingUrl: video,
    isCancelled: false,
    isRecurring: Boolean(e.recurringEventId || e.recurrence?.length),
    isAllDay: Boolean(e.start?.date && !e.start?.dateTime),
    hasAttachments: Boolean(e.attachments?.length),
    lastModifiedAt: e.updated ?? null,
    icalUid: e.iCalUID ?? null,
  };
}

/** Incremental results are not window-bounded by Google; keep only the next 30 days. */
export function inWindow(ev: NormalizedEvent, now = Date.now()) {
  if (ev.removed) return true;
  const s = new Date(ev.startsAt).getTime();
  const e = new Date(ev.endsAt).getTime();
  return e >= now && s <= now + WINDOW_DAYS * 86_400_000;
}

async function walk(key: string, base: URLSearchParams, ownDomain: string | null): Promise<SyncPage> {
  const events: NormalizedEvent[] = [];
  let pageToken: string | null = null;
  let deltaToken: string | null = null;
  for (let i = 0; i < MAX_PAGES; i++) {
    const q = new URLSearchParams(base);
    if (pageToken) q.set("pageToken", pageToken);
    const page: { items?: GoogleEvent[]; nextPageToken?: string; nextSyncToken?: string } = await gcal(
      key,
      `/calendars/primary/events?${q}`,
    );
    for (const g of page.items ?? []) {
      const n = normalizeGoogleEvent(g, ownDomain);
      if (n && inWindow(n)) events.push(n);
    }
    if (page.nextSyncToken) deltaToken = page.nextSyncToken;
    pageToken = page.nextPageToken ?? null;
    if (!pageToken) break;
  }
  return { events, deltaToken };
}

export const googleCalendarProvider: CalendarProvider = {
  id: "google",
  connectorId: GOOGLE_CALENDAR_CONNECTOR_ID,
  scopes: GOOGLE_CALENDAR_SCOPES,
  initialSync(key, start, end, ownDomain) {
    const q = new URLSearchParams({
      timeMin: start.toISOString(),
      timeMax: end.toISOString(),
      singleEvents: "true",
      maxResults: "250",
    });
    return walk(key, q, ownDomain);
  },
  deltaSync(key, token, ownDomain) {
    return walk(key, new URLSearchParams({ syncToken: token, singleEvents: "true", maxResults: "250" }), ownDomain);
  },
  async getEvent(key, id, ownDomain) {
    return normalizeGoogleEvent((await gcal(key, `/calendars/primary/events/${encodeURIComponent(id)}`)) as GoogleEvent, ownDomain);
  },
  /** Google Calendar attachments are Drive links — recorded as references, never fetched in this phase. */
  async listAttachmentMeta(key, id): Promise<AttachmentMeta[]> {
    const e = (await gcal(key, `/calendars/primary/events/${encodeURIComponent(id)}`)) as GoogleEvent;
    return (e.attachments ?? []).map((a, i) => ({
      externalAttachmentId: `drive:${a.fileId ?? i}`,
      kind: "reference" as const,
      filename: (a.title ?? "Linked file").slice(0, 200),
      mimeType: a.mimeType ?? null,
      size: null,
    }));
  },
  async getAttachment() {
    return null;
  },
  async getAccount(key) {
    const r = (await gcal(key, "/calendars/primary")) as { id?: string };
    return { id: r.id ?? null, email: r.id?.includes("@") ? r.id : null };
  },
};
