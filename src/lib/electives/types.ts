export type ElectiveQuestion = {
  scenario: string;
  options: string[];
  correctIndex: number;
  explanation: string;
};

export type ElectiveLesson = {
  slug: string;
  title: string;
  focus: string;
  questions: [ElectiveQuestion, ElectiveQuestion, ElectiveQuestion];
};

export type ElectiveCategory =
  | "functional"
  | "operational"
  | "playbook"
  | "compliance";

export type ElectiveModule = {
  slug: string;
  title: string;
  category: ElectiveCategory;
  audience: string;
  summary: string;
  objectives: string[];
  artifact: string;
  lessons: ElectiveLesson[];
};

export const CATEGORY_META: Record<
  ElectiveCategory,
  { name: string; blurb: string }
> = {
  functional: {
    name: "Functional tracks",
    blurb: "Domain-specific signal extraction for the roles you hire most.",
  },
  operational: {
    name: "Operational & contextual",
    blurb: "Adapting the loop to speed, distance, seniority and culture.",
  },
  playbook: {
    name: "Manager & panel playbooks",
    blurb: "Running the loop end to end: spec, debrief, offer, audit.",
  },
  compliance: {
    name: "Compliance guardrails",
    blurb: "Legal and cross-cultural guardrails for global interviewing.",
  },
};
