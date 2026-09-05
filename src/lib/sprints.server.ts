import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { getQuestionsForWeek } from "./curriculum";
import { ELECTIVE_MODULES } from "./electives";
import {
  levelForXp,
  SPRINT_PERFECT_BONUS,
  SPRINT_XP_PER_CORRECT,
  sprintMultiplier,
  unlockedWeekFor,
} from "./gamification";

type DB = SupabaseClient<Database>;

export type SprintQuestion = {
  scenario: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  source: string;
  weight: number;
};

export type SprintDifficulty = "warm-up" | "core" | "elite";

function fail(message: string): never {
  throw new Error(message);
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function dayDiff(a: string, b: string) {
  return Math.round(
    (new Date(`${a}T00:00:00Z`).getTime() - new Date(`${b}T00:00:00Z`).getTime()) /
      86_400_000,
  );
}

function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j]!, copy[i]!];
  }
  return copy;
}

/** Adaptive tier: the more sprints completed, the harder the pool skews. */
export function difficultyFor(sprintsCompleted: number): SprintDifficulty {
  if (sprintsCompleted < 3) return "warm-up";
  if (sprintsCompleted < 10) return "core";
  return "elite";
}

async function buildPool(supabase: DB, userId: string): Promise<SprintQuestion[]> {
  const { data: profile } = await supabase
    .from("profiles")
    .select("created_at, group_id")
    .eq("id", userId)
    .maybeSingle();
  const unlocked = unlockedWeekFor(profile?.created_at);

  const pool: SprintQuestion[] = [];
  for (let week = 1; week <= unlocked; week++) {
    for (const q of getQuestionsForWeek(week)) {
      pool.push({
        scenario: q.scenario,
        options: q.options,
        correctIndex: q.correctIndex,
        explanation: q.explanation,
        source: `Week ${week}`,
        // Later weeks are conceptually harder.
        weight: Math.min(3, 1 + Math.floor((week - 1) / 18)),
      });
    }
  }

  // Elective questions join the pool for group members with modules switched on.
  const groupId = profile?.group_id ?? null;
  if (groupId) {
    const { data: owned } = await supabase
      .from("groups")
      .select("id")
      .eq("owner_id", userId)
      .maybeSingle();
    if (!owned) {
      const { data: enabledRows } = await supabase
        .from("group_electives")
        .select("module_slug")
        .eq("group_id", groupId);
      const enabled = new Set((enabledRows ?? []).map((r) => r.module_slug));
      for (const m of ELECTIVE_MODULES) {
        if (!enabled.has(m.slug)) continue;
        for (const lesson of m.lessons) {
          for (const q of lesson.questions) {
            pool.push({
              scenario: q.scenario,
              options: q.options,
              correctIndex: q.correctIndex,
              explanation: q.explanation,
              source: m.title,
              weight: 3,
            });
          }
        }
      }
    }
  }

  return pool;
}

function pickQuestions(
  pool: SprintQuestion[],
  difficulty: SprintDifficulty,
  count: number,
): SprintQuestion[] {
  const preferred =
    difficulty === "warm-up"
      ? pool.filter((q) => q.weight <= 1)
      : difficulty === "core"
        ? pool.filter((q) => q.weight <= 2)
        : pool.filter((q) => q.weight >= 2);
  const primary = shuffle(preferred.length >= count ? preferred : pool);
  const chosen = primary.slice(0, count);
  if (chosen.length < count) {
    const rest = shuffle(pool.filter((q) => !chosen.includes(q)));
    chosen.push(...rest.slice(0, count - chosen.length));
  }
  return chosen;
}

export async function loadSprintStats(supabase: DB, userId: string) {
  const [{ data: profile }, { data: sessions }] = await Promise.all([
    supabase
      .from("profiles")
      .select("sprint_streak, longest_sprint_streak, last_sprint_date")
      .eq("id", userId)
      .maybeSingle(),
    supabase
      .from("sprint_sessions")
      .select("score, total, xp_earned, completed_at")
      .eq("user_id", userId)
      .eq("status", "completed"),
  ]);

  const rows = sessions ?? [];
  const correct = rows.reduce((s, r) => s + r.score, 0);
  const asked = rows.reduce((s, r) => s + r.total, 0);
  const today = todayIso();
  const last = profile?.last_sprint_date ?? null;
  // A streak survives one idle day; it only resets once you miss a full day.
  const streak =
    last && dayDiff(today, last) <= 1 ? (profile?.sprint_streak ?? 0) : 0;

  return {
    totalSprints: rows.length,
    accuracy: asked ? Math.round((correct / asked) * 100) : 0,
    xpFromSprints: rows.reduce((s, r) => s + r.xp_earned, 0),
    dailyStreak: streak,
    longestDailyStreak: profile?.longest_sprint_streak ?? 0,
    playedToday: last === today,
    difficulty: difficultyFor(rows.length),
    multiplier: sprintMultiplier(streak),
  };
}

