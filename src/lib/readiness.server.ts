import { buildProvenance, ctxSourceTypes, validateQuestion } from "@/lib/governance/validation";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { buildQuestionPlan } from "./readiness/selection";
import {
  buildPrompt,
  contextCompleteness,
  selectFallback,
  validateAiQuestions,
  type PlanItem,
  type PrepContext,
  type PrepQuestionDraft,
} from "./readiness/generator";
import {
  computeAllProgress,
  professionalLevel,
  strongestAndPriority,
  type AreaProgress,
  type EvidenceItem,
} from "./readiness/scoring";
import { developmentAreas, recommendNext } from "./readiness/metrics";
import { ADVANCE_MINUTES, evaluateRecognition } from "./readiness/recognition";
import { CAPABILITY_AREAS, SUB_SKILLS, type CapabilityArea } from "./readiness/taxonomy";

type DB = SupabaseClient<Database>;

async function admin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

function fail(msg: string): never {
  throw new Error(msg);
}

/* ---------------- Interviews ---------------- */

export type CreateInterviewInput = {
  roleTitle: string;
  candidateDisplayName: string;
  stage: string;
  startsAt: string;
  durationMinutes?: number | null | undefined;
  competencies: string[];
  responsibility?: string | null | undefined;
  jobDescription?: string | null | undefined;
  candidateProfile?: string | null | undefined;
  principles?: string[] | undefined;
};

export async function createInterview(sb: DB, userId: string, input: CreateInterviewInput) {
  const { data: prof } = await sb
    .from("profiles")
    .select("group_id")
    .eq("id", userId)
    .maybeSingle();
  let groupId = prof?.group_id ?? null;
  if (!groupId) {
    const { data: owned } = await sb
      .from("groups")
      .select("id")
      .eq("owner_id", userId)
      .eq("track", "interviewer")
      .maybeSingle();
    groupId = owned?.id ?? null;
  }
  const { data: ev, error } = await sb
    .from("interview_events")
    .insert({
      group_id: groupId,
      interviewer_id: userId,
      created_by: userId,
      source: "manual",
      role_title: input.roleTitle.trim(),
      candidate_display_name: input.candidateDisplayName.trim(),
      interview_stage: input.stage.trim(),
      starts_at: input.startsAt,
      duration_minutes: input.durationMinutes ?? null,
    })
    .select("id")
    .single();
  if (error || !ev) fail(error?.message ?? "Could not create interview");
  const ctx: PrepContext = {
    roleTitle: input.roleTitle,
    stage: input.stage,
    competencies: input.competencies,
    responsibility: input.responsibility,
    jobDescription: input.jobDescription,
    candidateProfile: input.candidateProfile,
    principles: input.principles,
  };
  const sources = [
    input.jobDescription?.trim() ? "job_description" : null,
    input.candidateProfile?.trim() ? "candidate_profile" : null,
    input.principles?.length ? "company_principles" : null,
  ].filter(Boolean);
  const { error: cErr } = await sb.from("interview_contexts").insert({
    interview_event_id: ev.id,
    job_description_text: input.jobDescription?.trim() || null,
    candidate_profile_text: input.candidateProfile?.trim() || null,
    interviewer_responsibility: input.responsibility?.trim() || null,
    competencies: input.competencies,
    company_principles: input.principles ?? [],
    context_sources: sources,
    context_completeness_score: contextCompleteness(ctx),
  });
  if (cErr) fail(cErr.message);
  return { id: ev.id, completeness: contextCompleteness(ctx) };
}

export async function listInterviews(sb: DB, userId: string) {
  const { data: events } = await sb
    .from("interview_events")
    .select("id, role_title, candidate_display_name, interview_stage, starts_at, status")
    .eq("interviewer_id", userId)
    .order("starts_at", { ascending: true });
  const ids = (events ?? []).map((e) => e.id);
  const { data: sessions } = ids.length
    ? await sb
        .from("prep_sessions")
        .select("id, interview_event_id, status, completed_at, generated_at")
        .in("interview_event_id", ids)
        .order("generated_at", { ascending: false })
    : {
        data: [] as {
          id: string;
          interview_event_id: string;
          status: string;
          completed_at: string | null;
          generated_at: string;
        }[],
      };
  const latest = new Map<string, { status: string; completed_at: string | null }>();
  for (const s of sessions ?? [])
    if (!latest.has(s.interview_event_id)) latest.set(s.interview_event_id, s);
  return (events ?? []).map((e) => ({
    ...e,
    prepStatus: prepStatusOf(latest.get(e.id)?.status),
    prepCompletedAt: latest.get(e.id)?.completed_at ?? null,
  }));
}

