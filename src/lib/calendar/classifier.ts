/**
 * Conservative, deterministic interview detection. Versioned so stored
 * classifications can be re-evaluated when the rules change.
 *
 * Never uses names, gender, nationality, ethnicity or any protected
 * characteristic. Only event structure and wording about the meeting itself.
 */
export const CLASSIFIER_VERSION = "cal-v1";

export type ClassifierInput = {
  subject: string | null;
  description: string | null;
  durationMinutes: number;
  attendeeCount: number | null;
  hasExternalAttendee: boolean;
  attachmentNames: string[];
  isAllDay?: boolean;
  isCancelled?: boolean;
  /** Organisation-configured interview naming patterns (plain substrings). */
  orgPatterns?: string[];
};

export type Classification = "likely_interview" | "possible_interview" | "not_interview";

export type ClassifierResult = {
  classification: Classification;
  confidence: number;
  reasons: string[];
  detectedStage: string | null;
  detectedRole: string | null;
  detectedCandidate: string | null;
};

const STRONG_SUBJECT = /\b(interview|intervju|screening call|phone screen|technical screen|panel interview|onsite|on-site|case interview|hiring manager (call|interview)|final round)\b/i;
const WEAK_SUBJECT = /\b(chat|intro|call|meet|conversation|catch[- ]?up|talk)\b/i;
const EXCLUDE = /\b(1:1|one[- ]on[- ]one|standup|stand-up|retro|sprint|all[- ]hands|lunch|offsite|birthday|webinar|training|performance review|internal interview panel prep|debrief)\b/i;

const STAGES: { re: RegExp; label: string }[] = [
  { re: /\b(phone|recruiter|initial) screen(ing)?\b/i, label: "Screening" },
  { re: /\bscreening\b/i, label: "Screening" },
  { re: /\btechnical\b/i, label: "Technical interview" },
  { re: /\bcase (study|interview)\b/i, label: "Case interview" },
  { re: /\bpanel\b/i, label: "Panel interview" },
  { re: /\bhiring manager\b/i, label: "Hiring manager interview" },
  { re: /\b(final|last) (round|interview)\b/i, label: "Final interview" },
  { re: /\b(first|1st) (round|interview)\b/i, label: "First interview" },
  { re: /\b(second|2nd) (round|interview)\b/i, label: "Second interview" },
  { re: /\bculture|values\b/i, label: "Values interview" },
];

const ROLE_CONTEXT = /\b(position|role|vacancy|candidate|applicant|job description|requisition|req\s?#?\d+)\b/i;
const DOC_HINT = /\b(cv|resume|résumé|curriculum vitae|job[_ -]?description|jd|scorecard|interview[_ -]?guide|kit)\b/i;

/** Extracts "Interview: Senior Engineer – Alex" style role and candidate from the subject. */
export function parseSubject(subject: string): { role: string | null; candidate: string | null } {
  const clean = subject.replace(/\s+/g, " ").trim();
  const m = clean.match(/interview(?:\s+(?:for|with))?\s*[:\-–|]\s*(.+)/i);
  const rest = m?.[1] ?? null;
  if (!rest) return { role: null, candidate: null };
  const parts = rest.split(/\s+[-–|]\s+|\s+with\s+/i).map((p) => p.trim()).filter(Boolean);
  if (parts.length >= 2) return { role: parts[0]!.slice(0, 160), candidate: parts[1]!.slice(0, 120) };
  return { role: parts[0]?.slice(0, 160) ?? null, candidate: null };
}

export function classifyEvent(input: ClassifierInput): ClassifierResult {
  const subject = input.subject ?? "";
  const desc = input.description ?? "";
  const text = `${subject}\n${desc}`;
  const reasons: string[] = [];
  let score = 0;

  const base = { detectedStage: null, detectedRole: null, detectedCandidate: null };
  if (input.isCancelled || input.isAllDay) {
    return { classification: "not_interview", confidence: 0, reasons: ["cancelled_or_all_day"], ...base };
  }
  if (EXCLUDE.test(subject)) {
    return { classification: "not_interview", confidence: 0, reasons: ["excluded_meeting_type"], ...base };
  }

  if (STRONG_SUBJECT.test(subject)) {
    score += 0.4;
    reasons.push("subject_interview_language");
  } else if (STRONG_SUBJECT.test(desc)) {
    score += 0.2;
    reasons.push("description_interview_language");
  } else if (WEAK_SUBJECT.test(subject)) {
    score += 0.05;
    reasons.push("weak_subject_keyword");
  }
  if (input.orgPatterns?.some((p) => p && subject.toLowerCase().includes(p.toLowerCase()))) {
    score += 0.3;
    reasons.push("org_naming_pattern");
  }
  if (input.hasExternalAttendee) {
    score += 0.15;
    reasons.push("external_attendee");
  }
  if (input.durationMinutes >= 20 && input.durationMinutes <= 120) {
    score += 0.1;
    reasons.push("interview_like_duration");
  }
  const stage = STAGES.find((s) => s.re.test(text))?.label ?? null;
  if (stage) {
    score += 0.1;
    reasons.push("stage_detected");
  }
  if (ROLE_CONTEXT.test(text)) {
    score += 0.1;
    reasons.push("role_or_candidate_language");
  }
  if (input.attachmentNames.some((n) => DOC_HINT.test(n))) {
    score += 0.2;
    reasons.push("interview_document_attached");
  }
  if (input.attendeeCount !== null && input.attendeeCount > 12) {
    score -= 0.3;
    reasons.push("large_meeting");
  }

  const confidence = Math.max(0, Math.min(1, Math.round(score * 100) / 100));
  // A single signal can never reach "possible": 0.4 subject alone is capped below.
  const signals = reasons.filter((r) => r !== "weak_subject_keyword" && r !== "large_meeting").length;
  let classification: Classification = "not_interview";
  if (confidence >= 0.7 && signals >= 3) classification = "likely_interview";
  else if (confidence >= 0.45 && signals >= 2) classification = "possible_interview";

  const parsed = parseSubject(subject);
  return {
    classification,
    confidence,
    reasons,
    detectedStage: stage,
    detectedRole: parsed.role,
    detectedCandidate: parsed.candidate,
  };
}
