import { CAPABILITY_AREAS, isValidSubSkill, type CapabilityArea } from "@/lib/readiness/taxonomy";

/* ---------------- Lifecycle ---------------- */

export const QUESTION_STATUSES = [
  "draft",
  "in_review",
  "changes_requested",
  "approved",
  "published",
  "suspended",
  "retired",
  "rejected",
] as const;
export type QuestionStatus = (typeof QUESTION_STATUSES)[number];

export const STATUS_LABELS: Record<QuestionStatus, string> = {
  draft: "Draft",
  in_review: "In review",
  changes_requested: "Changes requested",
  approved: "Approved",
  published: "Published",
  suspended: "Suspended",
  retired: "Retired",
  rejected: "Rejected",
};

export type LifecycleAction =
  | "submit"
  | "approve"
  | "request_changes"
  | "reject"
  | "publish"
  | "suspend"
  | "retire"
  | "revise";

const TRANSITIONS: Record<LifecycleAction, { from: QuestionStatus[]; to: QuestionStatus; reason: boolean }> = {
  submit: { from: ["draft", "changes_requested"], to: "in_review", reason: false },
  approve: { from: ["in_review"], to: "approved", reason: false },
  request_changes: { from: ["in_review"], to: "changes_requested", reason: true },
  reject: { from: ["in_review"], to: "rejected", reason: true },
  publish: { from: ["approved"], to: "published", reason: false },
  suspend: { from: ["published"], to: "suspended", reason: true },
  retire: { from: ["published", "suspended", "approved"], to: "retired", reason: true },
  // Revising creates a new draft version (published versions are never edited in place).
  revise: { from: ["published", "suspended", "rejected", "approved"], to: "draft", reason: false },
};

export function transition(
  from: QuestionStatus,
  action: LifecycleAction,
  reason?: string | null,
): { ok: true; to: QuestionStatus } | { ok: false; error: string } {
  const t = TRANSITIONS[action];
  if (!t.from.includes(from)) return { ok: false, error: `Cannot ${action.replace("_", " ")} a question that is ${STATUS_LABELS[from].toLowerCase()}.` };
  if (t.reason && !(reason && reason.trim().length >= 5)) return { ok: false, error: "A reason of at least 5 characters is required." };
  return { ok: true, to: t.to };
}

export const isEditable = (s: QuestionStatus) => s === "draft" || s === "changes_requested";

/* ---------------- Risk & separation of duties ---------------- */

export type RiskLevel = "standard" | "elevated" | "high";
export const RISK_LABELS: Record<RiskLevel, string> = { standard: "Standard", elevated: "Elevated", high: "High" };

const HIGH_RISK = /\b(legal|lawsuit|complian|disabilit|accommodat|health|medical|pregnan|nationality|visa|work authori[sz]ation|immigration|harass|discriminat)/i;
const ELEVATED_RISK = /\b(bias|career gap|gap in (their|the) (cv|resume|career)|non-linear|complain|accessib|reject(ion)?|feedback to (the )?candidate|sensitive)/i;

/** Suggested minimum risk from content. Authors may raise but never lower below this. */
export function suggestedRisk(text: string, area?: string): RiskLevel {
  if (HIGH_RISK.test(text)) return "high";
  if (ELEVATED_RISK.test(text) || area === "bias_mitigation") return "elevated";
  return "standard";
}
const RISK_ORDER: Record<RiskLevel, number> = { standard: 0, elevated: 1, high: 2 };
export const maxRisk = (a: RiskLevel, b: RiskLevel): RiskLevel => (RISK_ORDER[a] >= RISK_ORDER[b] ? a : b);

/**
 * Separation of duties for approval:
 *  - standard: any reviewer, including the author.
 *  - elevated/high: never the author — except elevated content in an organization with only one
 *    eligible reviewer, via a recorded single-reviewer exception with a reason.
 *  - high risk never allows the exception.
 */