export function prepStatusOf(
  s: string | undefined | null,
): "not_started" | "in_progress" | "completed" {
  if (s === "completed") return "completed";
  if (s === "started" || s === "generated") return "in_progress";
  return "not_started";
}

export async function getInterview(sb: DB, userId: string, id: string) {
  const { data: ev } = await sb
    .from("interview_events")
    .select("*")
    .eq("id", id)
    .eq("interviewer_id", userId)
    .maybeSingle();
  if (!ev) fail("Interview not found");
  const { data: ctx } = await sb
    .from("interview_contexts")
    .select(
      "interviewer_responsibility, competencies, company_principles, context_completeness_score, job_description_text, candidate_profile_text",
    )
    .eq("interview_event_id", id)
    .maybeSingle();
  const { data: session } = await sb
    .from("prep_sessions")
    .select(
      "id, status, completed_at, correct_answers, total_questions, overall_score, used_fallback",
    )
    .eq("interview_event_id", id)
    .order("generated_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return {
    event: ev,
    context: ctx
      ? {
          responsibility: ctx.interviewer_responsibility,
          competencies: (ctx.competencies as string[]) ?? [],
          principles: (ctx.company_principles as string[]) ?? [],
          completeness: ctx.context_completeness_score,
          hasJobDescription: Boolean(ctx.job_description_text),
          hasCandidateProfile: Boolean(ctx.candidate_profile_text),
        }
      : null,
    session,
  };
}

/* ---------------- Evidence & progress ---------------- */

async function loadEvidence(userId: string): Promise<EvidenceItem[]> {
  const a = await admin();
  const { data } = await a
    .from("capability_evidence")
    .select("capability_area, sub_skill, is_correct, difficulty, recorded_at, prep_session_id, prep_question_id")
      .is("invalidated_at", null)
    .eq("user_id", userId);
  return (data ?? []) as EvidenceItem[];
}

async function persistProgress(userId: string, progress: AreaProgress[]) {
  const a = await admin();
  await a.from("user_capability_progress").upsert(
    progress.map((p) => ({
      user_id: userId,
      capability_area: p.capability_area,
      total_questions: p.total_questions,
      correct_answers: p.correct_answers,
      weighted_score: p.weighted_score,
      evidence_confidence: p.evidence_confidence,
      mastery_stage: p.mastery_stage,
      last_evidence_at: p.last_evidence_at,
      recent_direction: p.recent_direction,
      updated_at: new Date().toISOString(),
    })),
    { onConflict: "user_id,capability_area" },
  );
}

/* ---------------- Generation ---------------- */

async function generateWithAi(
  ctx: PrepContext,
  plan: PlanItem[],
): Promise<PrepQuestionDraft[] | null> {
  const apiKey = process.env["LOVABLE_API_KEY"];
  if (!apiKey) return null;
  try {
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
              "You are an expert interview-training designer. You coach interviewers on fair, structured, evidence-based interviewing. You never evaluate candidates. Always answer with the requested tool call.",
          },
          { role: "user", content: buildPrompt(ctx, plan) },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "emit_questions",
              description: "Return the preparation questions.",
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
                        capabilityArea: { type: "string", enum: [...CAPABILITY_AREAS] },
                        subSkill: { type: "string", enum: Object.values(SUB_SKILLS).flat() },
                      },
                      required: [
                        "scenario",
                        "options",
                        "correctIndex",
                        "explanation",
                        "capabilityArea",
                        "subSkill",
                      ],
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
    if (!res.ok) {
      console.error("[readiness] AI generation failed", res.status);
      return null;
    }
    const json = await res.json();
    const args = json?.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
    const parsed = typeof args === "string" ? JSON.parse(args) : args;
    return validateAiQuestions(parsed?.questions, plan);
  } catch (e) {
    console.error("[readiness] AI generation error", e);
    return null;
  }
}

