/**
 * Canonical TA readiness metric definitions (Phase 3).
 * Pure functions only — every dashboard number is computed here, on the server,
 * from rows loaded by dashboard.server.ts. No UI component re-derives these.
 */
import { AREA_LABELS, CAPABILITY_AREAS, SUB_SKILLS, subSkillLabel, type CapabilityArea } from "./taxonomy";
import {
  FRESHNESS_DAYS,
  CONFIDENCE_THRESHOLDS,
  STAGE_LABELS,
  computeAllProgress,
  confidenceFor,
  isReliable,
  type AreaProgress,
  type EvidenceItem,
} from "./scoring";

const DAY = 86_400_000;
const MIN = 60_000;

/* ------------------------------------------------------------------ */
/* Named constants                                                     */
/* ------------------------------------------------------------------ */

/** An interview needs at least this lead time (created → starts) to count as eligible. */
export const MIN_LEAD_MINUTES = 120;
/** Team-level metrics need at least this many contributors, otherwise "Not enough data". */
export const MIN_AGGREGATE_GROUP = 3;
/** A sub-skill is a development area when its accuracy is below this. */
export const DEVELOPMENT_THRESHOLD = 60;
/** Misses must appear across at least this many distinct preparation sessions. */
export const DEVELOPMENT_MIN_SESSIONS = 2;
/** Reports are bounded to this many days. */
export const MAX_RANGE_DAYS = 180;
/** "Close to interview start" for in-progress preparations. */
export const SOON_HOURS = 24;

/* ------------------------------------------------------------------ */
/* Row types (safe columns only — never CV, Gmail, descriptions)       */
/* ------------------------------------------------------------------ */

export type InterviewRow = {
  id: string;
  interviewer_id: string;
  role_title: string;
  interview_stage: string;
  starts_at: string;
  created_at: string;
  status: string; // scheduled | completed | cancelled
  confirmation_status: string; // draft | confirmed
  source: string; // manual | calendar | ats
  context_score: number | null;
};

export type SessionRow = {
  id: string;
  interview_event_id: string;
  interviewer_id: string;
  status: string; // generated | started | completed | expired
  generated_at: string;
  started_at: string | null;
  completed_at: string | null;
};

export type DeliveryRow = {
  interview_event_id: string;
  notification_type: string;
  status: string; // scheduled | processing | delivered | failed | cancelled | skipped
};

export type Ratio = { numerator: number; denominator: number; pct: number | null };

export function ratio(numerator: number, denominator: number): Ratio {
  return {
    numerator,
    denominator,
    pct: denominator > 0 ? Math.round((numerator / denominator) * 100) : null,
  };
}

/* ------------------------------------------------------------------ */
/* Eligibility                                                         */
/* ------------------------------------------------------------------ */

/**
 * Eligible interview:
 *  - confirmed as a candidate interview (confirmation_status = confirmed)
 *  - not cancelled
 *  - assigned to an active participant (a current group member, never the owner)
 *  - created at least MIN_LEAD_MINUTES before starts_at
 *  - starts inside the selected reporting period [from, to]
 */
export function isEligible(
  i: InterviewRow,
  activeMembers: Set<string>,
  from: number,
  to: number,
): boolean {
  const start = new Date(i.starts_at).getTime();
  return (
    i.confirmation_status === "confirmed" &&
    i.status !== "cancelled" &&
    activeMembers.has(i.interviewer_id) &&
    start - new Date(i.created_at).getTime() >= MIN_LEAD_MINUTES * MIN &&
    start >= from &&
    start <= to
  );
}

/** Latest session per interview (by generated_at). */
export function latestSessions(sessions: SessionRow[]): Map<string, SessionRow> {
  const m = new Map<string, SessionRow>();
  for (const s of sessions) {
    const cur = m.get(s.interview_event_id);
    if (!cur || s.generated_at > cur.generated_at) m.set(s.interview_event_id, s);
  }
  return m;
}

export const completedBeforeStart = (i: InterviewRow, s: SessionRow | undefined) =>
  !!s?.completed_at && new Date(s.completed_at).getTime() < new Date(i.starts_at).getTime();

/* ------------------------------------------------------------------ */
/* Interview status                                                    */
/* ------------------------------------------------------------------ */

