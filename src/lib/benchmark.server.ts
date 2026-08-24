import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { getQuestionsForWeek } from "./curriculum";
import { computeXp, levelForXp, quarterForWeek } from "./gamification";

type DB = SupabaseClient<Database>;

export type PublicQuestion = {
  index: number;
  scenario: string;
  options: string[];
};

function fail(message: string): never {
  throw new Error(message);
}

async function resolveQuestions(supabase: DB, week: number) {
  const base = getQuestionsForWeek(week).map((q, index) => ({ ...q, index }));
  const { data: overrides } = await supabase
    .from("question_overrides")
    .select("*")
    .eq("week_number", week);
  for (const o of overrides ?? []) {
    const target = base.find((q) => q.index === o.question_index);
    const options = Array.isArray(o.options) ? (o.options as string[]) : [];
    const patched = {
      index: o.question_index,
      scenario: o.scenario,
      options,
      correctIndex: o.correct_index,
      explanation: o.explanation,
    };
    if (target) Object.assign(target, patched);
    else base.push(patched);
  }
  return base.sort((a, b) => a.index - b.index);
}

export async function isAdmin(supabase: DB, userId: string) {
  const { data } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId);
  return (data ?? []).some((r) => r.role === "ta_admin");
}

export async function requireAdmin(supabase: DB, userId: string) {
  if (!(await isAdmin(supabase, userId))) fail("Forbidden: TA Admin only");
}

export async function loadMe(supabase: DB, userId: string) {
  const [profileRes, rolesRes, settingsRes, responsesRes, achRes, allAchRes, deptRes] =
    await Promise.all([
      supabase.from("profiles").select("*").eq("id", userId).maybeSingle(),
      supabase.from("user_roles").select("role").eq("user_id", userId),
      supabase.from("org_settings").select("*").eq("id", 1).maybeSingle(),
      supabase
        .from("responses")
        .select("week_number, score, xp_earned, completed_at")
        .eq("user_id", userId)
        .order("week_number"),
      supabase
        .from("user_achievements")
        .select("achievement_code, earned_at")
        .eq("user_id", userId),
      supabase.from("achievements").select("*"),
      supabase.from("departments").select("*").order("name"),
    ]);

  const roles = (rolesRes.data ?? []).map((r) => r.role);
  return {
    profile: profileRes.data,
    roles,
    isAdmin: roles.includes("ta_admin"),
    settings: settingsRes.data,
    responses: responsesRes.data ?? [],
    earned: achRes.data ?? [],
    achievements: allAchRes.data ?? [],
    departments: deptRes.data ?? [],
  };
}

export async function loadWeek(supabase: DB, userId: string, week: number) {
  const { data: weekRow } = await supabase
    .from("curriculum_weeks")
    .select("*")
    .eq("week_number", week)
    .maybeSingle();
  if (!weekRow) fail("That week is not in the curriculum yet.");

  const { data: settings } = await supabase
    .from("org_settings")
    .select("current_week")
    .eq("id", 1)
    .maybeSingle();
  const currentWeek = settings?.current_week ?? 1;
  const admin = await isAdmin(supabase, userId);
  if (!admin && week > currentWeek) fail("This session has not been released yet.");

  const { data: existing } = await supabase
    .from("responses")
    .select("*")
    .eq("user_id", userId)
    .eq("week_number", week)
    .maybeSingle();

  const questions = await resolveQuestions(supabase, week);
  const publicQuestions: PublicQuestion[] = questions.map((q) => ({
    index: q.index,
    scenario: q.scenario,
    options: q.options,
  }));

  return {
    week: weekRow,
    quarter: quarterForWeek(week),
    questions: publicQuestions,
    completed: existing
      ? {
          score: existing.score,
          xpEarned: existing.xp_earned,
          completedAt: existing.completed_at,
          answers: existing.answers as number[],
          review: questions.map((q) => ({
            index: q.index,
            correctIndex: q.correctIndex,
            explanation: q.explanation,
          })),
        }
      : null,
  };
}