export function canApprove(args: {
  risk: RiskLevel;
  reviewerIsAuthor: boolean;
  eligibleReviewers: number;
  exceptionReason?: string | null;
}): { ok: true; exception: boolean } | { ok: false; error: string } {
  if (!args.reviewerIsAuthor || args.risk === "standard") return { ok: true, exception: false };
  if (args.risk === "high") return { ok: false, error: "High-risk content needs an independent reviewer who is not the author." };
  if (args.eligibleReviewers > 1) return { ok: false, error: "Another content reviewer must approve elevated content you authored." };
  if (!(args.exceptionReason && args.exceptionReason.trim().length >= 10))
    return { ok: false, error: "You are the only reviewer. Give a reason (10+ characters) to record a single-reviewer exception." };
  return { ok: true, exception: true };
}

/* ---------------- Review checklist ---------------- */

export const REVIEW_CHECKLIST: { section: string; items: { key: string; label: string }[] }[] = [
  { section: "Evidence quality", items: [
    { key: "one_best_answer", label: "One clearly defensible best answer" },
    { key: "plausible_alternatives", label: "Alternatives are plausible" },
    { key: "realistic", label: "Scenario is realistic" },
    { key: "explanation_justifies", label: "Explanation justifies the answer and ties to a principle" },
    { key: "unambiguous", label: "Free from unnecessary ambiguity" },
  ] },
  { section: "Capability mapping", items: [
    { key: "area_correct", label: "Capability area and sub-skill are correct" },
    { key: "difficulty_ok", label: "Difficulty and interview-stage mapping are appropriate" },
    { key: "one_concept", label: "Primarily assesses one concept" },
  ] },
  { section: "Bias and fairness", items: [
    { key: "no_protected_inference", label: "No protected-characteristic inference" },
    { key: "no_pedigree_affinity", label: "No pedigree, affinity or unsupported “culture fit” reasoning" },
    { key: "no_gap_penalty", label: "Does not penalise career gaps or non-linear paths" },
    { key: "evidence_over_impression", label: "Separates job-relevant evidence from impression" },
  ] },
  { section: "Candidate experience", items: [
    { key: "respectful", label: "Promotes respectful, relevant questioning" },
    { key: "clear_expectations", label: "Respects candidate time and clear expectations" },
    { key: "honest_role", label: "No misleading representation of the role" },
  ] },
  { section: "Privacy and security", items: [
    { key: "no_candidate_pii", label: "No candidate-identifying information or CV content" },
    { key: "no_confidential", label: "No confidential information outside its scope" },
    { key: "no_injection_links", label: "No prompt-injection, tool instructions or unsafe links" },
  ] },
  { section: "Explanation quality", items: [
    { key: "concise_educational", label: "Concise, educational rather than punitive" },
    { key: "no_overclaim", label: "Does not overclaim or judge the candidate" },
  ] },
];
export const CHECKLIST_KEYS = REVIEW_CHECKLIST.flatMap((s) => s.items.map((i) => i.key));
export const checklistComplete = (c: Record<string, boolean>) => CHECKLIST_KEYS.every((k) => c[k] === true);

/* ---------------- Automated validation ---------------- */

export type QuestionInput = {
  scenario: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  capabilityArea: string;
  subSkill: string;
};
export type ValidationResult = { ok: boolean; issues: string[] };

const EMAIL = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i;
const PHONE = /(\+?\d[\d\s().-]{7,}\d)/;
const URL_RE = /(https?:\/\/|www\.)\S+/i;
const INJECTION = /(ignore (all |any )?(previous|prior) instructions|system prompt|you are (now )?an? (ai|assistant)|<\s*script|\bjavascript:)/i;
const HIRING_DECISION = /\b(should (not )?(be )?hire|hire (this|the) candidate|reject (this|the) candidate|recommend hiring)\b/i;