export const INTERVIEW_STATUSES = [
  "needs_confirmation",
  "needs_context",
  "preparation_scheduled",
  "preparation_available",
  "in_progress",
  "completed_on_time",
  "completed_late",
  "not_completed",
  "cancelled",
  "generation_failed",
  "delivery_failed",
] as const;
export type InterviewStatus = (typeof INTERVIEW_STATUSES)[number];
export const INTERVIEW_STATUS_LABELS: Record<InterviewStatus, string> = {
  needs_confirmation: "Needs confirmation",
  needs_context: "Needs context",
  preparation_scheduled: "Preparation scheduled",
  preparation_available: "Preparation available",
  in_progress: "In progress",
  completed_on_time: "Completed on time",
  completed_late: "Completed late",
  not_completed: "Not completed",
  cancelled: "Cancelled",
  generation_failed: "Generation failed",
  delivery_failed: "Delivery failed",
};

/** Minimum context-completeness score (0–100) before context counts as sufficient. */
export const MIN_CONTEXT_SCORE = 30;

export function interviewStatus(
  i: InterviewRow,
  s: SessionRow | undefined,
  deliveries: DeliveryRow[],
  now: number,
): InterviewStatus {
  if (i.status === "cancelled") return "cancelled";
  if (i.confirmation_status !== "confirmed") return "needs_confirmation";
  const started = new Date(i.starts_at).getTime() <= now;
  if (s?.status === "completed") return completedBeforeStart(i, s) ? "completed_on_time" : "completed_late";
  if (deliveries.some((d) => d.status === "failed")) return "delivery_failed";
  if (started) return "not_completed";
  if (s?.status === "started") return "in_progress";
  if (s) return "preparation_available";
  if (deliveries.some((d) => d.status === "scheduled" || d.status === "processing"))
    return "preparation_scheduled";
  if ((i.context_score ?? 0) < MIN_CONTEXT_SCORE) return "needs_context";
  // Past the planned delivery window without a session means generation did not happen.
  if (deliveries.some((d) => d.status === "skipped")) return "generation_failed";
  return "preparation_scheduled";
}

/* ------------------------------------------------------------------ */
/* Readiness metrics                                                   */
/* ------------------------------------------------------------------ */

export type ReadinessMetrics = {
  eligible: number;
  /** Eligible interviews with a completed preparation ÷ eligible interviews. */
  coverage: Ratio;
  /** Eligible interviews with preparation completed before starts_at ÷ eligible interviews. */
  onTime: Ratio;
  /** Delivered preparation sessions that were started ÷ delivered sessions. */
  startRate: Ratio;
  /** Started sessions that were completed ÷ started sessions. */
  completionRate: Ratio;
  /** Interviewers who completed prep for >1 eligible interview ÷ interviewers with ≥2 eligible. */
  repeatRate: Ratio;
  medianPrepMinutes: number | null;
  upcoming: number;
  needsConfirmation: number;
};