export async function submitWeek(
  supabase: DB,
  userId: string,
  week: number,
  answers: number[],
) {
  const { data: settings } = await supabase
    .from("org_settings")
    .select("current_week")
    .eq("id", 1)
    .maybeSingle();
  const admin = await isAdmin(supabase, userId);
  if (!admin && week > (settings?.current_week ?? 1))
    fail("This session has not been released yet.");

  const { data: existing } = await supabase
    .from("responses")
    .select("id")
    .eq("user_id", userId)
    .eq("week_number", week)
    .maybeSingle();
  if (existing) fail("You have already completed this week's simulation.");

  const questions = await resolveQuestions(supabase, week);
  if (answers.length !== questions.length) fail("Please answer every question.");

  const results = questions.map((q, i) => ({
    index: q.index,
    chosen: answers[i]!,
    correctIndex: q.correctIndex,
    correct: answers[i] === q.correctIndex,
    explanation: q.explanation,
  }));
  const correctCount = results.filter((r) => r.correct).length;

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();
  if (!profile) fail("Profile not found.");

  const continues = profile.last_completed_week === week - 1;
  const newStreak = continues ? profile.current_streak + 1 : 1;
  const xp = computeXp(correctCount, newStreak - 1);
  const totalXp = profile.total_xp + xp.total;
  const newLevel = levelForXp(totalXp).level;
  const leveledUp = newLevel > profile.level;

  const { error: respErr } = await supabase.from("responses").insert({
    user_id: userId,
    week_number: week,
    answers,
    score: correctCount,
    xp_earned: xp.total,
    streak_bonus: xp.streakBonus,
  });
  if (respErr) fail(respErr.message);

  const { error: profErr } = await supabase
    .from("profiles")
    .update({
      total_xp: totalXp,
      level: newLevel,
      current_streak: newStreak,
      longest_streak: Math.max(profile.longest_streak, newStreak),
      last_completed_week: week,
      last_completed_at: new Date().toISOString(),
    })
    .eq("id", userId);
  if (profErr) fail(profErr.message);

  const { data: allResponses } = await supabase
    .from("responses")
    .select("week_number, score")
    .eq("user_id", userId);
  const done = allResponses ?? [];

  const unlocked: string[] = ["first_session"];
  if (correctCount === 3) unlocked.push("flawless");
  if (newStreak >= 4) unlocked.push("streak_4");
  if (newStreak >= 12) unlocked.push("streak_12");
  if (done.filter((r) => quarterForWeek(r.week_number) === 2).length >= 5)
    unlocked.push("bias_slayer");
  if (done.filter((r) => quarterForWeek(r.week_number) === 3).length >= 5)
    unlocked.push("experience_champion");
  if (newLevel >= 8) unlocked.push("bar_raiser");

  const { data: already } = await supabase
    .from("user_achievements")
    .select("achievement_code")
    .eq("user_id", userId);
  const have = new Set((already ?? []).map((a) => a.achievement_code));
  const fresh = unlocked.filter((c) => !have.has(c));
  if (fresh.length) {
    await supabase
      .from("user_achievements")
      .insert(fresh.map((code) => ({ user_id: userId, achievement_code: code })));
  }

  return {
    results,
    correctCount,
    xp,
    totalXp,
    level: newLevel,
    leveledUp,
    streak: newStreak,
    newAchievements: fresh,
  };
}

