import { CAPABILITY_AREAS, type CapabilityArea, type Difficulty } from "./taxonomy";
import { isReliable, type AreaProgress } from "./scoring";
import type { DevelopmentArea } from "./metrics";
import { areaForStage, hasCurrentEvidence, isReliableDevelopment } from "./metrics";

export const MIN_QUESTIONS = 4;
export const MAX_QUESTIONS = 6;
export const DEFAULT_QUESTIONS = 5;
/** Raise difficulty in an area once the score reaches this with Medium+ confidence. */
export const ADVANCE_DIFFICULTY_AT = 80;
export const FOUNDATION_BELOW = 50;

/** Target balance of a preparation (configurable). */
export const SELECTION_MIX = {
  development_area: 0.4,
  interview_relevance: 0.3,
  spaced_reinforcement: 0.2,
  coverage: 0.1,
} as const;

export type SelectionReason =
  | "interview_relevance"
  | "development_area"
  | "spaced_reinforcement"
  | "capability_coverage"
  | "calibration"
  | "fallback";

export type PlanEntry = { area: CapabilityArea; difficulty: Difficulty; reason: SelectionReason };

/** Order areas by need: lowest evidence first, then lowest score. */
export function prioritizeAreas(progress: AreaProgress[]): CapabilityArea[] {
  const byArea = new Map(progress.map((p) => [p.capability_area, p]));
  return [...CAPABILITY_AREAS].sort((a, b) => {
    const pa = byArea.get(a);
    const pb = byArea.get(b);
    const ra = pa && isReliable(pa) ? 1 : 0;
    const rb = pb && isReliable(pb) ? 1 : 0;
    if (ra !== rb) return ra - rb;
    if (!ra) return (pa?.total_questions ?? 0) - (pb?.total_questions ?? 0);
    return (pa?.weighted_score ?? 0) - (pb?.weighted_score ?? 0);
  });
}

/** Progressive difficulty; stays at standard until evidence is reliable. */
export function difficultyFor(p: AreaProgress | undefined): Difficulty {
  if (!p || !isReliable(p)) return "standard";
  if (p.weighted_score >= ADVANCE_DIFFICULTY_AT) return "advanced";
  if (p.weighted_score < FOUNDATION_BELOW) return "foundation";
  return "standard";
}

/**
 * Build a per-question plan using the 40/30/20/10 mix. Only reliable development areas are
 * targeted (never one wrong answer). Works without history or context: empty buckets fall
 * through to coverage, and the whole plan falls back to need order.
 */
export function buildQuestionPlan(
  progress: AreaProgress[],
  count = DEFAULT_QUESTIONS,
  opts: { development?: DevelopmentArea[]; stage?: string | null; now?: number } = {},
): PlanEntry[] {
  const n = Math.min(MAX_QUESTIONS, Math.max(MIN_QUESTIONS, count));
  const now = opts.now ?? Date.now();
  const byArea = new Map(progress.map((p) => [p.capability_area, p]));
  const order = prioritizeAreas(progress);
  const plan: PlanEntry[] = [];
  const push = (area: CapabilityArea, reason: SelectionReason) =>
    plan.push({ area, difficulty: difficultyFor(byArea.get(area)), reason });

  const devAreas = [...new Set((opts.development ?? []).filter(isReliableDevelopment).map((d) => d.area))];
  const stageArea = areaForStage(opts.stage);
  const spaced = progress
    .filter((p) => isReliable(p) && !hasCurrentEvidence(p.last_evidence_at, now - 21 * 86_400_000))
    .map((p) => p.capability_area);
  const strongest = [...progress].filter(isReliable).sort((a, b) => b.weighted_score - a.weighted_score)[0];

  const quota = (share: number) => Math.round(share * n);
  for (let i = 0; i < quota(SELECTION_MIX.development_area) && devAreas.length; i++)
    push(devAreas[i % devAreas.length]!, "development_area");
  for (let i = 0; i < quota(SELECTION_MIX.interview_relevance) && stageArea; i++) push(stageArea, "interview_relevance");
  for (let i = 0; i < quota(SELECTION_MIX.spaced_reinforcement) && spaced.length; i++)
    push(spaced[i % spaced.length]!, "spaced_reinforcement");
  if (strongest && plan.length < n) push(strongest.capability_area, "calibration");

  // Fill remaining slots with coverage in need order, preferring areas not yet in the plan.
  const hasHistory = progress.some((p) => p.total_questions > 0);
  let k = 0;
  while (plan.length < n) {
    const unused = order.filter((a) => !plan.some((p) => p.area === a));
    const area = unused[0] ?? order[k++ % order.length]!;
    push(area, hasHistory ? "capability_coverage" : "fallback");
  }
  // Ensure at least two areas are covered.
  if (new Set(plan.map((p) => p.area)).size < 2) {
    const other = order.find((a) => a !== plan[0]!.area)!;
    plan[plan.length - 1] = { area: other, difficulty: difficultyFor(byArea.get(other)), reason: "capability_coverage" };
  }
  return plan.slice(0, n);
}