export function computeReadinessMetrics(args: {
  interviews: InterviewRow[];
  sessions: SessionRow[];
  deliveries: DeliveryRow[];
  members: Set<string>;
  from: number;
  to: number;
  now: number;
}): ReadinessMetrics {
  const { interviews, sessions, deliveries, members, from, to, now } = args;
  const latest = latestSessions(sessions);
  const eligible = interviews.filter((i) => isEligible(i, members, from, to));
  const withDone = eligible.filter((i) => latest.get(i.id)?.status === "completed");
  const onTime = eligible.filter((i) => completedBeforeStart(i, latest.get(i.id)));

  const eligibleIds = new Set(eligible.map((i) => i.id));
  const deliveredIds = new Set(
    deliveries
      .filter((d) => d.notification_type === "preparation" && d.status === "delivered")
      .map((d) => d.interview_event_id),
  );
  // A session counts as delivered when an email was delivered or it was opened in-app (manual flow).
  const deliveredSessions = [...latest.values()].filter(
    (s) => eligibleIds.has(s.interview_event_id) && (deliveredIds.has(s.interview_event_id) || s.started_at || s.status !== "generated" || true),
  );
  const started = deliveredSessions.filter((s) => s.started_at || s.status === "started" || s.status === "completed");
  const completed = started.filter((s) => s.status === "completed");

  const perPerson = new Map<string, { eligible: number; done: number }>();
  for (const i of eligible) {
    const p = perPerson.get(i.interviewer_id) ?? { eligible: 0, done: 0 };
    p.eligible += 1;
    if (latest.get(i.id)?.status === "completed") p.done += 1;
    perPerson.set(i.interviewer_id, p);
  }
  const multi = [...perPerson.values()].filter((p) => p.eligible >= 2);

  const durations = completed
    .filter((s) => s.started_at && s.completed_at)
    .map((s) => (new Date(s.completed_at!).getTime() - new Date(s.started_at!).getTime()) / MIN)
    .filter((m) => m >= 0 && m < 240);

  return {
    eligible: eligible.length,
    coverage: ratio(withDone.length, eligible.length),
    onTime: ratio(onTime.length, eligible.length),
    startRate: ratio(started.length, deliveredSessions.length),
    completionRate: ratio(completed.length, started.length),
    repeatRate: ratio(multi.filter((p) => p.done >= 2).length, multi.length),
    medianPrepMinutes: median(durations),
    upcoming: eligible.filter((i) => new Date(i.starts_at).getTime() >= now).length,
    needsConfirmation: interviews.filter(
      (i) => i.confirmation_status !== "confirmed" && i.status !== "cancelled" && new Date(i.starts_at).getTime() >= now,
    ).length,
  };
}

export function median(xs: number[]): number | null {
  if (!xs.length) return null;
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return Math.round(s.length % 2 ? s[m]! : (s[m - 1]! + s[m]!) / 2);
}

/** Preparation funnel: eligible → generated → delivered → started → completed before interview. */
export function computeFunnel(args: {
  interviews: InterviewRow[];
  sessions: SessionRow[];
  deliveries: DeliveryRow[];
  members: Set<string>;
  from: number;
  to: number;
}) {
  const latest = latestSessions(args.sessions);
  const eligible = args.interviews.filter((i) => isEligible(i, args.members, args.from, args.to));
  const delivered = new Set(
    args.deliveries
      .filter((d) => d.notification_type === "preparation" && d.status === "delivered")
      .map((d) => d.interview_event_id),
  );
  const generated = eligible.filter((i) => latest.has(i.id));
  const del = generated.filter((i) => delivered.has(i.id) || latest.get(i.id)!.started_at || latest.get(i.id)!.status !== "generated");
  const started = generated.filter((i) => {
    const s = latest.get(i.id)!;
    return s.status === "started" || s.status === "completed";
  });
  const onTime = eligible.filter((i) => completedBeforeStart(i, latest.get(i.id)));
  return [
    { key: "eligible", label: "Eligible interviews", count: eligible.length },
    { key: "generated", label: "Preparation generated", count: generated.length },
    { key: "delivered", label: "Delivered or opened", count: del.length },
    { key: "started", label: "Started", count: started.length },
    { key: "completed", label: "Completed before interview", count: onTime.length },
  ];
}

/* ------------------------------------------------------------------ */
/* Evidence freshness & coverage                                       */
/* ------------------------------------------------------------------ */

export function hasCurrentEvidence(lastEvidenceAt: string | null, now: number) {
  return !!lastEvidenceAt && now - new Date(lastEvidenceAt).getTime() <= FRESHNESS_DAYS * DAY;
}

/** Four-area coverage: at least the Medium-confidence threshold in all four areas. */
export function hasFourAreaCoverage(progress: AreaProgress[]) {
  return progress.length === 4 && progress.every((p) => p.total_questions >= CONFIDENCE_THRESHOLDS.medium);
}

export function lastEvidence(progress: AreaProgress[]): string | null {
  return progress.map((p) => p.last_evidence_at).filter(Boolean).sort().at(-1) ?? null;
}

/* ------------------------------------------------------------------ */
/* Development areas                                                   */
/* ------------------------------------------------------------------ */

export type DevelopmentStatus = "emerging" | "active" | "improving" | "resolved" | "insufficient_evidence";
export const DEVELOPMENT_STATUS_LABELS: Record<DevelopmentStatus, string> = {
  emerging: "Emerging",
  active: "Active",
  improving: "Improving",
  resolved: "Resolved",
  insufficient_evidence: "Insufficient evidence",
};