export function validateQuestion(q: QuestionInput): ValidationResult {
  const issues: string[] = [];
  if (q.options.length !== 4) issues.push("Needs exactly 4 options.");
  if (new Set(q.options.map((o) => o.trim().toLowerCase())).size !== q.options.length) issues.push("Options must be distinct.");
  if (q.options.some((o) => !o.trim())) issues.push("Options cannot be empty.");
  if (!Number.isInteger(q.correctIndex) || q.correctIndex < 0 || q.correctIndex >= q.options.length) issues.push("Correct answer must point to an option.");
  if (q.scenario.trim().length < 20) issues.push("Scenario is too short.");
  if (q.explanation.trim().length < 10) issues.push("Explanation is too short.");
  if (!(CAPABILITY_AREAS as readonly string[]).includes(q.capabilityArea)) issues.push("Unknown capability area.");
  else if (!isValidSubSkill(q.capabilityArea as CapabilityArea, q.subSkill)) issues.push("Sub-skill does not belong to the capability area.");
  const all = [q.scenario, q.explanation, ...q.options].join("\n");
  if (EMAIL.test(all)) issues.push("Contains an email address.");
  if (PHONE.test(all)) issues.push("Contains a phone number.");
  if (URL_RE.test(all)) issues.push("Contains a link.");
  if (INJECTION.test(all)) issues.push("Contains instruction-like or active content.");
  if (HIRING_DECISION.test(all)) issues.push("Makes a hiring recommendation about a candidate.");
  return { ok: issues.length === 0, issues };
}

/* ---------------- Provenance ---------------- */

export const PROMPT_TEMPLATE_VERSION = "prep-v1";

export function ctxSourceTypes(c: { jobDescription?: string | null | undefined; candidateProfile?: string | null | undefined; competencies?: string[]; principles?: string[] | undefined }) {
  const out: string[] = ["role_and_stage"];
  if (c.jobDescription) out.push("job_description");
  if (c.candidateProfile) out.push("candidate_profile");
  if (c.competencies?.length) out.push("competencies");
  if (c.principles?.length) out.push("company_principles");
  return out;
}

/** Safe provenance: types and versions only, never raw context text. */
export function buildProvenance(a: {
  generatedByAi: boolean;
  generatorVersion: string;
  capability: string;
  subSkill: string;
  contextSources: string[];
  candidateContextUsed: boolean;
  principlesUsed: boolean;
  validation: ValidationResult;
}) {
  return {
    generated_at: new Date().toISOString(),
    generated_by_ai: a.generatedByAi,
    generator_version: a.generatorVersion,
    prompt_template_version: PROMPT_TEMPLATE_VERSION,
    capability_requested: a.capability,
    sub_skill_requested: a.subSkill,
    context_source_types: a.contextSources,
    candidate_context_used: a.candidateContextUsed,
    company_principles_used: a.principlesUsed,
    validation: a.validation,
    human_review_status: "not_applicable_session_only",
    disposition: "session_only",
  };
}

/* ---------------- Audit metadata sanitising ---------------- */

const FORBIDDEN_AUDIT_KEYS = /(token|secret|password|cv|candidate|gmail|email_body|description|attachment_text|profile_text)/i;
/** Strips private keys and long strings from audit metadata. */
export function sanitizeAuditMetadata(m: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(m)) {
    if (FORBIDDEN_AUDIT_KEYS.test(k)) continue;
    if (typeof v === "string") out[k] = EMAIL.test(v) ? "[redacted]" : v.slice(0, 200);
    else if (typeof v === "number" || typeof v === "boolean" || v === null) out[k] = v;
    else if (Array.isArray(v)) out[k] = v.filter((x) => typeof x === "string" || typeof x === "number").slice(0, 20);
  }
  return out;
}

export const FLAG_REASONS = ["unclear", "incorrect", "biased", "inappropriate", "other"] as const;
export type FlagReason = (typeof FLAG_REASONS)[number];
export const FLAG_REASON_LABELS: Record<FlagReason, string> = {
  unclear: "Unclear",
  incorrect: "Incorrect answer",
  biased: "Biased",
  inappropriate: "Inappropriate",
  other: "Other",
};