export async function generatePrep(sb: DB, userId: string, interviewId: string) {
  const { data: ev } = await sb
    .from("interview_events")
    .select("id, role_title, interview_stage, starts_at")
    .eq("id", interviewId)
    .eq("interviewer_id", userId)
    .maybeSingle();
  if (!ev) fail("Interview not found");

  const { data: existing } = await sb
    .from("prep_sessions")
    .select("id, status")
    .eq("interview_event_id", interviewId)
    .in("status", ["generated", "started"])
    .limit(1)
    .maybeSingle();
  if (existing) return { sessionId: existing.id, usedFallback: false, reused: true };

  const { data: ctxRow } = await sb
    .from("interview_contexts")
    .select("*")
    .eq("interview_event_id", interviewId)
    .maybeSingle();
  const ctx: PrepContext = {
    roleTitle: ev.role_title,
    stage: ev.interview_stage,
    competencies: (ctxRow?.competencies as string[]) ?? [],
    responsibility: ctxRow?.interviewer_responsibility,
    jobDescription: ctxRow?.job_description_text,
    candidateProfile: ctxRow?.candidate_profile_text,
    principles: (ctxRow?.company_principles as string[]) ?? [],
  };

  const evidenceForPlan = await loadEvidence(userId);
  const progress = computeAllProgress(evidenceForPlan);
  const planEntries = buildQuestionPlan(progress, undefined, {
    development: developmentAreas(evidenceForPlan),
    stage: ev.interview_stage,
  });
  const plan: PlanItem[] = planEntries.map(({ area, difficulty }) => ({ area, difficulty }));
  let questions = await generateWithAi(ctx, plan);
  const usedFallback = !questions;
  if (!questions) questions = selectFallback(plan);

  const a = await admin();
  const { data: session, error } = await a
    .from("prep_sessions")
    .insert({
      interview_event_id: interviewId,
      interviewer_id: userId,
      status: "generated",
      total_questions: questions.length,
      estimated_minutes: Math.max(3, Math.min(5, Math.round(questions.length * 0.8))),
      used_fallback: usedFallback,
      generation_version: usedFallback ? "v1-library" : "v1-ai",
    })
    .select("id")
    .single();
  if (error || !session) fail(error?.message ?? "Could not create preparation");
  const { error: qErr } = await a.from("prep_questions").insert(
    questions.map((q, i) => ({
      prep_session_id: session.id,
      position: i,
      scenario: q.scenario,
      options: q.options,
      correct_index: q.correctIndex,
      explanation: q.explanation,
      capability_area: q.capabilityArea,
      sub_skill: q.subSkill,
      interview_stage: ev.interview_stage,
      difficulty: q.difficulty,
      context_source: q.contextSource,
      selection_reason: planEntries[i]?.reason ?? "fallback",
      provenance: buildProvenance({
        generatedByAi: q.contextSource === "ai",
        generatorVersion: usedFallback ? "v1-library" : "v1-ai",
        capability: q.capabilityArea,
        subSkill: q.subSkill,
        contextSources: ctxSourceTypes(ctx),
        candidateContextUsed: !!ctx.candidateProfile,
        principlesUsed: !!ctx.principles?.length,
        validation: validateQuestion({ scenario: q.scenario, options: q.options, correctIndex: q.correctIndex, explanation: q.explanation, capabilityArea: q.capabilityArea, subSkill: q.subSkill }),
      }),
    })),
  );
  if (qErr) {
    await a.from("prep_sessions").delete().eq("id", session.id);
    fail(qErr.message);
  }
  return { sessionId: session.id, usedFallback, reused: false };
}

/* ---------------- Session play ---------------- */

async function ownSession(userId: string, sessionId: string) {
  const a = await admin();
  const { data: s } = await a.from("prep_sessions").select("*").eq("id", sessionId).maybeSingle();
  if (!s || s.interviewer_id !== userId) fail("Preparation not found");
  return s;
}