export async function startSprint(supabase: DB, userId: string) {
  const stats = await loadSprintStats(supabase, userId);
  const pool = await buildPool(supabase, userId);
  if (pool.length < 3)
    fail("Complete your first weekly simulation to unlock Quick Drills.");

  const count = Math.min(pool.length, 3 + Math.floor(Math.random() * 3)); // 3–5
  const difficulty = stats.difficulty;
  const questions = pickQuestions(pool, difficulty, count);

  // Abandon any stale in-flight sprint so a user only ever has one open drill.
  await supabase
    .from("sprint_sessions")
    .update({ status: "abandoned" })
    .eq("user_id", userId)
    .eq("status", "active");

  const { data, error } = await supabase
    .from("sprint_sessions")
    .insert({
      user_id: userId,
      questions: questions as unknown as Database["public"]["Tables"]["sprint_sessions"]["Insert"]["questions"],
      answers: [],
      difficulty,
      total: questions.length,
      status: "active",
    })
    .select("id")
    .single();
  if (error || !data) fail(error?.message ?? "Could not start the drill.");

  return {
    sessionId: data.id,
    difficulty,
    multiplier: stats.multiplier,
    dailyStreak: stats.dailyStreak,
    questions: questions.map((q, i) => ({
      index: i,
      scenario: q.scenario,
      options: q.options,
      source: q.source,
    })),
  };
}

export async function answerSprint(
  supabase: DB,
  userId: string,
  sessionId: string,
  index: number,
  choice: number | null,
) {
  const { data: session } = await supabase
    .from("sprint_sessions")
    .select("*")
    .eq("id", sessionId)
    .eq("user_id", userId)
    .maybeSingle();
  if (!session) fail("That drill was not found.");
  if (session.status !== "active") fail("This drill has already finished.");

  const questions = session.questions as unknown as SprintQuestion[];
  const q = questions[index];
  if (!q) fail("Unknown question.");

  const answers = [...((session.answers as unknown as (number | null)[]) ?? [])];
  if (answers.length !== index) fail("Answer the questions in order.");
  answers.push(choice);

  const correct = choice === q.correctIndex;
  const score = answers.reduce(
    (s, a, i) => s + (a !== null && a === questions[i]!.correctIndex ? 1 : 0),
    0,
  );
  const finished = answers.length === questions.length;

  if (!finished) {
    await supabase
      .from("sprint_sessions")
      .update({ answers: answers as unknown as never, score })
      .eq("id", sessionId);
    return {
      correct,
      correctIndex: q.correctIndex,
      explanation: q.explanation,
      finished: false as const,
      summary: null,
    };
  }

  const summary = await finishSprint(supabase, userId, sessionId, answers, score);
  return {
    correct,
    correctIndex: q.correctIndex,
    explanation: q.explanation,
    finished: true as const,
    summary,
  };
}

async function finishSprint(
  supabase: DB,
  userId: string,
  sessionId: string,
  answers: (number | null)[],
  score: number,
) {
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();
  if (!profile) fail("Profile not found.");

  const today = todayIso();
  const last = profile.last_sprint_date ?? null;
  let dailyStreak: number;
  if (last === today) dailyStreak = Math.max(1, profile.sprint_streak);
  else if (last && dayDiff(today, last) === 1) dailyStreak = profile.sprint_streak + 1;
  else dailyStreak = 1;

  const { data: sessionRow } = await supabase
    .from("sprint_sessions")
    .select("total")
    .eq("id", sessionId)
    .maybeSingle();
  const total = sessionRow?.total ?? answers.length;

  const base = score * SPRINT_XP_PER_CORRECT;
  const perfect = score === total ? SPRINT_PERFECT_BONUS : 0;
  const multiplier = sprintMultiplier(dailyStreak);
  const xpTotal = Math.round((base + perfect) * multiplier);
  const streakBonus = xpTotal - (base + perfect);

  const totalXp = profile.total_xp + xpTotal;
  const newLevel = levelForXp(totalXp).level;
  const leveledUp = newLevel > profile.level;

  await supabase
    .from("sprint_sessions")
    .update({
      answers: answers as unknown as never,
      score,
      xp_earned: xpTotal,
      status: "completed",
      completed_at: new Date().toISOString(),
    })
    .eq("id", sessionId);

  await supabase
    .from("profiles")
    .update({
      total_xp: totalXp,
      level: newLevel,
      sprint_streak: dailyStreak,
      longest_sprint_streak: Math.max(profile.longest_sprint_streak, dailyStreak),
      last_sprint_date: today,
    })
    .eq("id", userId);

  return {
    score,
    total,
    base,
    perfect,
    streakBonus,
    multiplier,
    xpEarned: xpTotal,
    totalXp,
    level: newLevel,
    leveledUp,
    dailyStreak,
  };
}