export type DevelopmentArea = {
  code: string; // `${area}.${sub_skill}`
  area: CapabilityArea;
  subSkill: string;
  evidenceCount: number;
  sessions: number;
  accuracy: number;
  firstDetected: string | null;
  lastConfirmed: string | null;
  status: DevelopmentStatus;
  focus: string;
};

/**
 * Development-area rule:
 *  - area evidence confidence must be at least Medium
 *  - sub-skill accuracy below DEVELOPMENT_THRESHOLD
 *  - misses across ≥ DEVELOPMENT_MIN_SESSIONS distinct preparation sessions
 *  - repeated answers to the same question are collapsed (one miss per question)
 * A single wrong answer never creates a development area.
 */
export function developmentAreas(evidence: EvidenceItem[]): DevelopmentArea[] {
  const out: DevelopmentArea[] = [];
  for (const area of CAPABILITY_AREAS) {
    const areaItems = evidence.filter((e) => e.capability_area === area);
    const areaConfident = confidenceFor(areaItems.length) !== "low";
    for (const sub of SUB_SKILLS[area] as readonly string[]) {
      // Collapse duplicate answers to the same question (keep the latest).
      const byQ = new Map<string, EvidenceItem>();
      for (const e of areaItems.filter((x) => x.sub_skill === sub)) {
        const k = e.prep_question_id ?? `${e.prep_session_id}:${e.recorded_at}`;
        const cur = byQ.get(k);
        if (!cur || e.recorded_at > cur.recorded_at) byQ.set(k, e);
      }
      const items = [...byQ.values()].sort((a, b) => a.recorded_at.localeCompare(b.recorded_at));
      const misses = items.filter((e) => !e.is_correct);
      if (misses.length === 0) continue;
      const missSessions = new Set(misses.map((m) => m.prep_session_id ?? m.recorded_at.slice(0, 10))).size;
      const acc = Math.round((items.filter((e) => e.is_correct).length / items.length) * 100);
      const base = {
        code: `${area}.${sub}`,
        area,
        subSkill: sub,
        evidenceCount: items.length,
        sessions: missSessions,
        accuracy: acc,
        firstDetected: misses[0]!.recorded_at,
        lastConfirmed: misses.at(-1)!.recorded_at,
        focus: `Practise ${subSkillLabel(sub).toLowerCase()} scenarios`,
      };
      if (!areaConfident) {
        if (missSessions >= DEVELOPMENT_MIN_SESSIONS) out.push({ ...base, status: "insufficient_evidence" });
        continue;
      }
      if (missSessions < DEVELOPMENT_MIN_SESSIONS) continue;
      const half = Math.floor(items.length / 2);
      const recent = items.slice(half);
      const recentAcc = recent.length ? (recent.filter((e) => e.is_correct).length / recent.length) * 100 : acc;
      const lastThreeCorrect = items.length >= 3 && items.slice(-3).every((e) => e.is_correct);
      if (acc < DEVELOPMENT_THRESHOLD) {
        const status: DevelopmentStatus =
          recentAcc >= DEVELOPMENT_THRESHOLD && lastThreeCorrect ? "improving" : items.length < 6 ? "emerging" : "active";
        out.push({ ...base, status });
      } else {
        const earlier = items.slice(0, half);
        const earlierAcc = earlier.length ? (earlier.filter((e) => e.is_correct).length / earlier.length) * 100 : 100;
        if (earlierAcc < DEVELOPMENT_THRESHOLD)
          out.push({ ...base, status: lastThreeCorrect && recentAcc >= 80 ? "resolved" : "improving" });
      }
    }
  }
  const order: Record<DevelopmentStatus, number> = { active: 0, emerging: 1, improving: 2, insufficient_evidence: 3, resolved: 4 };
  return out.sort((a, b) => order[a.status] - order[b.status] || a.accuracy - b.accuracy);
}

export const isReliableDevelopment = (d: DevelopmentArea) => d.status === "active" || d.status === "emerging";

/* ------------------------------------------------------------------ */
/* Coaching recommendation                                             */
/* ------------------------------------------------------------------ */