export async function getPrepSession(userId: string, sessionId: string) {
  const s = await ownSession(userId, sessionId);
  const a = await admin();
  const [{ data: qs }, { data: rs }, { data: ev }] = await Promise.all([
    a.from("prep_questions").select("*").eq("prep_session_id", sessionId).order("position"),
    a
      .from("prep_responses")
      .select("prep_question_id, selected_index, is_correct")
      .eq("prep_session_id", sessionId),
    a
      .from("interview_events")
      .select("id, role_title, interview_stage, starts_at")
      .eq("id", s.interview_event_id)
      .maybeSingle(),
  ]);
  const answered = new Map((rs ?? []).map((r) => [r.prep_question_id, r]));
  return {
    session: {
      id: s.id,
      status: s.status,
      totalQuestions: s.total_questions,
      correctAnswers: s.correct_answers,
      completedAt: s.completed_at,
      usedFallback: s.used_fallback,
      estimatedMinutes: s.estimated_minutes,
    },
    interview: ev,
    questions: (qs ?? []).map((q) => {
      const r = answered.get(q.id);
      return {
        id: q.id,
        position: q.position,
        scenario: q.scenario,
        options: q.options as string[],
        capabilityArea: q.capability_area as CapabilityArea,
        subSkill: q.sub_skill,
        difficulty: q.difficulty,
        // Answer key only revealed after the question is answered.
        answer: r
          ? {
              selectedIndex: r.selected_index,
              isCorrect: r.is_correct,
              correctIndex: q.correct_index,
              explanation: q.explanation,
            }
          : null,
      };
    }),
  };
}

export async function submitPrepAnswer(
  userId: string,
  input: {
    sessionId: string;
    questionId: string;
    selectedIndex: number;
    responseTimeSeconds?: number | undefined;
  },
) {
  const s = await ownSession(userId, input.sessionId);
  if (s.status === "completed" || s.status === "expired")
    fail("This preparation is already finished");
  const a = await admin();
  const { data: q } = await a
    .from("prep_questions")
    .select("*")
    .eq("id", input.questionId)
    .eq("prep_session_id", input.sessionId)
    .maybeSingle();
  if (!q) fail("Question not found");
  const options = q.options as string[];
  if (input.selectedIndex < 0 || input.selectedIndex >= options.length) fail("Invalid answer");
  const isCorrect = input.selectedIndex === q.correct_index;
  const { error } = await a.from("prep_responses").insert({
    prep_session_id: input.sessionId,
    prep_question_id: q.id,
    user_id: userId,
    selected_index: input.selectedIndex,
    is_correct: isCorrect,
    response_time_seconds: input.responseTimeSeconds ?? null,
  });
  if (error && !error.message.includes("duplicate")) fail(error.message);
  if (!error) {
    await a.from("capability_evidence").insert({
      user_id: userId,
      prep_session_id: input.sessionId,
      prep_question_id: q.id,
      capability_area: q.capability_area,
      sub_skill: q.sub_skill,
      is_correct: isCorrect,
      difficulty: q.difficulty,
      evidence_weight: 1,
    });
  }
  if (s.status === "generated") {
    await a
      .from("prep_sessions")
      .update({ status: "started", started_at: new Date().toISOString() })
      .eq("id", s.id);
  }
  return { isCorrect, correctIndex: q.correct_index, explanation: q.explanation };
}

