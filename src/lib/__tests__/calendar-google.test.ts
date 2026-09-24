import { describe, expect, it } from "vitest";
import { buildInvitationQuery, parseIcsUid, verifyFileSignature } from "../calendar/filecheck";
import { inWindow, normalizeGoogleEvent } from "../calendar/google-calendar.server";
import { classifyEvent } from "../calendar/classifier";

const bytes = (s: string) => new Uint8Array([...s].map((c) => c.charCodeAt(0)));

describe("Google event normalization", () => {
  it("normalizes a timed event with external attendee and iCalUID", () => {
    const n = normalizeGoogleEvent(
      {
        id: "e1",
        summary: "Interview: Senior Engineer",
        start: { dateTime: "2026-10-01T10:00:00+02:00" },
        end: { dateTime: "2026-10-01T11:00:00+02:00" },
        attendees: [{ email: "me@acme.com" }, { email: "cand@gmail.com" }, { email: "room@acme.com", resource: true }],
        iCalUID: "uid-123@google.com",
      },
      "acme.com",
    )!;
    expect(n.startsAt).toBe("2026-10-01T08:00:00.000Z");
    expect(n.attendeeCount).toBe(2);
    expect(n.hasExternalAttendee).toBe(true);
    expect(n.icalUid).toBe("uid-123@google.com");
  });
  it("treats cancelled items as removals", () => {
    expect(normalizeGoogleEvent({ id: "x", status: "cancelled" }, null)?.removed).toBe(true);
  });
  it("keeps only events inside the 30-day window", () => {
    const now = Date.parse("2026-10-01T00:00:00Z");
    const ev = normalizeGoogleEvent(
      { id: "a", start: { dateTime: "2026-12-01T10:00:00Z" }, end: { dateTime: "2026-12-01T11:00:00Z" } },
      null,
    )!;
    expect(inWindow(ev, now)).toBe(false);
  });
});

describe("Gmail invitation matching", () => {
  it("parses folded UID lines", () => {
    expect(parseIcsUid("BEGIN:VEVENT\r\nUID:abc\r\n def@google.com\r\nEND:VEVENT")).toBe("abcdef@google.com");
  });
  it("builds a subject-only query without candidate-name search", () => {
    const q = buildInvitationQuery('Interview "Jane"');
    expect(q).toContain("filename:ics");
    expect(q).toMatch(/^filename:ics subject:"Interview Jane" newer_than:120d$/);
    expect(buildInvitationQuery(null)).toBeNull();
  });
});

describe("file signature checks", () => {
  it("accepts real PDFs and rejects mismatches or encrypted ones", () => {
    expect(verifyFileSignature(bytes("%PDF-1.7 hello"), "application/pdf").ok).toBe(true);
    expect(verifyFileSignature(bytes("MZ\u0090\u0000"), "application/pdf").ok).toBe(false);
    expect(verifyFileSignature(bytes("%PDF-1.7 /Encrypt 1 0 R"), "application/pdf")).toEqual({ ok: false, reason: "password_protected" });
  });
  it("checks DOCX zip header and text encoding", () => {
    const docx = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    expect(verifyFileSignature(bytes("PK\u0003\u0004rest"), docx).ok).toBe(true);
    expect(verifyFileSignature(bytes("%PDF"), docx).ok).toBe(false);
    expect(verifyFileSignature(new TextEncoder().encode("Job description"), "text/plain").ok).toBe(true);
  });
});

describe("classifier regressions", () => {
  it("does not flag a team standup", () => {
    const r = classifyEvent({
      subject: "Team standup",
      description: null,
      durationMinutes: 15,
      attendeeCount: 6,
      hasExternalAttendee: false,
      attachmentNames: [],
      isAllDay: false,
    });
    expect(r.classification).toBe("not_interview");
  });
});
