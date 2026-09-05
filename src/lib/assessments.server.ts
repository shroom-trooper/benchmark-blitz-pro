import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { getQuestionsForWeek } from "./curriculum";
import { levelForXp, quarterForWeek } from "./gamification";

type DB = SupabaseClient<Database>;

export const MAX_QUESTIONS = 25;

export type DraftQuestion = {
  scenario: string;
  options: string[];
  correctIndex: number;
  explanation: string;
};

function fail(message: string): never {
  throw new Error(message);
}

async function requireOwnedGroup(supabase: DB, userId: string) {
  const { data } = await supabase
    .from("groups")
    .select("*")
    .eq("owner_id", userId)
    .maybeSingle();
  if (!data) fail("You do not own a group yet.");
  return data;
}

async function requireOwnedAssessment(supabase: DB, userId: string, id: string) {
  const group = await requireOwnedGroup(supabase, userId);
  const { data } = await supabase
    .from("assessments")
    .select("*")
    .eq("id", id)
    .eq("group_id", group.id)
    .maybeSingle();
  if (!data) fail("Assessment not found.");
  return { group, assessment: data };
}

async function insertQuestions(supabase: DB, assessmentId: string, qs: DraftQuestion[]) {
  if (!qs.length) return;
  const { error } = await supabase.from("assessment_questions").insert(
    qs.map((q, i) => ({
      assessment_id: assessmentId,
      position: i,
      scenario: q.scenario,
      options: q.options,
      correct_index: q.correctIndex,
      explanation: q.explanation,
    })),
  );
  if (error) fail(error.message);
}

/* ------------------------------------------------------------------ owner */

export async function listAssessments(supabase: DB, userId: string) {
  const group = await requireOwnedGroup(supabase, userId);
  const { data: rows } = await supabase
    .from("assessments")
    .select("*")
    .eq("group_id", group.id)
    .order("created_at", { ascending: false });
  const list = rows ?? [];
  const ids = list.map((a) => a.id);

  const [{ data: questions }, { data: responses }] = await Promise.all([
    ids.length
      ? supabase.from("assessment_questions").select("id, assessment_id").in("assessment_id", ids)
      : Promise.resolve({ data: [] as { id: string; assessment_id: string }[] }),
    ids.length
      ? supabase
          .from("assessment_responses")
          .select("assessment_id, score, user_id")
          .in("assessment_id", ids)
      : Promise.resolve({ data: [] as { assessment_id: string; score: number; user_id: string }[] }),
  ]);

  const { count: memberCount } = await supabase
    .from("profiles")
    .select("id", { count: "exact", head: true })
    .eq("group_id", group.id);

  return {
    groupName: group.name,
    memberCount: memberCount ?? 0,
    assessments: list.map((a) => {
      const qCount = (questions ?? []).filter((q) => q.assessment_id === a.id).length;
      const rs = (responses ?? []).filter((r) => r.assessment_id === a.id);
      const totalScore = rs.reduce((s, r) => s + r.score, 0);
      return {
        id: a.id,
        title: a.title,
        description: a.description,
        source: a.source,
        status: a.status,
        targetQuestions: a.target_questions,
        estimatedMinutes: a.estimated_minutes,
        createdAt: a.created_at,
        questionCount: qCount,
        completions: rs.length,
        avgScore: rs.length ? Math.round((totalScore / rs.length) * 100) / 100 : 0,
        accuracy: rs.length && qCount ? Math.round((totalScore / (rs.length * qCount)) * 100) : 0,
      };
    }),
  };
}

