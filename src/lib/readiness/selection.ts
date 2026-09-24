import { CAPABILITY_AREAS, type CapabilityArea, type Difficulty } from "./taxonomy";
import type { AreaProgress } from "./scoring";

export const MIN_QUESTIONS = 4;
export const MAX_QUESTIONS = 6;
export const DEFAULT_QUESTIONS = 5;
/** Raise difficulty in an area once accuracy reaches this with moderate+ confidence. */
export const ADVANCE_DIFFICULTY_AT = 80;
export const FOUNDATION_BELOW = 50;

/** Order areas by need: lowest confidence first, then lowest score. */
export function prioritizeAreas(progress: AreaProgress[]): CapabilityArea[] {
  const rank = { insufficient: 0, low: 1, moderate: 2, high: 3 } as const;
  const byArea = new Map(progress.map((p) => [p.capability_area, p]));
  return [...CAPABILITY_AREAS].sort((a, b) => {
    const pa = byArea.get(a);
    const pb = byArea.get(b);
    const ca = pa ? rank[pa.evidence_confidence] : 0;
    const cb = pb ? rank[pb.evidence_confidence] : 0;
    if (ca !== cb) return ca - cb;
    return (pa?.weighted_score ?? 0) - (pb?.weighted_score ?? 0);
  });
}

export function difficultyFor(p: AreaProgress | undefined): Difficulty {
  if (!p || p.evidence_confidence === "insufficient" || p.evidence_confidence === "low")
    return "standard";
  if (p.weighted_score >= ADVANCE_DIFFICULTY_AT) return "advanced";
  if (p.weighted_score < FOUNDATION_BELOW) return "foundation";
  return "standard";
}

/** Build a per-question plan covering at least two areas, weighted toward needs. */
export function buildQuestionPlan(progress: AreaProgress[], count = DEFAULT_QUESTIONS) {
  const n = Math.min(MAX_QUESTIONS, Math.max(MIN_QUESTIONS, count));
  const order = prioritizeAreas(progress);
  const byArea = new Map(progress.map((p) => [p.capability_area, p]));
  // Pattern: need #1 twice, then round-robin across the rest.
  const seq: CapabilityArea[] = [order[0]!, order[1]!, order[0]!, order[2]!, order[3]!, order[1]!];
  return seq.slice(0, n).map((area) => ({ area, difficulty: difficultyFor(byArea.get(area)) }));
}
