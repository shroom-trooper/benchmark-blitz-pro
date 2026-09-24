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
export const MICROSOFT_CONNECTOR_ID = "microsoft_outlook";
/** openid/profile/email: show which account is connected. offline_access: background sync. Calendars.Read: events + invite attachments. */
export const MICROSOFT_SCOPES = ["openid", "profile", "email", "offline_access", "Calendars.Read"];
const GRAPH_PREFIX = "https://graph.microsoft.com/v1.0";
const MAX_PAGES = 20;

type GraphEvent = {
  id: string;
  "@removed"?: unknown;
  subject?: string | null;
  body?: { content?: string | null } | null;
  bodyPreview?: string | null;
  start?: { dateTime: string; timeZone?: string } | null;
  end?: { dateTime: string; timeZone?: string } | null;
  originalStartTimeZone?: string | null;
  organizer?: { emailAddress?: { address?: string } } | null;
  attendees?: { emailAddress?: { address?: string } }[] | null;
  onlineMeeting?: { joinUrl?: string } | null;
  isCancelled?: boolean;
  isAllDay?: boolean;
  type?: string;
  seriesMasterId?: string | null;
  hasAttachments?: boolean;
  lastModifiedDateTime?: string | null;
};

async function graph(key: string, path: string, init?: RequestInit) {
  const res = await callAsAppUser({
    gatewayBaseUrl: GATEWAY_BASE_URL,
    connectionAPIKey: key,
    connectorId: MICROSOFT_CONNECTOR_ID,
    path,
    init: {
      ...init,
      headers: { Prefer: 'outlook.timezone="UTC", odata.maxpagesize=50', ...(init?.headers ?? {}) },
    },
    requiredScopes: ["Calendars.Read"],
  });
  if (await appUserReconnectRequired(res)) throw new ProviderAuthError();
  if (res.status === 410) throw new DeltaExpiredError();
  if (!res.ok) {
    // Status only — bodies may contain calendar content.
    throw new Error(`graph_${res.status}`);
  }
  return res.json();
}

const toIso = (dt?: { dateTime: string } | null) =>
  dt?.dateTime ? new Date(dt.dateTime.endsWith("Z") ? dt.dateTime : `${dt.dateTime}Z`).toISOString() : null;

const domainOf = (e?: string) => e?.split("@")[1]?.toLowerCase() ?? null;

export function normalizeGraphEvent(e: GraphEvent, ownDomain: string | null): NormalizedEvent | null {
  if (e["@removed"]) {
    return {
      externalEventId: e.id, externalCalendarId: "primary", subject: null, description: null,
      startsAt: new Date(0).toISOString(), endsAt: new Date(0).toISOString(), timezone: null,
      organizer: null, attendeeCount: null, hasExternalAttendee: false, meetingUrl: null,
      isCancelled: true, isRecurring: false, isAllDay: false, hasAttachments: false,
      lastModifiedAt: null, removed: true,
    };
  }
  const startsAt = toIso(e.start);
  const endsAt = toIso(e.end);
  if (!startsAt || !endsAt) return null;
  const emails = (e.attendees ?? []).map((a) => a.emailAddress?.address).filter(Boolean) as string[];
  const hasExternal = ownDomain ? emails.some((m) => domainOf(m) !== ownDomain) : false;
  return {
    externalEventId: e.id,
    externalCalendarId: "primary",
    subject: e.subject?.slice(0, 300) ?? null,
    description: sanitizeDescription(e.body?.content ?? e.bodyPreview),
    startsAt,
    endsAt,
    timezone: e.originalStartTimeZone ?? null,
    organizer: domainOf(e.organizer?.emailAddress?.address) ?? null,
    attendeeCount: emails.length,
    hasExternalAttendee: hasExternal,
    meetingUrl: e.onlineMeeting?.joinUrl ?? null,
    isCancelled: Boolean(e.isCancelled),
    isRecurring: e.type === "occurrence" || e.type === "seriesMaster" || Boolean(e.seriesMasterId),
    isAllDay: Boolean(e.isAllDay),
    hasAttachments: Boolean(e.hasAttachments),
    lastModifiedAt: e.lastModifiedDateTime ?? null,
  };
}

async function walk(key: string, first: string, ownDomain: string | null): Promise<SyncPage> {
  const events: NormalizedEvent[] = [];
  let next: string | null = first;
  let deltaToken: string | null = null;
  for (let i = 0; next && i < MAX_PAGES; i++) {
    const page: { value?: GraphEvent[]; "@odata.nextLink"?: string; "@odata.deltaLink"?: string } =
      await graph(key, next);
    for (const g of page.value ?? []) {
      const n = normalizeGraphEvent(g, ownDomain);
      if (n) events.push(n);
    }
    next = page["@odata.nextLink"]?.replace(GRAPH_PREFIX, "") ?? null;
    if (page["@odata.deltaLink"]) deltaToken = page["@odata.deltaLink"].replace(GRAPH_PREFIX, "");
  }
  return { events, deltaToken };
}

export const microsoftProvider: CalendarProvider = {
  id: "microsoft",
  connectorId: MICROSOFT_CONNECTOR_ID,
  scopes: MICROSOFT_SCOPES,
  initialSync(key, start, end, ownDomain) {
    const q = new URLSearchParams({ startDateTime: start.toISOString(), endDateTime: end.toISOString() });
    return walk(key, `/me/calendarView/delta?${q}`, ownDomain);
  },
  deltaSync(key, deltaToken, ownDomain) {
    return walk(key, deltaToken, ownDomain);
  },
  async getEvent(key, id, ownDomain) {
    const e = (await graph(key, `/me/events/${encodeURIComponent(id)}`)) as GraphEvent;
    return normalizeGraphEvent(e, ownDomain);
  },
  async listAttachmentMeta(key, id): Promise<AttachmentMeta[]> {
    const r: { value?: { id: string; name: string; contentType?: string; size?: number; "@odata.type"?: string }[] } =
      await graph(key, `/me/events/${encodeURIComponent(id)}/attachments?$select=id,name,contentType,size`);
    return (r.value ?? []).map((a) => ({
      externalAttachmentId: a.id,
      kind: a["@odata.type"]?.includes("fileAttachment")
        ? "file"
        : a["@odata.type"]?.includes("reference")
          ? "reference"
          : "item",
      filename: a.name?.slice(0, 200) ?? "attachment",
      mimeType: a.contentType ?? null,
      size: a.size ?? null,
    }));
  },
  async getAttachment(key, id, attId) {
    const a: { contentBytes?: string; contentType?: string; "@odata.type"?: string } = await graph(
      key,
      `/me/events/${encodeURIComponent(id)}/attachments/${encodeURIComponent(attId)}`,
    );
    if (!a.contentBytes || !a["@odata.type"]?.includes("fileAttachment")) return null;
    return { base64: a.contentBytes, mime: a.contentType ?? "application/octet-stream" };
  },
  async getAccount(key) {
    const me: { id?: string; mail?: string; userPrincipalName?: string } = await graph(
      key,
      "/me?$select=id,mail,userPrincipalName",
    );
    return { id: me.id ?? null, email: me.mail ?? me.userPrincipalName ?? null };
  },
};