export async function loadAssessmentEditor(supabase: DB, userId: string, id: string) {
  const { assessment } = await requireOwnedAssessment(supabase, userId, id);
  const { data: questions } = await supabase
    .from("assessment_questions")
    .select("*")
    .eq("assessment_id", id)
    .order("position");

  const { data: responses } = await supabase
    .from("assessment_responses")
    .select("user_id, score, completed_at")
    .eq("assessment_id", id);

  const userIds = (responses ?? []).map((r) => r.user_id);
  const { data: profiles } = userIds.length
    ? await supabase
        .from("profiles")
        .select("id, email, full_name, display_name")
        .in("id", userIds)
    : { data: [] as { id: string; email: string; full_name: string | null; display_name: string | null }[] };

  return {
    assessment: {
      id: assessment.id,
      title: assessment.title,
      description: assessment.description,
      source: assessment.source,
      status: assessment.status,
      estimatedMinutes: assessment.estimated_minutes,
      targetQuestions: assessment.target_questions,
    },
    questions: (questions ?? []).map((q) => ({
      id: q.id,
      position: q.position,
      scenario: q.scenario,
      options: (q.options as string[]) ?? [],
      correctIndex: q.correct_index,
      explanation: q.explanation,
    })),
    results: (responses ?? []).map((r) => {
      const p = (profiles ?? []).find((x) => x.id === r.user_id);
      return {
        userId: r.user_id,
        name: p?.display_name || p?.full_name || p?.email?.split("@")[0] || "Member",
        email: p?.email ?? "",
        score: r.score,
        completedAt: r.completed_at,
      };
    }),
  };
}

export async function createFromLibrary(
  supabase: DB,
  userId: string,
  input: {
    title: string;
    description: string;
    quarters: number[];
    targetQuestions: number;
    minutesPerQuestion: number;
  },
) {
  const group = await requireOwnedGroup(supabase, userId);
  const quarters = input.quarters.length ? input.quarters : [1, 2, 3, 4];

  const pool: DraftQuestion[] = [];
  for (let week = 1; week <= 52; week++) {
    if (!quarters.includes(quarterForWeek(week))) continue;
    for (const q of getQuestionsForWeek(week)) pool.push(q);
  }
  if (!pool.length) fail("No questions found for the selected themes.");

  // Shuffle then take the target count.
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j]!, pool[i]!];
  }
  const target = Math.min(input.targetQuestions, MAX_QUESTIONS, pool.length);
  const picked = pool.slice(0, target);

  const { data, error } = await supabase
    .from("assessments")
    .insert({
      group_id: group.id,
      created_by: userId,
      title: input.title.trim(),
      description: input.description.trim(),
      source: "library",
      target_questions: target,
      estimated_minutes: Math.max(1, Math.round(target * input.minutesPerQuestion)),
      status: "draft",
    })
    .select()
    .single();
  if (error) fail(error.message);

  await insertQuestions(supabase, data.id, picked);
  return { id: data.id as string, generated: picked.length };
}

/* --------------------------------------------------------------------- AI */

type SourceFile = { name: string; mimeType: string; dataBase64: string };

