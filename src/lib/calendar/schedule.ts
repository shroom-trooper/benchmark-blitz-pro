/** Pure scheduling and attachment rules for calendar-driven preparation. */

export type Prefs = {
  email_preparation_enabled: boolean;
  email_refresher_enabled: boolean;
  preparation_lead_minutes: number;
  refresher_lead_minutes: number;
  quiet_hours_start: number | null;
  quiet_hours_end: number | null;
  timezone: string;
};

export const DEFAULT_PREFS: Prefs = {
  email_preparation_enabled: false,
  email_refresher_enabled: false,
  preparation_lead_minutes: 1440,
  refresher_lead_minutes: 20,
  quiet_hours_start: 21,
  quiet_hours_end: 7,
  timezone: "UTC",
};

/** Local hour (0-23) of an instant in an IANA timezone. Falls back to UTC. */
export function localHour(at: Date, tz: string): number {
  try {
    const h = new Intl.DateTimeFormat("en-GB", { hour: "numeric", hourCycle: "h23", timeZone: tz }).format(at);
    return Number(h) % 24;
  } catch {
    return at.getUTCHours();
  }
}

export function inQuietHours(at: Date, prefs: Pick<Prefs, "quiet_hours_start" | "quiet_hours_end" | "timezone">) {
  const { quiet_hours_start: s, quiet_hours_end: e } = prefs;
  if (s === null || e === null || s === e) return false;
  const h = localHour(at, prefs.timezone);
  return s < e ? h >= s && h < e : h >= s || h < e;
}

/**
 * Preparation time: lead time before the interview, moved earlier out of quiet
 * hours (never later — it must arrive before the interview). If moving earlier
 * would put it in the past, send as soon as possible (now), still before start.
 */
export function computePreparationAt(startsAt: Date, prefs: Prefs, now: Date): Date | null {
  if (startsAt.getTime() <= now.getTime()) return null;
  let at = new Date(startsAt.getTime() - prefs.preparation_lead_minutes * 60_000);
  for (let i = 0; i < 24 && inQuietHours(at, prefs); i++) at = new Date(at.getTime() - 3_600_000);
  if (at.getTime() < now.getTime()) at = now;
  return at;
}

/** Refresher is just-in-time; skip it entirely if it falls in quiet hours or the past. */
export function computeRefresherAt(startsAt: Date, prefs: Prefs, now: Date): Date | null {
  if (!prefs.email_refresher_enabled) return null;
  const at = new Date(startsAt.getTime() - prefs.refresher_lead_minutes * 60_000);
  if (at.getTime() <= now.getTime()) return null;
  if (inQuietHours(at, prefs)) return null;
  return at;
}

export function deliveryKey(interviewId: string, type: "preparation" | "refresher", startsAtIso: string) {
  return `${type}:${interviewId}:${new Date(startsAtIso).toISOString()}`;
}

/* ---------------- Attachments ---------------- */

export const MAX_ATTACHMENT_BYTES = 5 * 1024 * 1024;
export const ALLOWED_MIME: Record<string, string> = {
  "application/pdf": "pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
  "text/plain": "txt",
};
const EXT_TO_MIME: Record<string, string> = {
  pdf: "application/pdf",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  txt: "text/plain",
};

export function attachmentSupport(a: { filename: string; mimeType: string | null; size: number | null; kind: string }):
  | { ok: true; mime: string }
  | { ok: false; reason: "not_a_file" | "unsupported_type" | "too_large" } {
  if (a.kind !== "file") return { ok: false, reason: "not_a_file" };
  const ext = a.filename.split(".").pop()?.toLowerCase() ?? "";
  const mime = a.mimeType && ALLOWED_MIME[a.mimeType] ? a.mimeType : EXT_TO_MIME[ext];
  if (!mime || ALLOWED_MIME[mime] !== ext) return { ok: false, reason: "unsupported_type" };
  if ((a.size ?? 0) > MAX_ATTACHMENT_BYTES) return { ok: false, reason: "too_large" };
  return { ok: true, mime };
}

export function classifyDocument(filename: string): "cv" | "job_description" | "scorecard" | "interview_guide" | "other" {
  const f = filename.toLowerCase();
  if (/\b(cv|resume|résumé|curriculum)/.test(f)) return "cv";
  if (/job[_ -]?desc|\bjd\b|role[_ -]?profile|vacancy/.test(f)) return "job_description";
  if (/scorecard|rubric/.test(f)) return "scorecard";
  if (/guide|kit|questions/.test(f)) return "interview_guide";
  return "other";
}

/** Strip HTML and truncate a calendar description; drop URLs with tokens. */
export function sanitizeDescription(html: string | null | undefined, max = 2000): string | null {
  if (!html) return null;
  const text = html
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/https?:\/\/\S+/g, "[link]")
    .replace(/\s+/g, " ")
    .trim();
  return text ? text.slice(0, max) : null;
}

export const ATTACHMENT_RETENTION_DAYS = 7;
