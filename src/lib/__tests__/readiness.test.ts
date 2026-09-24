import { describe, expect, it } from "vitest";
import {
  CAPABILITY_AREAS,
  SUB_SKILLS,
  isValidSubSkill,
  capabilityAreaSchema,
} from "@/lib/readiness/taxonomy";
import {
  computeAllProgress,
  computeAreaProgress,
  confidenceFor,
  stageFor,
  directionFor,
  professionalLevel,
  strongestAndPriority,
  type EvidenceItem,
} from "@/lib/readiness/scoring";
import { evaluateRecognition } from "@/lib/readiness/recognition";
import { buildQuestionPlan, difficultyFor } from "@/lib/readiness/selection";
import {
  selectFallback,
  validateAiQuestions,
  contextCompleteness,
  buildPrompt,
} from "@/lib/readiness/generator";
import { prepStatusOf } from "@/lib/readiness.server";

const now = Date.parse("2026-09-24T12:00:00Z");
const ev = (area: EvidenceItem["capability_area"], correct: boolean, i = 0): EvidenceItem => ({
  capability_area: area,
  is_correct: correct,
  difficulty: "standard",
  recorded_at: new Date(now - (100 - i) * 60_000).toISOString(),
});

describe("taxonomy", () => {
  it("has four areas with six sub-skills each", () => {
    expect(CAPABILITY_AREAS).toHaveLength(4);
    for (const a of CAPABILITY_AREAS) expect(SUB_SKILLS[a]).toHaveLength(6);
  });
  it("validates areas and sub-skills", () => {
    expect(capabilityAreaSchema.safeParse("bias_mitigation").success).toBe(true);
    expect(capabilityAreaSchema.safeParse("vibes").success).toBe(false);
    expect(isValidSubSkill("bias_mitigation", "affinity_bias")).toBe(true);
    expect(isValidSubSkill("bias_mitigation", "calibration")).toBe(false);
  });
});

describe("scoring", () => {
  it("confidence thresholds", () => {
    expect(confidenceFor(0)).toBe("low");
    expect(confidenceFor(7)).toBe("low");
    expect(confidenceFor(8)).toBe("medium");
    expect(confidenceFor(19)).toBe("medium");
    expect(confidenceFor(20)).toBe("high");
  });
  it("stage needs both score and evidence", () => {
    expect(stageFor(100, 7)).toBe("building");
    expect(stageFor(40, 8)).toBe("foundation");
    expect(stageFor(70, 10)).toBe("practiced");
    expect(stageFor(95, 19)).toBe("practiced");
    expect(stageFor(85, 20)).toBe("calibrated");
    expect(stageFor(95, 30)).toBe("mastery");
  });
  it("shows building profile with little evidence", () => {
    const p = computeAreaProgress("decision_quality", [ev("decision_quality", true)], now);
    expect(p.mastery_stage).toBe("building");
    expect(p.weighted_score).toBe(100);
  });
  it("direction detects improvement", () => {
    const at = (days: number) => new Date(now - days * 86_400_000).toISOString();
    const prior = Array.from({ length: 5 }, () => ({ is_correct: false, recorded_at: at(90) }));
    const recent = Array.from({ length: 5 }, () => ({ is_correct: true, recorded_at: at(10) }));
    expect(directionFor([...prior, ...recent], now)).toBe("improving");
    expect(directionFor([...recent, ...recent.map((r) => ({ ...r, recorded_at: at(90) }))], now)).toBe("stable");
    expect(directionFor(recent, now)).toBe("insufficient_data");
  });
  it("does not name weaknesses at low confidence", () => {
    const prog = computeAllProgress([ev("bias_mitigation", false)], now);
    expect(strongestAndPriority(prog)).toEqual({ strongest: null, priority: null });
  });
  it("professional level is not XP-based", () => {
    expect(professionalLevel(computeAllProgress([]), 0).level).toBe(1);
    const lots = CAPABILITY_AREAS.flatMap((a) =>
      Array.from({ length: 12 }, (_, i) => ev(a, true, i)),
    );
    expect(professionalLevel(computeAllProgress(lots, now), 9).level).toBeGreaterThanOrEqual(4);
  });
});