async function generateQuestions(
  apiKey: string,
  input: { brief: string; text: string; files: SourceFile[]; count: number },
): Promise<DraftQuestion[]> {
  const parts: unknown[] = [
    {
      type: "text",
      text:
        `Create exactly ${input.count} multiple-choice hiring-capability training questions ` +
        `for hiring managers, grounded strictly in the material supplied below. ` +
        `Each question is a realistic workplace scenario a manager could face, with exactly 3 plausible options, ` +
        `one clearly best answer, and a short explanation (1-2 sentences) citing the principle from the material. ` +
        `Do not invent company policies that are not in the material.\n\n` +
        (input.brief ? `Topic / brief: ${input.brief}\n\n` : "") +
        (input.text ? `Source notes:\n${input.text.slice(0, 60000)}` : ""),
    },
  ];
  for (const f of input.files) {
    parts.push({
      type: "file",
      file: { filename: f.name, file_data: `data:${f.mimeType};base64,${f.dataBase64}` },
    });
  }

  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Lovable-API-Key": apiKey,
      "X-Lovable-AIG-SDK": "fetch",
    },
    body: JSON.stringify({
      model: "google/gemini-3.7-flash",
      messages: [
        {
          role: "system",
          content:
            "You are an expert talent-acquisition learning designer. You write sharp, realistic, non-obvious scenario questions. Always answer with the requested tool call.",
        },
        { role: "user", content: parts },
      ],
      tools: [
        {
          type: "function",
          function: {
            name: "emit_questions",
            description: "Return the generated assessment questions.",
            parameters: {
              type: "object",
              properties: {
                questions: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      scenario: { type: "string" },
                      options: { type: "array", items: { type: "string" } },
                      correctIndex: { type: "integer" },
                      explanation: { type: "string" },
                    },
                    required: ["scenario", "options", "correctIndex", "explanation"],
                    additionalProperties: false,
                  },
                },
              },
              required: ["questions"],
              additionalProperties: false,
            },
          },
        },
      ],
      tool_choice: { type: "function", function: { name: "emit_questions" } },
    }),
  });

  if (res.status === 429)
    fail("The AI service is busy right now — please try again in a minute.");
  if (res.status === 402)
    fail("AI credits are exhausted for this workspace. Add credits and try again.");
  if (!res.ok) {
    const body = await res.text();
    fail(`AI generation failed (${res.status}): ${body.slice(0, 300)}`);
  }

  const json = (await res.json()) as {
    choices?: { message?: { tool_calls?: { function?: { arguments?: string } }[] } }[];
  };
  const raw = json.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
  if (!raw) fail("The AI did not return any questions. Try adding more source material.");

  let parsed: { questions?: DraftQuestion[] };
  try {
    parsed = JSON.parse(raw) as { questions?: DraftQuestion[] };
  } catch {
    fail("The AI returned an unreadable response. Please try again.");
  }

  const cleaned = (parsed.questions ?? [])
    .filter(
      (q) =>
        typeof q.scenario === "string" &&
        Array.isArray(q.options) &&
        q.options.length >= 2 &&
        typeof q.correctIndex === "number",
    )
    .map((q) => ({
      scenario: q.scenario.trim(),
      options: q.options.slice(0, 4).map((o) => String(o).trim()),
      correctIndex: Math.max(0, Math.min(q.options.length - 1, q.correctIndex)),
      explanation: (q.explanation ?? "").trim(),
    }))
    .slice(0, input.count);

  if (!cleaned.length)
    fail("The AI could not build questions from that material. Try a richer document or brief.");
  return cleaned;
}

export async function createWithAi(
  supabase: DB,
  userId: string,
  input: {
    title: string;
    description: string;
    brief: string;
    text: string;
    files: SourceFile[];
    targetQuestions: number;
    minutesPerQuestion: number;
  },
) {
  const group = await requireOwnedGroup(supabase, userId);
  if (!input.brief.trim() && !input.text.trim() && !input.files.length)
    fail("Add a document, paste some text, or write a brief for the AI to work from.");

  const apiKey = process.env["LOVABLE_API_KEY"];
  if (!apiKey) fail("AI is not configured for this project.");

  const target = Math.min(Math.max(1, input.targetQuestions), MAX_QUESTIONS);
  const questions = await generateQuestions(apiKey, {
    brief: input.brief,
    text: input.text,
    files: input.files,
    count: target,
  });

  const { data, error } = await supabase
    .from("assessments")
    .insert({
      group_id: group.id,
      created_by: userId,
      title: input.title.trim(),
      description: input.description.trim(),
      source: "ai",
      target_questions: target,
      estimated_minutes: Math.max(1, Math.round(questions.length * input.minutesPerQuestion)),
      status: "draft",
    })
    .select()
    .single();
  if (error) fail(error.message);

  await insertQuestions(supabase, data.id, questions);
  return {
    id: data.id as string,
    generated: questions.length,
    short: questions.length < target,
  };
}

/* ----------------------------------------------------------- owner edits */