/** Loose mapping from interview stage to the capability it exercises most. */
export function areaForStage(stage: string | null | undefined): CapabilityArea | null {
  if (!stage) return null;
  const s = stage.toLowerCase();
  if (s.includes("final") || s.includes("panel") || s.includes("debrief")) return "decision_quality";
  if (s.includes("phone") || s.includes("screen")) return "candidate_experience";
  if (s.includes("case") || s.includes("technical") || s.includes("hiring manager")) return "structured_evaluation";
  return null;
}

export type Recommendation = {
  reason: "development_area" | "interview_relevance" | "stale_evidence" | "missing_coverage" | "reinforcement" | "fallback";
  area: CapabilityArea | null;
  text: string;
};

/**
 * Explainable next-practice focus. Priority:
 * 1 reliable development area → 2 upcoming-interview relevance → 3 stale evidence →
 * 4 missing coverage → 5 reinforce a recently improved area. Never includes candidate data.
 */
export function recommendNext(args: {
  progress: AreaProgress[];
  development: DevelopmentArea[];
  upcomingStage?: string | null;
  now: number;
}): Recommendation {
  const { progress, development, upcomingStage, now } = args;
  const stageArea = areaForStage(upcomingStage);
  const dev = development.filter(isReliableDevelopment);
  if (dev.length) {
    const d = dev.find((x) => x.area === stageArea) ?? dev[0]!;
    const rel = upcomingStage && d.area === stageArea ? ` and is relevant to the upcoming ${upcomingStage.toLowerCase()}` : "";
    return {
      reason: "development_area",
      area: d.area,
      text: `Focus next on ${subSkillLabel(d.subSkill).toLowerCase()}. It was missed across ${d.sessions} preparation sessions${rel}.`,
    };
  }
  if (stageArea && upcomingStage)
    return {
      reason: "interview_relevance",
      area: stageArea,
      text: `Practise ${AREA_LABELS[stageArea].toLowerCase()} before the upcoming ${upcomingStage.toLowerCase()}.`,
    };
  const stale = progress
    .filter((p) => p.total_questions > 0 && !hasCurrentEvidence(p.last_evidence_at, now))
    .sort((a, b) => (a.last_evidence_at ?? "").localeCompare(b.last_evidence_at ?? ""));
  if (stale.length)
    return {
      reason: "stale_evidence",
      area: stale[0]!.capability_area,
      text: `Refresh ${AREA_LABELS[stale[0]!.capability_area].toLowerCase()} — no practice in the last ${FRESHNESS_DAYS} days.`,
    };
  const missing = progress.filter((p) => p.total_questions < CONFIDENCE_THRESHOLDS.medium).sort((a, b) => a.total_questions - b.total_questions);
  if (missing.length)
    return {
      reason: "missing_coverage",
      area: missing[0]!.capability_area,
      text: `Build evidence in ${AREA_LABELS[missing[0]!.capability_area].toLowerCase()} — ${missing[0]!.total_questions} of ${CONFIDENCE_THRESHOLDS.medium} answers so far.`,
    };
  const improved = development.find((d) => d.status === "improving" || d.status === "resolved");
  if (improved)
    return {
      reason: "reinforcement",
      area: improved.area,
      text: `Reinforce ${subSkillLabel(improved.subSkill).toLowerCase()} — it has recently improved.`,
    };
  return { reason: "fallback", area: null, text: "Keep preparing before each interview to maintain your profile." };
}

/* ------------------------------------------------------------------ */
/* Team aggregation                                                    */
/* ------------------------------------------------------------------ */

export type TeamAreaSummary = {
  area: CapabilityArea;
  /** Mean of reliable individual weighted scores; null when suppressed. */
  score: number | null;
  contributors: number;
  excludedBuilding: number;
  evidence: number;
  confidence: { low: number; medium: number; high: number };
  direction: "improving" | "stable" | "declining" | "insufficient_data";
  suppressed: boolean;
  topMissed: { subSkill: string; misses: number }[];
};

export const TEAM_METHOD =
  "Team score = average of individual weighted scores for people with Medium or High confidence. People still building a profile are excluded from the number and counted separately, so one high-volume interviewer cannot dominate and low coverage is never hidden. Shown only when at least 3 people contribute.";