export async function completePrep(userId: string, sessionId: string) {
  const s = await ownSession(userId, sessionId);
  const a = await admin();
  const { data: rs } = await a
    .from("prep_responses")
    .select("is_correct")
    .eq("prep_session_id", sessionId);
  const answered = rs?.length ?? 0;
  if (answered < s.total_questions) fail("Answer every question before finishing");
  const correct = (rs ?? []).filter((r) => r.is_correct).length;

  const before = computeAllProgress(await loadEvidence(userId));
  if (s.status !== "completed") {
    await a
      .from("prep_sessions")
      .update({
        status: "completed",
        completed_at: new Date().toISOString(),
        correct_answers: correct,
        overall_score: Math.round((correct / s.total_questions) * 100),
      })
      .eq("id", sessionId);
  }
  const evidence = await loadEvidence(userId);
  const progress = computeAllProgress(evidence);
  await persistProgress(userId, progress);

  // Recognition from persisted evidence.
  const { data: done } = await a
    .from("prep_sessions")
    .select("completed_at, interview_event_id")
    .eq("interviewer_id", userId)
    .eq("status", "completed");
  const evIds = (done ?? []).map((d) => d.interview_event_id);
  const { data: evs } = evIds.length
    ? await a.from("interview_events").select("id, starts_at").in("id", evIds)
    : { data: [] as { id: string; starts_at: string }[] };
  const startMap = new Map((evs ?? []).map((e) => [e.id, e.starts_at]));
  const advancePreps = (done ?? []).filter((d) => {
    const st = startMap.get(d.interview_event_id);
    return (
      st &&
      d.completed_at &&
      new Date(st).getTime() - new Date(d.completed_at).getTime() >= ADVANCE_MINUTES * 60_000
    );
  }).length;
  const { data: earnedRows } = await a
    .from("user_achievements")
    .select("achievement_code")
    .eq("user_id", userId);
  const newCodes = evaluateRecognition({
    completedPreps: done?.length ?? 0,
    advancePreps,
    lastSessionPerfect: correct === s.total_questions,
    progress,
    alreadyEarned: new Set((earnedRows ?? []).map((r) => r.achievement_code)),
  });
  if (newCodes.length) {
    await a.from("user_achievements").upsert(
      newCodes.map((code) => ({
        user_id: userId,
        achievement_code: code,
        evidence_snapshot: { completedPreps: done?.length ?? 0, sessionId },
      })),
      { onConflict: "user_id,achievement_code", ignoreDuplicates: true },
    );
  }
  const { data: names } = newCodes.length
    ? await a.from("achievements").select("code, name, description").in("code", newCodes)
    : { data: [] as { code: string; name: string; description: string }[] };

  const stageChanges = progress
    .filter((p, i) => p.mastery_stage !== before[i]!.mastery_stage)
    .map((p) => ({
      area: p.capability_area,
      from: before.find((b) => b.capability_area === p.capability_area)!.mastery_stage,
      to: p.mastery_stage,
    }));

  return {
    correct,
    total: s.total_questions,
    progress,
    before,
    stageChanges,
    recognition: names ?? [],
    level: professionalLevel(progress, done?.length ?? 0),
  };
}

/* ---------------- Capability profile ---------------- */

export async function getMyCapability(sb: DB, userId: string) {
  const [evidence, { count }, { data: earned }, { data: next }] = await Promise.all([
    loadEvidence(userId),
    sb
      .from("prep_sessions")
      .select("id", { count: "exact", head: true })
      .eq("interviewer_id", userId)
      .eq("status", "completed"),
    sb.from("user_achievements").select("achievement_code, earned_at").eq("user_id", userId),
    sb
      .from("interview_events")
      .select("interview_stage, starts_at")
      .eq("interviewer_id", userId)
      .neq("status", "cancelled")
      .gte("starts_at", new Date().toISOString())
      .order("starts_at")
      .limit(1)
      .maybeSingle(),
  ]);
  const progress = computeAllProgress(evidence);
  const development = developmentAreas(evidence);
  const codes = (earned ?? []).map((e) => e.achievement_code);
  const { data: ach } = await sb
    .from("achievements")
    .select("code, name, description")
    .in("code", codes.length ? codes : ["_"]);
  return {
    progress,
    development,
    recommendation: recommendNext({ progress, development, upcomingStage: next?.interview_stage, now: Date.now() }),
    completedPreps: count ?? 0,
    level: professionalLevel(progress, count ?? 0),
    ...strongestAndPriority(progress),
    recognition: (ach ?? []).filter(
      (a) => a.code.startsWith("prep_") || a.code.startsWith("area_") || a.code.startsWith("all_"),
    ),
  };
}

/* ---------------- Group owner view (no candidate context) ---------------- */