export async function updateAssessment(
  supabase: DB,
  userId: string,
  id: string,
  patch: {
    title?: string;
    description?: string;
    estimated_minutes?: number;
    status?: string;
  },
) {
  await requireOwnedAssessment(supabase, userId, id);
  if (patch.status === "published") {
    const { count } = await supabase
      .from("assessment_questions")
      .select("id", { count: "exact", head: true })
      .eq("assessment_id", id);
    if (!count) fail("Add at least one question before publishing.");
  }
  const clean = {
    ...(patch.title !== undefined ? { title: patch.title } : {}),
    ...(patch.description !== undefined ? { description: patch.description } : {}),
    ...(patch.estimated_minutes !== undefined
      ? { estimated_minutes: patch.estimated_minutes }
      : {}),
    ...(patch.status !== undefined ? { status: patch.status } : {}),
  };
  const { error } = await supabase.from("assessments").update(clean).eq("id", id);
  if (error) fail(error.message);
  return { ok: true };
}

export async function deleteAssessment(supabase: DB, userId: string, id: string) {
  await requireOwnedAssessment(supabase, userId, id);
  const { error } = await supabase.from("assessments").delete().eq("id", id);
  if (error) fail(error.message);
  return { ok: true };
}

export async function saveAssessmentQuestion(
  supabase: DB,
  userId: string,
  input: {
    assessmentId: string;
    questionId: string | null;
    scenario: string;
    options: string[];
    correctIndex: number;
    explanation: string;
  },
) {
  await requireOwnedAssessment(supabase, userId, input.assessmentId);
  if (input.questionId) {
    const { error } = await supabase
      .from("assessment_questions")
      .update({
        scenario: input.scenario,
        options: input.options,
        correct_index: input.correctIndex,
        explanation: input.explanation,
      })
      .eq("id", input.questionId)
      .eq("assessment_id", input.assessmentId);
    if (error) fail(error.message);
    return { ok: true };
  }
  const { data: last } = await supabase
    .from("assessment_questions")
    .select("position")
    .eq("assessment_id", input.assessmentId)
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle();
  const { error } = await supabase.from("assessment_questions").insert({
    assessment_id: input.assessmentId,
    position: (last?.position ?? -1) + 1,
    scenario: input.scenario,
    options: input.options,
    correct_index: input.correctIndex,
    explanation: input.explanation,
  });
  if (error) fail(error.message);
  return { ok: true };
}

export async function deleteAssessmentQuestion(
  supabase: DB,
  userId: string,
  assessmentId: string,
  questionId: string,
) {
  await requireOwnedAssessment(supabase, userId, assessmentId);
  const { error } = await supabase
    .from("assessment_questions")
    .delete()
    .eq("id", questionId)
    .eq("assessment_id", assessmentId);
  if (error) fail(error.message);
  return { ok: true };
}

/* -------------------------------------------------------------- members */

export async function listMemberAssessments(supabase: DB, userId: string) {
  const { data: profile } = await supabase
    .from("profiles")
    .select("group_id")
    .eq("id", userId)
    .maybeSingle();
  const { data: owned } = await supabase
    .from("groups")
    .select("id")
    .eq("owner_id", userId)
    .maybeSingle();
  // Group leads administer assessments; they do not take them.
  if (owned) return { assessments: [] };
  const groupId = profile?.group_id ?? null;
  if (!groupId) return { assessments: [] };

  const { data: rows } = await supabase
    .from("assessments")
    .select("id, title, description, estimated_minutes, created_at")
    .eq("group_id", groupId)
    .eq("status", "published")
    .order("created_at", { ascending: false });
  const list = rows ?? [];
  const ids = list.map((a) => a.id);
  if (!ids.length) return { assessments: [] };

  const [{ data: questions }, { data: mine }] = await Promise.all([
    supabase.from("assessment_questions").select("id, assessment_id").in("assessment_id", ids),
    supabase
      .from("assessment_responses")
      .select("assessment_id, score, xp_earned")
      .eq("user_id", userId)
      .in("assessment_id", ids),
  ]);

  return {
    assessments: list.map((a) => {
      const done = (mine ?? []).find((r) => r.assessment_id === a.id);
      return {
        id: a.id,
        title: a.title,
        description: a.description,
        estimatedMinutes: a.estimated_minutes,
        questionCount: (questions ?? []).filter((q) => q.assessment_id === a.id).length,
        completed: done ? { score: done.score, xpEarned: done.xp_earned } : null,
      };
    }),
  };
}

