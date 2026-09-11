import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { getRecruiterQuestionsForWeek } from "./curriculum/recruiter";
import {
  computeXp,
  isTrack,
  levelForXpIn,
  nextUnlockAt,
  quarterForWeek,
  unlockedWeekFor,
  type Track,
} from "./gamification";

type DB = SupabaseClient<Database>;

function fail(message: string): never {
  throw new Error(message);
}

export type RecruiterProgress = {
  totalXp: number;
  level: number;
  currentStreak: number;
  longestStreak: number;
  lastCompletedWeek: number | null;
  startedAt: string;
};

export async function getActiveTrack(supabase: DB, userId: string): Promise<Track> {
  const { data } = await supabase
    .from("profiles")
    .select("active_track")
    .eq("id", userId)
    .maybeSingle();
  return isTrack(data?.active_track) ? data.active_track : "interviewer";
}

export async function getAllowedTracks(supabase: DB, userId: string): Promise<Track[]> {
  const { data } = await supabase
    .from("profiles")
    .select("allowed_tracks")
    .eq("id", userId)
    .maybeSingle();
  const list = (data?.allowed_tracks ?? []).filter(isTrack);
  return list.length ? list : ["interviewer"];
}

export async function setActiveTrack(supabase: DB, userId: string, track: Track) {
  const allowed = await getAllowedTracks(supabase, userId);
  if (!allowed.includes(track)) fail("You do not have access to that track.");
  const { error } = await supabase
    .from("profiles")
    .update({ active_track: track })
    .eq("id", userId);
  if (error) fail(error.message);
  if (track === "recruiter") await ensureRecruiterProgress(supabase, userId);
  return { track };
}

export async function ensureRecruiterProgress(
  supabase: DB,
  userId: string,
): Promise<RecruiterProgress> {
  const { data } = await supabase
    .from("track_progress")
    .select("*")
    .eq("user_id", userId)
    .eq("track", "recruiter")
    .maybeSingle();

  if (data) {
    return {
      totalXp: data.total_xp,
      level: data.level,
      currentStreak: data.current_streak,
      longestStreak: data.longest_streak,
      lastCompletedWeek: data.last_completed_week,
      startedAt: data.started_at,
    };
  }

  const startedAt = new Date().toISOString();
  const { data: created, error } = await supabase
    .from("track_progress")
    .insert({ user_id: userId, track: "recruiter", started_at: startedAt })
    .select("*")
    .maybeSingle();
  if (error && !created) {
    // Another request may have created it concurrently; fall back to a read.
    const { data: again } = await supabase
      .from("track_progress")
      .select("*")
      .eq("user_id", userId)
      .eq("track", "recruiter")
      .maybeSingle();
    if (!again) fail(error.message);
    return {
      totalXp: again.total_xp,
      level: again.level,
      currentStreak: again.current_streak,
      longestStreak: again.longest_streak,
      lastCompletedWeek: again.last_completed_week,
      startedAt: again.started_at,
    };
  }
  return {
    totalXp: created?.total_xp ?? 0,
    level: created?.level ?? 1,
    currentStreak: created?.current_streak ?? 0,
    longestStreak: created?.longest_streak ?? 0,
    lastCompletedWeek: created?.last_completed_week ?? null,
    startedAt: created?.started_at ?? startedAt,
  };
}

