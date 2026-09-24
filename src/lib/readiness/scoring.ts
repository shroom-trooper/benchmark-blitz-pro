import { CAPABILITY_AREAS, type CapabilityArea, type Difficulty } from "./taxonomy";

/**
 * Canonical capability scoring (Phase 3).
 *
 * Weighted score formula (per capability area):
 *   w(e)   = DIFFICULTY_WEIGHTS[e.difficulty] × 0.5^(ageDays / RECENCY_HALF_LIFE_DAYS)
 *   per sub-skill s: num_s = Σ correct·w, den_s = Σ w; if den_s > SUBSKILL_WEIGHT_CAP both are
 *   scaled by SUBSKILL_WEIGHT_CAP / den_s so one repeatedly practised sub-skill cannot dominate.
 *   score  = round(100 × Σ num_s / Σ den_s)
 * Inputs are ONLY the interviewer's own answers (correctness, difficulty, recency, sub-skill).
 * Never candidate outcomes, interview volume, calendar status, notification opens or comparisons.
 * It is an explainable practice signal — not a validated prediction of interview quality.
 */
export const SCORE_EXPLANATION =
  "Your score reflects recent answers, question difficulty, and evidence across multiple scenarios. It is a practice signal, not a prediction of interview quality.";

export type EvidenceItem = {
  capability_area: CapabilityArea;
  is_correct: boolean;
  difficulty: Difficulty | string;
  recorded_at: string;
  sub_skill?: string;
  prep_session_id?: string | null;
  prep_question_id?: string | null;
};

export const DIFFICULTY_WEIGHTS: Record<Difficulty, number> = {
  foundation: 1,
  standard: 1.25,
  advanced: 1.5,
};
/** Older evidence counts less: weight halves every 90 days. */
export const RECENCY_HALF_LIFE_DAYS = 90;
/** Maximum total (difficulty × recency) weight a single sub-skill can contribute. */
export const SUBSKILL_WEIGHT_CAP = 8;

/** Evidence confidence: Low < 8 answers, Medium 8–19, High ≥ 20. */
export const CONFIDENCE_THRESHOLDS = { medium: 8, high: 20 } as const;
export type Confidence = "low" | "medium" | "high";
export const CONFIDENCE_LABELS: Record<Confidence, string> = {
  low: "Low confidence",
  medium: "Medium confidence",
  high: "High confidence",
};

/** Mastery stages. "building" = low confidence; never shown as a low score. */
export const STAGES = ["building", "foundation", "practiced", "calibrated", "mastery"] as const;
export type Stage = (typeof STAGES)[number];
export const STAGE_LABELS: Record<Stage, string> = {
  building: "Building profile",
  foundation: "Foundation",
  practiced: "Practiced",
  calibrated: "Calibrated",
  mastery: "Mastery",
};
/** Minimum weighted score per stage. Calibrated and Mastery also require High confidence. */
export const STAGE_MIN_SCORE = { practiced: 65, calibrated: 80, mastery: 90 } as const;

/** Recent direction: compare the last window with the window before it. */
export const DIRECTION_WINDOW_DAYS = 60;
export const DIRECTION_MIN_EVIDENCE = 5;
/** Accuracy change (percentage points) that counts as a real change. */
export const DIRECTION_STABILITY_POINTS = 10;
export type Direction = "improving" | "stable" | "declining" | "insufficient_data";
export const DIRECTION_LABELS: Record<Direction, string> = {
  improving: "Improving",
  stable: "Stable",
  declining: "Declining",
  insufficient_data: "Not enough comparable evidence",
};

/** Evidence is "current" when recorded within this window. */
export const FRESHNESS_DAYS = 90;

const DAY = 86_400_000;

export function evidenceWeight(difficulty: string, recordedAt: string, now = Date.now()): number {
  const d = DIFFICULTY_WEIGHTS[difficulty as Difficulty] ?? 1;
  const ageDays = Math.max(0, (now - new Date(recordedAt).getTime()) / DAY);
  return d * Math.pow(0.5, ageDays / RECENCY_HALF_LIFE_DAYS);
}

export function confidenceFor(count: number): Confidence {
  if (count >= CONFIDENCE_THRESHOLDS.high) return "high";
  if (count >= CONFIDENCE_THRESHOLDS.medium) return "medium";
  return "low";
}

export function stageFor(score: number, count: number): Stage {
  const c = confidenceFor(count);
  if (c === "low") return "building";
  if (c === "high" && score >= STAGE_MIN_SCORE.mastery) return "mastery";
  if (c === "high" && score >= STAGE_MIN_SCORE.calibrated) return "calibrated";
  if (score >= STAGE_MIN_SCORE.practiced) return "practiced";
  return "foundation";
}

/** Next stage and what it needs — for "progress toward the next stage". */
export function nextStageHint(score: number, count: number): string | null {
  const s = stageFor(score, count);
  if (s === "building") return `${Math.max(0, CONFIDENCE_THRESHOLDS.medium - count)} more answers to build a profile`;
  if (s === "foundation") return `Reach ${STAGE_MIN_SCORE.practiced}% for Practiced`;
  if (s === "practiced")
    return count < CONFIDENCE_THRESHOLDS.high
      ? `${CONFIDENCE_THRESHOLDS.high - count} more answers and ${STAGE_MIN_SCORE.calibrated}% for Calibrated`
      : `Reach ${STAGE_MIN_SCORE.calibrated}% for Calibrated`;
  if (s === "calibrated") return `Reach ${STAGE_MIN_SCORE.mastery}% for Mastery`;
  return null;
}

