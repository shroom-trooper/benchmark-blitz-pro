import { appUserReconnectRequired, callAsAppUser } from "@/integrations/lovable/appUserConnector";
import { ProviderAuthError, type AttachmentMeta } from "./provider";
import { b64urlToB64, buildInvitationQuery, parseIcsUid } from "./filecheck";
import { GATEWAY_BASE_URL } from "./google-calendar.server";

export const GMAIL_CONNECTOR_ID = "google_mail";
const READ_SCOPE = "https://www.googleapis.com/auth/gmail.readonly";
export const GMAIL_SCOPES = ["openid", "https://www.googleapis.com/auth/userinfo.email", READ_SCOPE];
const MAX_CANDIDATES = 5;

type Part = {
  partId?: string;
  mimeType?: string;
  filename?: string;
  body?: { attachmentId?: string; size?: number; data?: string };
  parts?: Part[];
};

async function gmail(key: string, path: string) {
  const res = await callAsAppUser({
    gatewayBaseUrl: GATEWAY_BASE_URL,
    connectionAPIKey: key,
    connectorId: GMAIL_CONNECTOR_ID,
    path: `/gmail/v1/users/me${path}`,
    requiredScopes: [READ_SCOPE],
  });
  if (await appUserReconnectRequired(res)) throw new ProviderAuthError();
  if (!res.ok) throw new Error(`gmail_${res.status}`); // never log bodies
  return res.json();
}

const flatten = (p?: Part): Part[] => (p ? [p, ...(p.parts ?? []).flatMap(flatten)] : []);

async function readPart(key: string, messageId: string, p: Part): Promise<string | null> {
  if (p.body?.data) return b64urlToB64(p.body.data);
  if (!p.body?.attachmentId) return null;
  const r = (await gmail(key, `/messages/${messageId}/attachments/${p.body.attachmentId}`)) as { data?: string };
  return r.data ? b64urlToB64(r.data) : null;
}

export type InvitationMatch =
  | { status: "matched"; messageId: string; attachments: AttachmentMeta[] }
  | { status: "no_match" | "skipped" };

/**
 * Locate the invitation email for ONE detected calendar event.
 * Only messages carrying an .ics whose UID exactly equals the event's iCalUID count.
 * The surrounding thread, replies and other messages are never read.
 */
export async function findMatchingInvitation(
  key: string,
  eventSubject: string | null,
  icalUid: string | null,
): Promise<InvitationMatch> {
  const q = buildInvitationQuery(eventSubject);
  if (!q || !icalUid) return { status: "skipped" };
  const list = (await gmail(key, `/messages?${new URLSearchParams({ q, maxResults: String(MAX_CANDIDATES) })}`)) as {
    messages?: { id: string }[];
  };
  for (const { id } of list.messages ?? []) {
    const msg = (await gmail(key, `/messages/${id}?format=full&fields=id,payload`)) as { payload?: Part };
    const parts = flatten(msg.payload);
    const cal = parts.find((p) => p.mimeType === "text/calendar" || p.filename?.toLowerCase().endsWith(".ics"));
    if (!cal) continue;
    const data = await readPart(key, id, cal);
    if (!data) continue;
    const uid = parseIcsUid(Buffer.from(data, "base64").toString("utf8"));
    if (uid !== icalUid) continue;
    const attachments = parts
      .filter((p) => p !== cal && p.filename && p.partId && p.body?.attachmentId && !p.filename.toLowerCase().endsWith(".ics"))
      .map((p) => ({
        externalAttachmentId: `gmail:${id}:${p.partId}`,
        kind: "file" as const,
        filename: p.filename!.slice(0, 200),
        mimeType: p.mimeType ?? null,
        size: p.body?.size ?? null,
      }));
    return { status: "matched", messageId: id, attachments };
  }
  return { status: "no_match" };
}

/** Download one approved attachment from the already-matched invitation message. */
export async function getInvitationAttachment(key: string, externalId: string): Promise<{ base64: string; mime: string } | null> {
  const [, messageId, partId] = externalId.split(":");
  if (!messageId || !partId) return null;
  const msg = (await gmail(key, `/messages/${messageId}?format=full&fields=payload`)) as { payload?: Part };
  const part = flatten(msg.payload).find((p) => p.partId === partId);
  if (!part) return null;
  const data = await readPart(key, messageId, part);
  return data ? { base64: data, mime: part.mimeType ?? "application/octet-stream" } : null;
}
