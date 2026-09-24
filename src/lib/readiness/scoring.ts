import { CAPABILITY_AREAS, type CapabilityArea, type Difficulty } from "./taxonomy";

export type EvidenceItem = {
  capability_area: CapabilityArea;
  is_correct: boolean;
  difficulty: Difficulty | string;
  recorded_at: string;
};

/** Difficulty weights applied to each piece of evidence. */
export const DIFFICULTY_WEIGHTS: Record<Difficulty, number> = {
  foundation: 1,
  standard: 1.25,
  advanced: 1.5,
};
/** Older evidence counts less: weight halves every 90 days. */
export const RECENCY_HALF_LIFE_DAYS = 90;

/** Evidence-confidence thresholds (number of answered questions in an area). */
export const CONFIDENCE_THRESHOLDS = { low: 1, moderate: 5, high: 12 } as const;
export type Confidence = "insufficient" | "low" | "moderate" | "high";

/** Capability stages require BOTH a weighted score and enough evidence. */
export const STAGES = [
  "building",
  "emerging",
  "developing",
  "proficient",
  "advanced",
  "expert",
] as const;
export type Stage = (typeof STAGES)[number];
export const STAGE_THRESHOLDS: {
  stage: Exclude<Stage, "building">;
  minScore: number;
  minEvidence: number;
}[] = [
  { stage: "expert", minScore: 90, minEvidence: 30 },
  { stage: "advanced", minScore: 80, minEvidence: 18 },
  { stage: "proficient", minScore: 70, minEvidence: 12 },
  { stage: "developing", minScore: 55, minEvidence: 5 },
  { stage: "emerging", minScore: 0, minEvidence: 5 },
];
export const STAGE_LABELS: Record<Stage, string> = {
  building: "Building profile",
  emerging: "Emerging",
  developing: "Developing",
  proficient: "Proficient",
  advanced: "Advanced",
  expert: "Expert",
};

/** Recent direction compares the last N answers to the ones before. */
export const DIRECTION_WINDOW = 5;
export const DIRECTION_DELTA = 0.15;
export type Direction = "improving" | "steady" | "declining";

export function evidenceWeight(difficulty: string, recordedAt: string, now = Date.now()): number {
  const d = DIFFICULTY_WEIGHTS[difficulty as Difficulty] ?? 1;
  const ageDays = Math.max(0, (now - new Date(recordedAt).getTime()) / 86_400_000);
  return d * Math.pow(0.5, ageDays / RECENCY_HALF_LIFE_DAYS);
}

export function confidenceFor(count: number): Confidence {
  if (count >= CONFIDENCE_THRESHOLDS.high) return "high";
  if (count >= CONFIDENCE_THRESHOLDS.moderate) return "moderate";
  if (count >= CONFIDENCE_THRESHOLDS.low) return "low";
  return "insufficient";
}

export function stageFor(score: number, count: number): Stage {
  for (const t of STAGE_THRESHOLDS)
    if (score >= t.minScore && count >= t.minEvidence) return t.stage;
  return "building";
}

export function directionFor(sortedOldestFirst: { is_correct: boolean }[]): Direction {
  if (sortedOldestFirst.length < DIRECTION_WINDOW * 2) return "steady";
  const rate = (xs: { is_correct: boolean }[]) => xs.filter((x) => x.is_correct).length / xs.length;
  const recent = rate(sortedOldestFirst.slice(-DIRECTION_WINDOW));
  const prior = rate(sortedOldestFirst.slice(-DIRECTION_WINDOW * 2, -DIRECTION_WINDOW));
  if (recent - prior >= DIRECTION_DELTA) return "improving";
  if (prior - recent >= DIRECTION_DELTA) return "declining";
  return "steady";
}

export type AreaProgress = {
  capability_area: CapabilityArea;
  total_questions: number;
  correct_answers: number;
  weighted_score: number;
  evidence_confidence: Confidence;
  mastery_stage: Stage;
  last_evidence_at: string | null;
  recent_direction: Direction;
};

export function computeAreaProgress(
  area: CapabilityArea,
  evidence: EvidenceItem[],
  now = Date.now(),
): AreaProgress {
  const items = evidence
    .filter((e) => e.capability_area === area)
    .sort((a, b) => a.recorded_at.localeCompare(b.recorded_at));
  let num = 0;
  let den = 0;
  for (const e of items) {
    const w = evidenceWeight(e.difficulty, e.recorded_at, now);
    den += w;
    if (e.is_correct) num += w;
  }
  const score = den > 0 ? Math.round((num / den) * 100) : 0;
  return {
    capability_area: area,
    total_questions: items.length,
    correct_answers: items.filter((e) => e.is_correct).length,
    weighted_score: score,
    evidence_confidence: confidenceFor(items.length),
    mastery_stage: stageFor(score, items.length),
    last_evidence_at: items.at(-1)?.recorded_at ?? null,
    recent_direction: directionFor(items),
  };
}

export function computeAllProgress(evidence: EvidenceItem[], now = Date.now()): AreaProgress[] {
  return CAPABILITY_AREAS.map((a) => computeAreaProgress(a, evidence, now));
}

/** Only name strengths/development areas when confidence is at least moderate. */
export function strongestAndPriority(progress: AreaProgress[]) {
  const known = progress.filter(
    (p) => p.evidence_confidence === "moderate" || p.evidence_confidence === "high",
  );
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
  { level: 2, title: "Prepared interviewer", minPoints: 3 },
  { level: 3, title: "Structured interviewer", minPoints: 7 },
  { level: 4, title: "Trusted interviewer", minPoints: 12 },
  { level: 5, title: "Lead interviewer", minPoints: 17 },
  { level: 6, title: "Bar raiser", minPoints: 21 },
] as const;
const STAGE_POINTS: Record<Stage, number> = {
  building: 0,
  emerging: 1,
  developing: 2,
  proficient: 3,
  advanced: 4,
  expert: 5,
};

export function professionalLevel(progress: AreaProgress[], completedPreps: number) {
  const stagePts = progress.reduce((s, p) => s + STAGE_POINTS[p.mastery_stage], 0);
  const habitPts = Math.min(3, Math.floor(completedPreps / 3));
  const points = stagePts + habitPts;
  let current: (typeof PROFESSIONAL_LEVELS)[number] = PROFESSIONAL_LEVELS[0];
  for (const l of PROFESSIONAL_LEVELS) if (points >= l.minPoints) current = l;
  const next = PROFESSIONAL_LEVELS.find((l) => l.minPoints > points) ?? null;
  return { ...current, points, next };
}