type Dated = { is_correct: boolean; recorded_at: string };

export function directionFor(items: Dated[], now = Date.now()): Direction {
  const w = DIRECTION_WINDOW_DAYS * DAY;
  const recent = items.filter((e) => now - new Date(e.recorded_at).getTime() <= w);
  const prior = items.filter((e) => {
    const age = now - new Date(e.recorded_at).getTime();
    return age > w && age <= 2 * w;
  });
  if (recent.length < DIRECTION_MIN_EVIDENCE || prior.length < DIRECTION_MIN_EVIDENCE)
    return "insufficient_data";
  const rate = (xs: Dated[]) => (xs.filter((x) => x.is_correct).length / xs.length) * 100;
  const delta = rate(recent) - rate(prior);
  if (delta > DIRECTION_STABILITY_POINTS) return "improving";
  if (delta < -DIRECTION_STABILITY_POINTS) return "declining";
  return "stable";
}

export function weightedScore(items: EvidenceItem[], now = Date.now()): number {
  const bySub = new Map<string, { num: number; den: number }>();
  for (const e of items) {
    const k = e.sub_skill ?? "_";
    const cur = bySub.get(k) ?? { num: 0, den: 0 };
    const w = evidenceWeight(e.difficulty, e.recorded_at, now);
    cur.den += w;
    if (e.is_correct) cur.num += w;
    bySub.set(k, cur);
  }
  let num = 0;
  let den = 0;
  for (const s of bySub.values()) {
    const f = s.den > SUBSKILL_WEIGHT_CAP ? SUBSKILL_WEIGHT_CAP / s.den : 1;
    num += s.num * f;
    den += s.den * f;
  }
  return den > 0 ? Math.round((num / den) * 100) : 0;
}

export type AreaProgress = {
  capability_area: CapabilityArea;
  total_questions: number;
  correct_answers: number;
  raw_percentage: number;
  weighted_score: number;
  evidence_confidence: Confidence;
  mastery_stage: Stage;
  last_evidence_at: string | null;
  recent_direction: Direction;
  next_stage: string | null;
};

export function computeAreaProgress(
  area: CapabilityArea,
  evidence: EvidenceItem[],
  now = Date.now(),
): AreaProgress {
  const items = evidence
    .filter((e) => e.capability_area === area)
    .sort((a, b) => a.recorded_at.localeCompare(b.recorded_at));
  const score = weightedScore(items, now);
  const correct = items.filter((e) => e.is_correct).length;
  return {
    capability_area: area,
    total_questions: items.length,
    correct_answers: correct,
    raw_percentage: items.length ? Math.round((correct / items.length) * 100) : 0,
    weighted_score: score,
    evidence_confidence: confidenceFor(items.length),
    mastery_stage: stageFor(score, items.length),
    last_evidence_at: items.at(-1)?.recorded_at ?? null,
    recent_direction: directionFor(items, now),
    next_stage: nextStageHint(score, items.length),
  };
}

export function computeAllProgress(evidence: EvidenceItem[], now = Date.now()): AreaProgress[] {
  return CAPABILITY_AREAS.map((a) => computeAreaProgress(a, evidence, now));
}

export const isReliable = (p: { evidence_confidence: Confidence }) =>
  p.evidence_confidence !== "low";

/** Only name strengths / priority areas at Medium confidence or above. */
export function strongestAndPriority(progress: AreaProgress[]) {
  const known = progress.filter(isReliable);
  if (known.length === 0) return { strongest: null, priority: null };
  const sorted = [...known].sort((a, b) => b.weighted_score - a.weighted_score);
  return {
    strongest: sorted[0]!.capability_area,
    priority: sorted.length > 1 ? sorted.at(-1)!.capability_area : null,
  };
}

/** Overall professional level: breadth of stages across areas plus preparation habit, not XP. */
export const PROFESSIONAL_LEVELS = [
  { level: 1, title: "New interviewer", minPoints: 0 },
  { level: 2, title: "Prepared interviewer", minPoints: 2 },
  { level: 3, title: "Structured interviewer", minPoints: 5 },
  { level: 4, title: "Trusted interviewer", minPoints: 9 },
  { level: 5, title: "Lead interviewer", minPoints: 13 },
  { level: 6, title: "Bar raiser", minPoints: 17 },
] as const;
const STAGE_POINTS: Record<Stage, number> = {
  building: 0,
  foundation: 1,
  practiced: 2,
  calibrated: 3,
  mastery: 4,
};

export function professionalLevel(progress: AreaProgress[], completedPreps: number) {
  const stagePts = progress.reduce((s, p) => s + (STAGE_POINTS[p.mastery_stage] ?? 0), 0);
  const habitPts = Math.min(3, Math.floor(completedPreps / 3));
  const points = stagePts + habitPts;
  let current: (typeof PROFESSIONAL_LEVELS)[number] = PROFESSIONAL_LEVELS[0];
  for (const l of PROFESSIONAL_LEVELS) if (points >= l.minPoints) current = l;
  const next = PROFESSIONAL_LEVELS.find((l) => l.minPoints > points) ?? null;
  return { ...current, points, next };
}