export async function loadLeaderboard(supabase: DB, userId: string) {
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, full_name, email, total_xp, level, current_streak, department_id");
  const { data: departments } = await supabase.from("departments").select("*");
  const deptName = new Map((departments ?? []).map((d) => [d.id, d.name]));

  const ranked = (profiles ?? [])
    .map((p) => ({
      id: p.id,
      name: p.full_name || p.email.split("@")[0]!,
      totalXp: p.total_xp,
      level: p.level,
      streak: p.current_streak,
      departmentId: p.department_id,
      department: p.department_id ? (deptName.get(p.department_id) ?? null) : null,
      isMe: p.id === userId,
    }))
    .sort((a, b) => b.totalXp - a.totalXp)
    .map((p, i) => ({ ...p, rank: i + 1 }));

  const byDept = new Map<string, { name: string; totalXp: number; members: number }>();
  for (const p of ranked) {
    const key = p.department ?? "Unassigned";
    const row = byDept.get(key) ?? { name: key, totalXp: 0, members: 0 };
    row.totalXp += p.totalXp;
    row.members += 1;
    byDept.set(key, row);
  }
  const departmentBoard = [...byDept.values()]
    .map((d) => ({ ...d, avgXp: Math.round(d.totalXp / Math.max(1, d.members)) }))
    .sort((a, b) => b.avgXp - a.avgXp)
    .map((d, i) => ({ ...d, rank: i + 1 }));

  const me = ranked.find((p) => p.isMe) ?? null;
  return { global: ranked.slice(0, 50), departmentBoard, me, totalPlayers: ranked.length };
}

export async function loadTelemetry(supabase: DB, userId: string) {
  await requireAdmin(supabase, userId);
  const [profilesRes, responsesRes, weeksRes, deptRes, settingsRes, invitesRes] =
    await Promise.all([
      supabase.from("profiles").select("*"),
      supabase.from("responses").select("*"),
      supabase.from("curriculum_weeks").select("*").order("week_number"),
      supabase.from("departments").select("*").order("name"),
      supabase.from("org_settings").select("*").eq("id", 1).maybeSingle(),
      supabase.from("invites").select("*").order("created_at", { ascending: false }),
    ]);

  const profiles = profilesRes.data ?? [];
  const responses = responsesRes.data ?? [];
  const weeks = weeksRes.data ?? [];
  const departments = deptRes.data ?? [];
  const currentWeek = settingsRes.data?.current_week ?? 1;

  const completedCurrent = responses.filter((r) => r.week_number === currentWeek).length;
  const participation = profiles.length
    ? Math.round((completedCurrent / profiles.length) * 100)
    : 0;

  const weekStats = weeks
    .filter((w) => w.week_number <= currentWeek)
    .map((w) => {
      const rows = responses.filter((r) => r.week_number === w.week_number);
      const avg = rows.length
        ? rows.reduce((s, r) => s + r.score, 0) / rows.length
        : 0;
      return {
        week: w.week_number,
        topic: w.topic,
        completions: rows.length,
        avgScore: Math.round(avg * 100) / 100,
        accuracy: Math.round((avg / 3) * 100),
      };
    });

  const deptStats = departments.map((d) => {
    const members = profiles.filter((p) => p.department_id === d.id);
    const ids = new Set(members.map((m) => m.id));
    const rows = responses.filter((r) => ids.has(r.user_id));
    const avg = rows.length ? rows.reduce((s, r) => s + r.score, 0) / rows.length : 0;
    return {
      id: d.id,
      name: d.name,
      members: members.length,
      avgXp: members.length
        ? Math.round(members.reduce((s, m) => s + m.total_xp, 0) / members.length)
        : 0,
      accuracy: Math.round((avg / 3) * 100),
      completions: rows.length,
    };
  });

  const riskiest = [...weekStats].sort((a, b) => a.accuracy - b.accuracy).slice(0, 5);

  const users = profiles
    .map((p) => ({
      id: p.id,
      name: p.full_name || p.email.split("@")[0]!,
      email: p.email,
      departmentId: p.department_id,
      level: p.level,
      totalXp: p.total_xp,
      streak: p.current_streak,
      completions: responses.filter((r) => r.user_id === p.id).length,
      lastCompletedAt: p.last_completed_at,
    }))
    .sort((a, b) => b.totalXp - a.totalXp);

  const dormant = users.filter((u) => u.completions === 0 || u.streak === 0).length;

  return {
    summary: {
      managers: profiles.length,
      currentWeek,
      participation,
      completedCurrent,
      totalCompletions: responses.length,
      avgAccuracy: responses.length
        ? Math.round(
            (responses.reduce((s, r) => s + r.score, 0) / (responses.length * 3)) * 100,
          )
        : 0,
      dormant,
    },
    weekStats,
    riskiest,
    deptStats,
    users,
    departments,
    weeks,
    invites: invitesRes.data ?? [],
    settings: settingsRes.data,
  };
}

