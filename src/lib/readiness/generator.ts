import { z } from "zod";
import { questionsByWeek } from "@/lib/curriculum";
import { quarterForWeek } from "@/lib/gamification";
import {
  CAPABILITY_AREAS,
  QUARTER_TO_AREA,
  SUB_SKILLS,
  capabilityAreaSchema,
  isValidSubSkill,
  type CapabilityArea,
  type Difficulty,
} from "./taxonomy";

export type PlanItem = { area: CapabilityArea; difficulty: Difficulty };

export type PrepQuestionDraft = {
  scenario: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  capabilityArea: CapabilityArea;
  subSkill: string;
  difficulty: Difficulty;
  contextSource: "ai" | "library";
};

export type PrepContext = {
  roleTitle: string;
  stage: string;
  competencies: string[];
  responsibility?: string | null | undefined;
  jobDescription?: string | null | undefined;
  candidateProfile?: string | null | undefined;
  principles?: string[] | undefined;
};

const aiQuestionSchema = z.object({
  scenario: z.string().min(20),
  options: z.array(z.string().min(1)).min(2).max(4),
  correctIndex: z.number().int().min(0),
  explanation: z.string().min(10),
  capabilityArea: capabilityAreaSchema,
  subSkill: z.string(),
});

const BANNED =
  /\b(should (not )?(be )?hire|hire (this|the) candidate|reject (this|the) candidate|recommend hiring)\b/i;

/** Validates and normalises AI output against the plan. Returns null if unusable. */
export function validateAiQuestions(raw: unknown, plan: PlanItem[]): PrepQuestionDraft[] | null {
  if (!Array.isArray(raw)) return null;
  const out: PrepQuestionDraft[] = [];
  for (let i = 0; i < raw.length && out.length < plan.length; i++) {
    const r = aiQuestionSchema.safeParse(raw[i]);
    if (!r.success) continue;
    const q = r.data;
    if (q.correctIndex >= q.options.length) continue;
    if (new Set(q.options).size !== q.options.length) continue;
    if (BANNED.test(q.scenario) || BANNED.test(q.explanation)) continue;
    const sub = isValidSubSkill(q.capabilityArea, q.subSkill)
      ? q.subSkill
      : SUB_SKILLS[q.capabilityArea][0];
    out.push({
      scenario: q.scenario.trim(),
      options: q.options.map((o) => o.trim()),
      correctIndex: q.correctIndex,
      explanation: q.explanation.trim(),
      capabilityArea: q.capabilityArea,
      subSkill: sub,
      difficulty: plan[out.length]!.difficulty,
      contextSource: "ai",
    });
  }
  const areas = new Set(out.map((q) => q.capabilityArea));
  return out.length >= 4 && areas.size >= 2 ? out : null;
}

type LibraryQ = PrepQuestionDraft & { key: string };

export function libraryPool(): LibraryQ[] {
  const pool: LibraryQ[] = [];
  for (const [w, qs] of Object.entries(questionsByWeek)) {
    const week = Number(w);
    const area = QUARTER_TO_AREA[quarterForWeek(week)] ?? CAPABILITY_AREAS[0];
    qs.forEach((q, i) => {
      const subs = SUB_SKILLS[area];
      pool.push({
        key: `${week}-${i}`,
        scenario: q.scenario,
        options: q.options,
        correctIndex: q.correctIndex,
        explanation: q.explanation,
        capabilityArea: area,
        subSkill: subs[(week + i) % subs.length]!,
        difficulty: i === 0 ? "foundation" : i === 1 ? "standard" : "advanced",
        contextSource: "library",
      });
    });
  }
  return pool;
}

/** Deterministic-with-seed fallback selection from the curated library. Never empty. */
export function selectFallback(
  plan: PlanItem[],
  exclude: Set<string> = new Set(),
  rand = Math.random,
) {
  const pool = libraryPool().filter((q) => !exclude.has(q.key));
  const used = new Set<string>();
  return plan.map((p) => {
    const exact = pool.filter(
      (q) => q.capabilityArea === p.area && q.difficulty === p.difficulty && !used.has(q.key),
    );
    const areaOnly = pool.filter((q) => q.capabilityArea === p.area && !used.has(q.key));
    const list = exact.length
      ? exact
      : areaOnly.length
        ? areaOnly
        : pool.filter((q) => !used.has(q.key));
    const pick = list[Math.floor(rand() * list.length)]!;
    used.add(pick.key);
    const { key: _k, ...rest } = pick;
    return { ...rest, difficulty: p.difficulty };
  });
}

export function contextCompleteness(c: PrepContext): number {
  let s = 40; // role, stage always present
  if (c.competencies.length) s += 20;
  if (c.responsibility?.trim()) s += 10;
  if (c.jobDescription?.trim()) s += 15;
  if (c.candidateProfile?.trim()) s += 10;
  if (c.principles?.length) s += 5;
  return Math.min(100, s);
}

export function buildPrompt(c: PrepContext, plan: PlanItem[]): string {
  const lines = [
    `Create exactly ${plan.length} scenario questions that prepare an interviewer for one specific upcoming interview.`,
    `Role: ${c.roleTitle}`,
    `Interview stage: ${c.stage}`,
    `Competencies this interviewer assesses: ${c.competencies.join(", ") || "not specified"}`,
    c.responsibility ? `Interviewer responsibility: ${c.responsibility}` : "",
    c.principles?.length
      ? `Company interviewing principles (use only these, never invent others): ${c.principles.join("; ")}`
      : "Company principles: none supplied — do not invent company policies.",
    c.jobDescription ? `Job description (excerpt):\n${c.jobDescription.slice(0, 6000)}` : "",
    c.candidateProfile
      ? `Candidate CV context (excerpt; use only for fair, job-relevant probing; never repeat personal details, never infer protected characteristics such as age, gender, ethnicity, religion, disability, family status):\n${c.candidateProfile.slice(0, 4000)}`
      : "",
    "",
    "Question plan (one per line, in order):",
    ...plan.map(
      (p, i) =>
        `${i + 1}. capabilityArea=${p.area}, difficulty=${p.difficulty}, subSkill one of: ${SUB_SKILLS[p.area].join(", ")}`,
    ),
    "",
    "Rules: each question presents a realistic decision the INTERVIEWER must make; 3 plausible options (2–4 allowed); exactly one clearly defensible best answer; explanation of 1–2 sentences.",
    "Never recommend whether to hire, never score or rank the candidate, never predict outcomes, never suggest discriminatory or illegal questions.",
  ];
  return lines.filter(Boolean).join("\n");
}