export async function loadRecruiterMe(supabase: DB, userId: string) {
  const progress = await ensureRecruiterProgress(supabase, userId);
  const [weeksRes, responsesRes] = await Promise.all([
    supabase.from("recruiter_weeks").select("*").order("week_number"),
    supabase
      .from("recruiter_responses")
      .select("week_number, score, xp_earned, completed_at")
      .eq("user_id", userId)
      .order("week_number"),
  ]);

  const [profileRes, ownedRes, invitesRes] = await Promise.all([
    supabase.from("profiles").select("display_name, group_id").eq("id", userId).maybeSingle(),
    supabase
      .from("groups")
      .select("id, name")
      .eq("owner_id", userId)
      .eq("track", "recruiter")
      .maybeSingle(),
    supabase.from("invites").select("id, group_id, status").eq("status", "pending"),
  ]);

  let group: { id: string; name: string } | null = ownedRes.data ?? null;
  const ownsGroup = Boolean(ownedRes.data);
  const memberGroupId = profileRes.data?.group_id ?? null;
  if (!group && memberGroupId) {
    const { data: mg } = await supabase
      .from("groups")
      .select("id, name, track")
      .eq("id", memberGroupId)
      .maybeSingle();
    if (mg?.track === "recruiter") group = { id: mg.id, name: mg.name };
  }

  const pendingInvites: { id: string; groupName: string }[] = [];
  if (!group) {
    for (const inv of invitesRes.data ?? []) {
      const { data: g } = await supabase
        .from("groups")
        .select("id, name, track")
        .eq("id", inv.group_id)
        .maybeSingle();
      if (g?.track === "recruiter") pendingInvites.push({ id: inv.id, groupName: g.name });
    }
  }

  return {
    track: "recruiter" as const,
    progress,
    displayName: profileRes.data?.display_name ?? "",
    group,
    ownsGroup,
    pendingInvites,
    weeks: weeksRes.data ?? [],
    responses: responsesRes.data ?? [],
    unlockedWeek: unlockedWeekFor(progress.startedAt),
    nextUnlockAt: nextUnlockAt(progress.startedAt),
  };
}

export async function loadRecruiterWeek(supabase: DB, userId: string, week: number) {
  const { data: weekRow } = await supabase
    .from("recruiter_weeks")
    .select("*")
    .eq("week_number", week)
    .maybeSingle();
  if (!weekRow) fail("That week is not in the recruiter curriculum yet.");

  const progress = await ensureRecruiterProgress(supabase, userId);
  if (week > unlockedWeekFor(progress.startedAt))
    fail("This session unlocks later — a new week opens every 7 days.");

  const questions = getRecruiterQuestionsForWeek(week).map((q, index) => ({ ...q, index }));

  const { data: existing } = await supabase
    .from("recruiter_responses")
    .select("*")
    .eq("user_id", userId)
    .eq("week_number", week)
    .maybeSingle();

  return {
    week: weekRow,
    quarter: quarterForWeek(week),
    questions: questions.map((q) => ({
      index: q.index,
      scenario: q.scenario,
      options: q.options,
    })),
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

export async function submitRecruiterWeek(
  supabase: DB,
  userId: string,
  week: number,
  answers: number[],
) {
  const progress = await ensureRecruiterProgress(supabase, userId);
  if (week > unlockedWeekFor(progress.startedAt))
    fail("This session unlocks later — a new week opens every 7 days.");

  const { data: existing } = await supabase
    .from("recruiter_responses")
    .select("id")
    .eq("user_id", userId)
    .eq("week_number", week)
    .maybeSingle();
  if (existing) fail("You have already completed this week's simulation.");

  const questions = getRecruiterQuestionsForWeek(week).map((q, index) => ({ ...q, index }));
  if (!questions.length) fail("That week is not in the recruiter curriculum yet.");
  if (answers.length !== questions.length) fail("Please answer every question.");

  const results = questions.map((q, i) => ({
    index: q.index,
    chosen: answers[i]!,
    correctIndex: q.correctIndex,
    correct: answers[i] === q.correctIndex,
    explanation: q.explanation,
  }));
  const correctCount = results.filter((r) => r.correct).length;

  const continues = progress.lastCompletedWeek === week - 1;
  const newStreak = continues ? progress.currentStreak + 1 : 1;
  const xp = computeXp(correctCount, newStreak - 1);
  const totalXp = progress.totalXp + xp.total;
  const newLevel = levelForXpIn("recruiter", totalXp).level;
  const leveledUp = newLevel > progress.level;

  const { error: respErr } = await supabase.from("recruiter_responses").insert({
    user_id: userId,
    week_number: week,
    answers,
    score: correctCount,
    xp_earned: xp.total,
    streak_bonus: xp.streakBonus,
  });
  if (respErr) fail(respErr.message);

  const { error: progErr } = await supabase
    .from("track_progress")
    .update({
      total_xp: totalXp,
      level: newLevel,
      current_streak: newStreak,
      longest_streak: Math.max(progress.longestStreak, newStreak),
      last_completed_week: week,
      last_completed_at: new Date().toISOString(),
    })
    .eq("user_id", userId)
    .eq("track", "recruiter");
  if (progErr) fail(progErr.message);

  return {
    results,
    correctCount,
    xp,
    totalXp,
    level: newLevel,
    leveledUp,
    streak: newStreak,
    newAchievements: [] as string[],
  };
}