export async function loadAssessment(supabase: DB, userId: string, id: string) {
  const { data: assessment } = await supabase
    .from("assessments")
    .select("id, title, description, estimated_minutes, status")
    .eq("id", id)
    .maybeSingle();
  if (!assessment || assessment.status !== "published")
    fail("That assessment is not available.");

  const { data: leadsGroup } = await supabase
    .from("groups")
    .select("id")
    .eq("owner_id", userId)
    .maybeSingle();
  if (leadsGroup) fail("Group leads administer assessments and don't take them.");

  const { data: questions } = await supabase
    .from("assessment_questions")
    .select("*")
    .eq("assessment_id", id)
    .order("position");
  const qs = questions ?? [];

  const { data: existing } = await supabase
    .from("assessment_responses")
    .select("*")
    .eq("assessment_id", id)
    .eq("user_id", userId)
    .maybeSingle();

  return {
    assessment: {
      id: assessment.id,
      title: assessment.title,
      description: assessment.description,
      estimatedMinutes: assessment.estimated_minutes,
    },
    questions: qs.map((q, i) => ({
      index: i,
      scenario: q.scenario,
      options: (q.options as string[]) ?? [],
    })),
    completed: existing
      ? {
          score: existing.score,
          xpEarned: existing.xp_earned,
          completedAt: existing.completed_at,
          answers: existing.answers as number[],
          review: qs.map((q, i) => ({
            index: i,
            correctIndex: q.correct_index,
            explanation: q.explanation,
          })),
        }
      : null,
  };
}

export async function submitAssessment(
  supabase: DB,
  userId: string,
  id: string,
  answers: number[],
) {
  const { data: assessment } = await supabase
    .from("assessments")
    .select("id, status")
    .eq("id", id)
    .maybeSingle();
  if (!assessment || assessment.status !== "published")
    fail("That assessment is not available.");

  const { data: ownedGroup } = await supabase
    .from("groups")
    .select("id")
    .eq("owner_id", userId)
    .maybeSingle();
  if (ownedGroup) fail("Group leads administer assessments and don't take them.");

  const { data: existing } = await supabase
    .from("assessment_responses")
    .select("id")
    .eq("assessment_id", id)
    .eq("user_id", userId)
    .maybeSingle();
  if (existing) fail("You have already completed this assessment.");

  const { data: questions } = await supabase
    .from("assessment_questions")
    .select("*")
    .eq("assessment_id", id)
    .order("position");
  const qs = questions ?? [];
  if (answers.length !== qs.length) fail("Please answer every question.");

  const results = qs.map((q, i) => ({
    index: i,
    chosen: answers[i]!,
    correctIndex: q.correct_index,
    correct: answers[i] === q.correct_index,
    explanation: q.explanation,
  }));
  const correctCount = results.filter((r) => r.correct).length;

  // Custom assessments award XP but never touch the weekly streak.
  const base = correctCount * 100;
  const perfect = qs.length > 0 && correctCount === qs.length ? 50 : 0;
  const xpTotal = base + perfect;

  const { error: respErr } = await supabase.from("assessment_responses").insert({
    assessment_id: id,
    user_id: userId,
    answers,
    score: correctCount,
    xp_earned: xpTotal,
  });
  if (respErr) fail(respErr.message);

  const { data: profile } = await supabase
    .from("profiles")
    .select("total_xp, level")
    .eq("id", userId)
    .maybeSingle();
  if (!profile) fail("Profile not found.");

  const totalXp = profile.total_xp + xpTotal;
  const newLevel = levelForXp(totalXp).level;
  await supabase
    .from("profiles")
    .update({ total_xp: totalXp, level: newLevel })
    .eq("id", userId);

  return {
    results,
    correctCount,
    total: qs.length,
    xp: { base, perfect, total: xpTotal },
    totalXp,
    level: newLevel,
    leveledUp: newLevel > profile.level,
  };
}