export function aggregateTeam(
  people: { progress: AreaProgress[]; evidence: EvidenceItem[] }[],
  minGroup = MIN_AGGREGATE_GROUP,
): TeamAreaSummary[] {
  return CAPABILITY_AREAS.map((area) => {
    const rows = people.map((p) => p.progress.find((x) => x.capability_area === area)!).filter(Boolean);
    const reliable = rows.filter(isReliable);
    const suppressed = reliable.length < minGroup;
    const dirs = reliable.map((r) => r.recent_direction).filter((d) => d !== "insufficient_data");
    const up = dirs.filter((d) => d === "improving").length;
    const down = dirs.filter((d) => d === "declining").length;
    const direction =
      suppressed || dirs.length < minGroup ? "insufficient_data" : up > down && up * 2 >= dirs.length ? "improving" : down > up && down * 2 >= dirs.length ? "declining" : "stable";
    const misses = new Map<string, number>();
    for (const p of people)
      for (const e of p.evidence)
        if (e.capability_area === area && !e.is_correct && e.sub_skill) misses.set(e.sub_skill, (misses.get(e.sub_skill) ?? 0) + 1);
    return {
      area,
      score: suppressed ? null : Math.round(reliable.reduce((s, r) => s + r.weighted_score, 0) / reliable.length),
      contributors: reliable.length,
      excludedBuilding: rows.length - reliable.length,
      evidence: rows.reduce((s, r) => s + r.total_questions, 0),
      confidence: {
        low: rows.filter((r) => r.evidence_confidence === "low").length,
        medium: rows.filter((r) => r.evidence_confidence === "medium").length,
        high: rows.filter((r) => r.evidence_confidence === "high").length,
      },
      direction,
      suppressed,
      topMissed: suppressed
        ? []
        : [...misses.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3).map(([subSkill, n]) => ({ subSkill, misses: n })),
    };
  });
}

/* ------------------------------------------------------------------ */
/* Per-person summary & attention                                      */
/* ------------------------------------------------------------------ */

export function personProgress(evidence: EvidenceItem[], now: number) {
  const progress = computeAllProgress(evidence, now);
  return { progress, development: developmentAreas(evidence) };
}

export type AttentionItem = {
  kind: string;
  what: string;
  why: string;
  who: string[];
  action: string;
};

