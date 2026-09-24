import { z } from "zod";

export const CAPABILITY_AREAS = [
  "structured_evaluation",
  "bias_mitigation",
  "candidate_experience",
  "decision_quality",
] as const;
export type CapabilityArea = (typeof CAPABILITY_AREAS)[number];
export const capabilityAreaSchema = z.enum(CAPABILITY_AREAS);

export const AREA_LABELS: Record<CapabilityArea, string> = {
  structured_evaluation: "Structured evaluation",
  bias_mitigation: "Inclusive hiring & bias mitigation",
  candidate_experience: "Candidate experience",
  decision_quality: "Decision quality & leadership",
};

export const SUB_SKILLS = {
  structured_evaluation: [
    "behavioural_probing",
    "evidence_vs_impression",
    "scorecard_discipline",
    "competency_alignment",
    "evidence_quality",
    "consistent_questioning",
  ],
  bias_mitigation: [
    "affinity_bias",
    "pedigree_bias",
    "career_gap_fairness",
    "non_linear_careers",
    "consistent_evaluation",
    "culture_fit_language",
  ],
  candidate_experience: [
    "clear_expectations",
    "relevant_questioning",
    "professional_communication",
    "respectful_closing",
    "realistic_role_representation",
    "candidate_time_respect",
  ],
  decision_quality: [
    "independent_scoring",
    "calibration",
    "conflicting_evidence",
    "defensible_decision",
    "groupthink_prevention",
    "evidence_based_debrief",
  ],
} as const satisfies Record<CapabilityArea, readonly string[]>;

export function isValidSubSkill(area: CapabilityArea, sub: string): boolean {
  return (SUB_SKILLS[area] as readonly string[]).includes(sub);
}

export function subSkillLabel(sub: string): string {
  const s = sub.replace(/_/g, " ");
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export const DIFFICULTIES = ["foundation", "standard", "advanced"] as const;
export type Difficulty = (typeof DIFFICULTIES)[number];

export const INTERVIEW_STAGES = [
  "Phone screen",
  "Hiring manager interview",
  "Technical interview",
  "Case / work sample",
  "Panel interview",
  "Final interview",
] as const;

export const COMMON_COMPETENCIES = [
  "Problem solving",
  "Communication",
  "Collaboration",
  "Ownership",
  "Leadership",
  "Technical depth",
  "Customer focus",
  "Adaptability",
] as const;

/** Maps the legacy curriculum quarter to a capability area for the fallback library. */
export const QUARTER_TO_AREA: Record<number, CapabilityArea> = {
  1: "structured_evaluation",
  2: "bias_mitigation",
  3: "candidate_experience",
  4: "decision_quality",
};
