/** Pure helpers for invitation matching and file validation (no I/O, unit tested). */

export const MAX_EXTRACTED_CHARS = 60_000;

/** Extract the UID from an iCalendar payload (handles folded lines). */
export function parseIcsUid(ics: string): string | null {
  const unfolded = ics.replace(/\r?\n[ \t]/g, "");
  const m = /^UID(?:;[^:]*)?:(.+)$/m.exec(unfolded);
  return m?.[1]?.trim() || null;
}

/** Subject-only Gmail query. Never includes candidate names or free text beyond the event title. */
export function buildInvitationQuery(eventSubject: string | null): string | null {
  const s = (eventSubject ?? "").replace(/["\\]/g, " ").replace(/\s+/g, " ").trim().slice(0, 120);
  if (s.length < 3) return null;
  return `filename:ics subject:"${s}" newer_than:120d`;
}

/** Check the real file signature matches the claimed type; reject encrypted PDFs. */
export function verifyFileSignature(buf: Uint8Array, mime: string): { ok: true } | { ok: false; reason: string } {
  const head = String.fromCharCode(...buf.slice(0, 8));
  if (mime === "application/pdf") {
    if (!head.startsWith("%PDF")) return { ok: false, reason: "signature_mismatch" };
    const sample = String.fromCharCode(...buf.slice(0, Math.min(buf.length, 200_000)));
    if (sample.includes("/Encrypt")) return { ok: false, reason: "password_protected" };
    return { ok: true };
  }
  if (mime === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
    return head.startsWith("PK\u0003\u0004") ? { ok: true } : { ok: false, reason: "signature_mismatch" };
  }
  if (mime === "text/plain") {
    try {
      new TextDecoder("utf-8", { fatal: true }).decode(buf.slice(0, 65_536));
      return buf.slice(0, 4096).includes(0) ? { ok: false, reason: "binary_content" } : { ok: true };
    } catch {
      return { ok: false, reason: "invalid_text" };
    }
  }
  return { ok: false, reason: "unsupported_type" };
}

export const b64urlToB64 = (s: string) => s.replace(/-/g, "+").replace(/_/g, "/");