export async function adminSetCurrentWeek(supabase: DB, userId: string, week: number) {
  await requireAdmin(supabase, userId);
  if (week < 1 || week > 52) fail("Week must be between 1 and 52.");
  const { error } = await supabase
    .from("org_settings")
    .update({ current_week: week })
    .eq("id", 1);
  if (error) fail(error.message);
  await supabase
    .from("curriculum_weeks")
    .update({ status: "released" })
    .lte("week_number", week);
  await supabase
    .from("curriculum_weeks")
    .update({ status: "locked" })
    .gt("week_number", week);
  return { currentWeek: week };
}

export async function adminUpdateOrg(
  supabase: DB,
  userId: string,
  patch: {
    company_name?: string | undefined;
    release_day?: string | undefined;
    release_time?: string | undefined;
  },

) {
  await requireAdmin(supabase, userId);
  const clean = Object.fromEntries(
    Object.entries(patch).filter(([, v]) => v !== undefined),
  ) as { company_name?: string; release_day?: string; release_time?: string };
  const { error } = await supabase.from("org_settings").update(clean).eq("id", 1);

  if (error) fail(error.message);
  return { ok: true };
}

export async function adminCreateDepartment(supabase: DB, userId: string, name: string) {
  await requireAdmin(supabase, userId);
  const { error } = await supabase.from("departments").insert({ name });
  if (error) fail(error.message);
  return { ok: true };
}

export async function adminAssignDepartment(
  supabase: DB,
  userId: string,
  targetUserId: string,
  departmentId: string | null,
) {
  await requireAdmin(supabase, userId);
  const { error } = await supabase
    .from("profiles")
    .update({ department_id: departmentId })
    .eq("id", targetUserId);
  if (error) fail(error.message);
  return { ok: true };
}

export async function adminCreateInvite(
  supabase: DB,
  userId: string,
  email: string,
  departmentId: string | null,
) {
  await requireAdmin(supabase, userId);
  const { data, error } = await supabase
    .from("invites")
    .insert({ email, department_id: departmentId, invited_by: userId })
    .select()
    .single();
  if (error) fail(error.message);
  return data;
}

export async function adminSaveQuestion(
  supabase: DB,
  userId: string,
  payload: {
    week: number;
    index: number;
    scenario: string;
    options: string[];
    correctIndex: number;
    explanation: string;
  },
) {
  await requireAdmin(supabase, userId);
  const { error } = await supabase.from("question_overrides").upsert(
    {
      week_number: payload.week,
      question_index: payload.index,
      scenario: payload.scenario,
      options: payload.options,
      correct_index: payload.correctIndex,
      explanation: payload.explanation,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "week_number,question_index" },
  );
  if (error) fail(error.message);
  return { ok: true };
}

export async function adminLoadWeekEditor(supabase: DB, userId: string, week: number) {
  await requireAdmin(supabase, userId);
  const { data: weekRow } = await supabase
    .from("curriculum_weeks")
    .select("*")
    .eq("week_number", week)
    .maybeSingle();
  const questions = await resolveQuestions(supabase, week);
  return { week: weekRow, questions };
}

export async function adminUpdateWeekContent(
  supabase: DB,
  userId: string,
  week: number,
  patch: { topic?: string; fact?: string },
) {
  await requireAdmin(supabase, userId);
  const { error } = await supabase
    .from("curriculum_weeks")
    .update(patch)
    .eq("week_number", week);
  if (error) fail(error.message);
  return { ok: true };
}