describe("recognition", () => {
  const base = {
    completedPreps: 1,
    advancePreps: 0,
    lastSessionPerfect: false,
    progress: computeAllProgress([]),
    alreadyEarned: new Set<string>(),
  };
  it("awards first prep once", () => {
    expect(evaluateRecognition(base)).toEqual(["prep_first"]);
    expect(evaluateRecognition({ ...base, alreadyEarned: new Set(["prep_first"]) })).toEqual([]);
  });
  it("awards perfect prep", () => {
    expect(evaluateRecognition({ ...base, lastSessionPerfect: true })).toContain("prep_perfect");
  });
});

describe("adaptive selection", () => {
  it("builds 4-6 questions across at least two areas", () => {
    for (const n of [1, 4, 5, 6, 9]) {
      const plan = buildQuestionPlan(computeAllProgress([]), n);
      expect(plan.length).toBeGreaterThanOrEqual(4);
      expect(plan.length).toBeLessThanOrEqual(6);
      expect(new Set(plan.map((p) => p.area)).size).toBeGreaterThanOrEqual(2);
    }
  });
  it("prioritises the lowest-confidence area", () => {
    const evs = ["structured_evaluation", "candidate_experience", "decision_quality"].flatMap((a) =>
      Array.from({ length: 6 }, (_, i) => ev(a as EvidenceItem["capability_area"], true, i)),
    );
    expect(buildQuestionPlan(computeAllProgress(evs, now))[0]!.area).toBe("bias_mitigation");
  });
  it("raises difficulty when accuracy is high", () => {
    const p = computeAreaProgress(
      "decision_quality",
      Array.from({ length: 10 }, (_, i) => ev("decision_quality", true, i)),
      now,
    );
    expect(difficultyFor(p)).toBe("advanced");
    const few = computeAreaProgress("decision_quality", [ev("decision_quality", true)], now);
    expect(difficultyFor(few)).toBe("standard");
  });
});

describe("generator", () => {
  const plan = buildQuestionPlan(computeAllProgress([]), 5);
  it("fallback never returns empty and matches plan areas", () => {
    const qs = selectFallback(plan);
    expect(qs).toHaveLength(5);
    qs.forEach((q, i) => {
      expect(q.capabilityArea).toBe(plan[i]!.area);
      expect(isValidSubSkill(q.capabilityArea, q.subSkill)).toBe(true);
      expect(q.contextSource).toBe("library");
    });
  });
  it("rejects invalid AI output", () => {
    expect(validateAiQuestions(null, plan)).toBeNull();
    expect(validateAiQuestions([{ scenario: "x" }], plan)).toBeNull();
  });
  it("filters hire recommendations and bad indexes", () => {
    const good = (area: string) => ({
      scenario: "The candidate gives a vague answer about a past project. What do you do?",
      options: ["Probe for specifics", "Move on", "Assume competence"],
      correctIndex: 0,
      explanation: "Behavioural probing gathers evidence.",
      capabilityArea: area,
      subSkill: "behavioural_probing",
    });
    const raw = [
      good("structured_evaluation"),
      good("bias_mitigation"),
      good("structured_evaluation"),
      good("decision_quality"),
      { ...good("structured_evaluation"), correctIndex: 7 },
      {
        ...good("structured_evaluation"),
        explanation: "You should hire this candidate immediately.",
      },
    ];
    const out = validateAiQuestions(raw, plan)!;
    expect(out).toHaveLength(4);
    // invalid sub-skill for area is normalised
    expect(isValidSubSkill("bias_mitigation", out[1]!.subSkill)).toBe(true);
  });
  it("prompt forbids candidate evaluation and caps context", () => {
    const p = buildPrompt(
      { roleTitle: "PM", stage: "Panel", competencies: [], candidateProfile: "x".repeat(10000) },
      plan,
    );
    expect(p).toMatch(/Never recommend whether to hire/);
    expect(p.length).toBeLessThan(8000);
  });
  it("context completeness", () => {
    expect(contextCompleteness({ roleTitle: "a", stage: "b", competencies: [] })).toBe(40);
    expect(
      contextCompleteness({
        roleTitle: "a",
        stage: "b",
        competencies: ["x"],
        responsibility: "r",
        jobDescription: "j",
        candidateProfile: "c",
        principles: ["p"],
      }),
    ).toBe(100);
  });
});

describe("prep status", () => {
  it("maps session status", () => {
    expect(prepStatusOf(undefined)).toBe("not_started");
    expect(prepStatusOf("generated")).toBe("in_progress");
    expect(prepStatusOf("completed")).toBe("completed");
  });
});