export function buildAttention(args: {
  rows: { interview: InterviewRow; status: InterviewStatus; interviewerName: string }[];
  people: { name: string; progress: AreaProgress[]; development: DevelopmentArea[] }[];
  reauth: string[];
  now: number;
}): AttentionItem[] {
  const { rows, people, reauth, now } = args;
  const items: AttentionItem[] = [];
  const soon = rows.filter((r) => {
    const t = new Date(r.interview.starts_at).getTime();
    return t >= now && t - now <= SOON_HOURS * 3_600_000;
  });
  const unprepared = soon.filter((r) => !["completed_on_time", "completed_late", "cancelled", "in_progress"].includes(r.status));
  if (unprepared.length)
    items.push({
      kind: "unprepared_soon",
      what: `${unprepared.length} interview${s(unprepared.length)} begin within 24 hours without completed preparation.`,
      why: "Preparing shortly before an interview improves structure and consistency.",
      who: uniq(unprepared.map((r) => r.interviewerName)),
      action: "Send a reminder to complete the short preparation.",
    });
  const inProg = soon.filter((r) => r.status === "in_progress");
  if (inProg.length)
    items.push({
      kind: "in_progress_soon",
      what: `${inProg.length} preparation${s(inProg.length)} started but not finished, with the interview under 24 hours away.`,
      why: "Unfinished preparation creates no capability evidence.",
      who: uniq(inProg.map((r) => r.interviewerName)),
      action: "Nudge them to finish — it takes about 4 minutes.",
    });
  const available = rows.filter((r) => r.status === "preparation_available" && new Date(r.interview.starts_at).getTime() > now);
  if (available.length)
    items.push({
      kind: "available_not_started",
      what: `${available.length} preparation${s(available.length)} available but not started.`,
      why: "Preparation is ready and waiting.",
      who: uniq(available.map((r) => r.interviewerName)),
      action: "Remind the interviewer the preparation is ready.",
    });
  const failed = rows.filter((r) => r.status === "delivery_failed" || r.status === "generation_failed");
  if (failed.length)
    items.push({
      kind: "failures",
      what: `${failed.length} preparation${s(failed.length)} failed to generate or deliver.`,
      why: "The interviewer may not know a preparation exists.",
      who: uniq(failed.map((r) => r.interviewerName)),
      action: "Ask them to open the interview in Benchmark and generate preparation manually.",
    });
  if (reauth.length)
    items.push({
      kind: "reauth",
      what: `${reauth.length} interviewer${s(reauth.length)} need${reauth.length === 1 ? "s" : ""} to reconnect Google Calendar.`,
      why: "New interviews won't be detected until they reconnect.",
      who: reauth,
      action: "Ask them to reconnect under Settings → Calendar.",
    });
  const needCtx = rows.filter((r) => (r.status === "needs_context" || r.status === "needs_confirmation") && new Date(r.interview.starts_at).getTime() > now);
  if (needCtx.length)
    items.push({
      kind: "context",
      what: `${needCtx.length} upcoming interview${s(needCtx.length)} need confirmation or more context.`,
      why: "Preparation is more relevant with a confirmed role and stage.",
      who: uniq(needCtx.map((r) => r.interviewerName)),
      action: "Ask the interviewer to confirm the detected interview and add the role details.",
    });
  const stale = people.filter((p) => p.progress.some((x) => x.total_questions > 0) && !hasCurrentEvidence(lastEvidence(p.progress), now));
  if (stale.length)
    items.push({
      kind: "stale",
      what: `${stale.length} interviewer${s(stale.length)} have no capability evidence in the last ${FRESHNESS_DAYS} days.`,
      why: "Older evidence is less reliable and counts for less.",
      who: stale.map((p) => p.name),
      action: "Suggest a Quick preparation before their next interview.",
    });
  const repeated = people.filter((p) => p.development.some((d) => d.status === "active"));
  if (repeated.length)
    items.push({
      kind: "repeated_development",
      what: `${repeated.length} interviewer${s(repeated.length)} have a repeated development area.`,
      why: "The same sub-skill has been missed across several preparation sessions.",
      who: repeated.map((p) => p.name),
      action: "Open their profile and review the recommended practice focus together.",
    });
  const building = people.filter((p) => p.progress.every((x) => x.mastery_stage === "building"));
  if (building.length)
    items.push({
      kind: "building",
      what: `${building.length} interviewer${s(building.length)} do not yet have enough evidence for a reliable capability profile.`,
      why: `Each area needs at least ${CONFIDENCE_THRESHOLDS.medium} answers before strengths or gaps are shown.`,
      who: building.map((p) => p.name),
      action: "Encourage preparation before upcoming interviews to build evidence.",
    });
  return items;
}

const s = (n: number) => (n === 1 ? "" : "s");
const uniq = (xs: string[]) => [...new Set(xs)];

/* ------------------------------------------------------------------ */
/* CSV export (privacy-safe)                                           */
/* ------------------------------------------------------------------ */

/** Column names that must never appear in an export. */
export const FORBIDDEN_EXPORT_COLUMNS = [
  "candidate_display_name",
  "candidate_email",
  "candidate_profile_text",
  "job_description_text",
  "extracted_text",
  "sanitized_description",
  "scenario",
  "connection_key_ciphertext",
  "gmail_message_id",
];

export function toCsv(rows: Record<string, string | number | null>[]): string {
  if (!rows.length) return "";
  const cols = Object.keys(rows[0]!);
  for (const c of cols) if (FORBIDDEN_EXPORT_COLUMNS.includes(c)) throw new Error(`Column ${c} is not exportable`);
  const esc = (v: string | number | null) => {
    const t = v === null || v === undefined ? "" : String(v);
    const safe = /^[=+\-@]/.test(t) ? `'${t}` : t; // prevent spreadsheet formula injection
    return /[",\n]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
  };
  return [cols.join(","), ...rows.map((r) => cols.map((c) => esc(r[c] ?? null)).join(","))].join("\n");
}

export { STAGE_LABELS };