export async function getGroupReadiness(sb: DB, userId: string) {
  const { data: group } = await sb
    .from("groups")
    .select("id, name")
    .eq("owner_id", userId)
    .eq("track", "interviewer")
    .maybeSingle();
  if (!group) return null;
  const a = await admin();
  const { data: members } = await a
    .from("profiles")
    .select("id, display_name, full_name, email")
    .eq("group_id", group.id)
    .neq("id", userId);
  const memberIds = (members ?? []).map((m) => m.id);
  if (!memberIds.length)
    return {
      group,
      members: [],
      upcoming: [],
      attention: [],
      goals: { upcoming: 0, prepared: 0, activeThisMonth: 0, members: 0 },
    };

  const now = new Date();
  const [{ data: events }, { data: sessions }, { data: prog }] = await Promise.all([
    a
      .from("interview_events")
      .select("id, interviewer_id, role_title, interview_stage, starts_at, status")
      .in("interviewer_id", memberIds)
      .gte("starts_at", new Date(now.getTime() - 86_400_000).toISOString())
      .order("starts_at"),
    a
      .from("prep_sessions")
      .select("interview_event_id, interviewer_id, status, completed_at, generated_at")
      .in("interviewer_id", memberIds)
      .order("generated_at", { ascending: false }),
    a.from("user_capability_progress").select("*").in("user_id", memberIds),
  ]);

  const latestByEvent = new Map<string, { status: string; completed_at: string | null }>();
  for (const s of sessions ?? [])
    if (!latestByEvent.has(s.interview_event_id)) latestByEvent.set(s.interview_event_id, s);
  const name = (id: string) => {
    const m = members!.find((x) => x.id === id);
    return m?.display_name || m?.full_name || m?.email || "Member";
  };

  const upcoming = (events ?? []).map((e) => ({
    id: e.id,
    interviewer: name(e.interviewer_id),
    interviewerId: e.interviewer_id,
    roleTitle: e.role_title,
    stage: e.interview_stage,
    startsAt: e.starts_at,
    prepStatus: prepStatusOf(latestByEvent.get(e.id)?.status),
    prepCompletedAt: latestByEvent.get(e.id)?.completed_at ?? null,
  }));

  const monthAgo = now.getTime() - 30 * 86_400_000;
  const memberRows = (members ?? []).map((m) => {
    const done = (sessions ?? []).filter(
      (s) => s.interviewer_id === m.id && s.status === "completed",
    );
    const last =
      done
        .map((d) => d.completed_at!)
        .sort()
        .at(-1) ?? null;
    const progress: AreaProgress[] = CAPABILITY_AREAS.map((area) => {
      const r = (prog ?? []).find((p) => p.user_id === m.id && p.capability_area === area);
      return r
        ? {
            capability_area: area,
            total_questions: r.total_questions,
            correct_answers: r.correct_answers,
            weighted_score: r.weighted_score,
            evidence_confidence: r.evidence_confidence as AreaProgress["evidence_confidence"],
            mastery_stage: r.mastery_stage as AreaProgress["mastery_stage"],
            last_evidence_at: r.last_evidence_at,
            recent_direction: r.recent_direction as AreaProgress["recent_direction"],
            raw_percentage: r.total_questions ? Math.round((r.correct_answers / r.total_questions) * 100) : 0,
            next_stage: null,
          }
        : computeAllProgress([]).find((p) => p.capability_area === area)!;
    });
    return {
      id: m.id,
      name: name(m.id),
      email: m.email,
      completedPreps: done.length,
      lastPrepAt: last,
      progress,
      level: professionalLevel(progress, done.length),
      ...strongestAndPriority(progress),
    };
  });

  const in48h = now.getTime() + 48 * 3_600_000;
  const attention = [
    ...upcoming
      .filter(
        (u) =>
          u.prepStatus !== "completed" &&
          new Date(u.startsAt).getTime() <= in48h &&
          new Date(u.startsAt).getTime() >= now.getTime(),
      )
      .map((u) => ({
        kind: "unprepared" as const,
        text: `${u.interviewer} has an interview for ${u.roleTitle} soon without completed preparation`,
        at: u.startsAt,
      })),
    ...memberRows
      .filter((m) => !m.lastPrepAt || new Date(m.lastPrepAt).getTime() < monthAgo)
      .map((m) => ({
        kind: "inactive" as const,
        text: `${m.name} has not completed a preparation in the last 30 days`,
        at: m.lastPrepAt,
      })),
  ];
  const future = upcoming.filter((u) => new Date(u.startsAt).getTime() >= now.getTime());
  return {
    group,
    members: memberRows,
    upcoming,
    attention,
    goals: {
      upcoming: future.length,
      prepared: future.filter((u) => u.prepStatus === "completed").length,
      activeThisMonth: memberRows.filter(
        (m) => m.lastPrepAt && new Date(m.lastPrepAt).getTime() >= monthAgo,
      ).length,
      members: memberRows.length,
    },
  };
}
