import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { sendTemplateEmail } from "@/lib/email-templates/send-email";
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
    .from("groups")
    .select("id")
    .eq("owner_id", userId)
    .maybeSingle();
  return Boolean(data);
}

export async function requireGroupOwner(supabase: DB, userId: string) {
  const { data } = await supabase
    .from("groups")
    .select("*")
    .eq("owner_id", userId)
    .maybeSingle();
  if (!data) fail("You do not own a group yet.");
  return data;
}

export async function isPlatformAdmin(supabase: DB, userId: string) {
  const { data } = await supabase
    .from("platform_admins")
    .select("user_id")
    .eq("user_id", userId)
    .maybeSingle();
  return Boolean(data);
}

export async function requirePlatformAdmin(supabase: DB, userId: string) {
  if (!(await isPlatformAdmin(supabase, userId)))
    fail("Forbidden: platform administrators only");
}

export async function loadMe(supabase: DB, userId: string) {
  const [profileRes, rolesRes, settingsRes, responsesRes, achRes, allAchRes] =
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
    ]);

  const profile = profileRes.data;
  const roles = (rolesRes.data ?? []).map((r) => r.role);

  const [ownedRes, groupRes, invitesRes, platformRes] = await Promise.all([
    supabase.from("groups").select("*").eq("owner_id", userId).maybeSingle(),
    profile?.group_id
      ? supabase.from("groups").select("*").eq("id", profile.group_id).maybeSingle()
      : Promise.resolve({ data: null }),
    supabase
      .from("invites")
      .select("id, email, group_id, status, created_at")
      .eq("status", "pending"),
    supabase.from("platform_admins").select("user_id").eq("user_id", userId).maybeSingle(),
  ]);

  const ownedGroup = ownedRes.data ?? null;
  const group = groupRes.data ?? ownedGroup;

  const pendingInvites = profile?.group_id
    ? []
    : await Promise.all(
        (invitesRes.data ?? []).map(async (i) => {
          const { data: g } = await supabase
            .from("groups")
            .select("id, name")
            .eq("id", i.group_id)
            .maybeSingle();
          return { id: i.id, groupName: g?.name ?? "A group", email: i.email };
        }),
      );

  return {
    profile,
    roles,
    isAdmin: Boolean(ownedGroup),
    isPlatformAdmin: Boolean(platformRes.data),
    group,
    ownsGroup: Boolean(ownedGroup),
    pendingInvites,
    settings: settingsRes.data,
    responses: responsesRes.data ?? [],
    earned: achRes.data ?? [],
    achievements: allAchRes.data ?? [],
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
  const admin = await isPlatformAdmin(supabase, userId);
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
  const admin = await isPlatformAdmin(supabase, userId);
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

export async function loadGroupLeaderboard(supabase: DB, userId: string) {
  const { data: profile } = await supabase
    .from("profiles")
    .select("group_id")
    .eq("id", userId)
    .maybeSingle();
  if (!profile?.group_id) return null;

  const { data: group } = await supabase
    .from("groups")
    .select("*")
    .eq("id", profile.group_id)
    .maybeSingle();
  const { data: members } = await supabase
    .from("profiles")
    .select("id, full_name, display_name, email, total_xp, level, current_streak")
    .eq("group_id", profile.group_id);

  const ranked = (members ?? [])
    .map((p) => ({
      id: p.id,
      name: p.display_name || p.full_name || p.email.split("@")[0]!,
      totalXp: p.total_xp,
      level: p.level,
      streak: p.current_streak,
      isMe: p.id === userId,
      isOwner: p.id === group?.owner_id,
    }))
    .sort((a, b) => b.totalXp - a.totalXp)
    .map((p, i) => ({ ...p, rank: i + 1 }));

  return {
    group: group ? { id: group.id, name: group.name, memberLimit: group.member_limit } : null,
    members: ranked,
  };
}

export async function loadGroupConsole(supabase: DB, userId: string) {
  const group = await requireGroupOwner(supabase, userId);

  const [membersRes, weeksRes, settingsRes, invitesRes] = await Promise.all([
    supabase.from("profiles").select("*").eq("group_id", group.id),
    supabase.from("curriculum_weeks").select("*").order("week_number"),
    supabase.from("org_settings").select("*").eq("id", 1).maybeSingle(),
    supabase
      .from("invites")
      .select("*")
      .eq("group_id", group.id)
      .order("created_at", { ascending: false }),
  ]);

  const members = membersRes.data ?? [];
  const weeks = weeksRes.data ?? [];
  const currentWeek = settingsRes.data?.current_week ?? 1;
  const memberIds = members.map((m) => m.id);

  const { data: responses } = memberIds.length
    ? await supabase.from("responses").select("*").in("user_id", memberIds)
    : { data: [] as never[] };
  const rows = responses ?? [];

  const completedCurrent = rows.filter((r) => r.week_number === currentWeek).length;
  const participation = members.length
    ? Math.round((completedCurrent / members.length) * 100)
    : 0;

  const weekStats = weeks
    .filter((w) => w.week_number <= currentWeek)
    .map((w) => {
      const wr = rows.filter((r) => r.week_number === w.week_number);
      const avg = wr.length ? wr.reduce((s, r) => s + r.score, 0) / wr.length : 0;
      return {
        week: w.week_number,
        topic: w.topic,
        completions: wr.length,
        avgScore: Math.round(avg * 100) / 100,
        accuracy: Math.round((avg / 3) * 100),
      };
    });

  const riskiest = [...weekStats]
    .filter((w) => w.completions > 0)
    .sort((a, b) => a.accuracy - b.accuracy)
    .slice(0, 5);

  // Custom group assessments
  const { data: groupAssessments } = await supabase
    .from("assessments")
    .select("id, title, target_questions, status")
    .eq("group_id", group.id);
  const assessments = groupAssessments ?? [];
  const publishedAssessments = assessments.filter((a) => a.status === "published");
  const assessmentIds = assessments.map((a) => a.id);

  const { data: aResponses } = assessmentIds.length && memberIds.length
    ? await supabase
        .from("assessment_responses")
        .select("*")
        .in("assessment_id", assessmentIds)
        .in("user_id", memberIds)
    : { data: [] as never[] };
  const aRows = aResponses ?? [];

  const topicForWeek = new Map(weeks.map((w) => [w.week_number, w.topic]));

  const users = members
    .map((p) => {
      const mine = rows.filter((r) => r.user_id === p.id);
      const avgScore = mine.length ? mine.reduce((s, r) => s + r.score, 0) / mine.length : 0;

      const myAssessments = aRows.filter((r) => r.user_id === p.id);
      const sessions = [
        ...mine
          .slice()
          .sort((a, b) => a.week_number - b.week_number)
          .map((r) => ({
            kind: "weekly" as const,
            label: `Week ${r.week_number}`,
            topic: topicForWeek.get(r.week_number) ?? `Week ${r.week_number}`,
            score: r.score,
            total: 3,
            accuracy: Math.round((r.score / 3) * 100),
            completedAt: r.completed_at,
          })),
        ...myAssessments.map((r) => {
          const a = assessments.find((x) => x.id === r.assessment_id);
          const total = a?.target_questions || 1;
          return {
            kind: "custom" as const,
            label: "Custom",
            topic: a?.title ?? "Custom assessment",
            score: r.score,
            total,
            accuracy: Math.round((r.score / total) * 100),
            completedAt: r.completed_at,
          };
        }),
      ].sort(
        (a, b) => new Date(a.completedAt).getTime() - new Date(b.completedAt).getTime(),
      );

      const weeklyQuestions = mine.length * 3;
      const weeklyCorrect = mine.reduce((s, r) => s + r.score, 0);
      const customQuestions = myAssessments.reduce((s, r) => {
        const a = assessments.find((x) => x.id === r.assessment_id);
        return s + (a?.target_questions || 1);
      }, 0);
      const customCorrect = myAssessments.reduce((s, r) => s + r.score, 0);
      const totalQuestions = weeklyQuestions + customQuestions;
      const combinedAccuracy = totalQuestions
        ? Math.round(((weeklyCorrect + customCorrect) / totalQuestions) * 100)
        : 0;
      const overallAccuracy = combinedAccuracy;

      const lastWeeklyAt = mine.length
        ? mine.reduce<string | null>(
            (acc, r) =>
              !acc || new Date(r.completed_at).getTime() > new Date(acc).getTime()
                ? r.completed_at
                : acc,
            null,
          )
        : null;
      const lastCustomAt = myAssessments.length
        ? myAssessments.reduce<string | null>(
            (acc, r) =>
              !acc || new Date(r.completed_at).getTime() > new Date(acc).getTime()
                ? r.completed_at
                : acc,
            null,
          )
        : null;
      const lastActiveAt =
        [lastWeeklyAt, lastCustomAt]
          .filter((x): x is string => Boolean(x))
          .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0] ?? null;

      const assignedWeekly = weeks.filter((w) => w.week_number <= currentWeek).length;
      const assignedCustom = publishedAssessments.length;
      const assignedTotal = assignedWeekly + assignedCustom;
      const completionRate = assignedTotal
        ? Math.round(((mine.length + myAssessments.length) / assignedTotal) * 100)
        : 0;
      const daysSinceActive = lastActiveAt
        ? Math.floor((Date.now() - new Date(lastActiveAt).getTime()) / 86_400_000)
        : null;
      const missedRecentWeekly = !mine.some((r) => r.week_number === currentWeek);

      let readiness: "high" | "practice" | "risk";
      if (
        totalQuestions === 0 ||
        combinedAccuracy < 50 ||
        daysSinceActive === null ||
        daysSinceActive >= 14
      ) {
        readiness = "risk";
      } else if (combinedAccuracy > 80 && completionRate > 80) {
        readiness = "high";
      } else {
        readiness = "practice";
      }
      if (readiness === "high" && missedRecentWeekly) readiness = "practice";

      const weakTopics = sessions
        .filter((s) => s.accuracy < 100)
        .sort((a, b) => a.accuracy - b.accuracy)
        .slice(0, 3)
        .map((s) => ({ topic: s.topic, accuracy: s.accuracy }));

      return {
        id: p.id,
        name: p.display_name || p.full_name || p.email.split("@")[0]!,
        email: p.email,
        isOwner: p.id === group.owner_id,
        level: p.level,
        totalXp: p.total_xp,
        streak: p.current_streak,
        completions: mine.length,
        avgScore: Math.round(avgScore * 100) / 100,
        accuracy: Math.round((avgScore / 3) * 100),
        customCompletions: myAssessments.length,
        customAvgAccuracy: customQuestions
          ? Math.round((customCorrect / customQuestions) * 100)
          : 0,
        weeklyAccuracy: weeklyQuestions
          ? Math.round((weeklyCorrect / weeklyQuestions) * 100)
          : 0,
        weeklyCorrect,
        weeklyQuestions,
        customCorrect,
        customQuestions,
        totalCorrect: weeklyCorrect + customCorrect,
        totalQuestions,
        combinedAccuracy,
        assignedWeekly,
        assignedCustom,
        completionRate,
        readiness,
        missedRecentWeekly,
        overallAccuracy,
        topicsCompleted: Array.from(new Set(sessions.map((s) => s.topic))),
        sessions,
        weakTopics,
        lastActiveAt,
        lastCompletedAt: lastActiveAt,
      };
    })
    .sort((a, b) => b.combinedAccuracy - a.combinedAccuracy || b.totalXp - a.totalXp);




  const invites = invitesRes.data ?? [];
  const pendingInvites = invites.filter((i) => i.status === "pending");
  const seatsUsed = users.filter((u) => !u.isOwner).length + pendingInvites.length;

  return {
    group: {
      id: group.id,
      name: group.name,
      memberLimit: group.member_limit,
      seatsUsed,
      seatsLeft: Math.max(0, group.member_limit - seatsUsed),
    },
    summary: {
      members: members.length,
      currentWeek,
      releasedWeeks: weeks.filter((w) => w.week_number <= currentWeek).length,
      publishedAssessments: publishedAssessments.length,


      participation,
      completedCurrent,
      totalCompletions: rows.length,
      avgAccuracy: rows.length
        ? Math.round((rows.reduce((s, r) => s + r.score, 0) / (rows.length * 3)) * 100)
        : 0,
      dormant: users.filter((u) => u.completions === 0 || u.streak === 0).length,
    },
    weekStats,
    riskiest,
    users,
    invites,
    weeks,
    settings: settingsRes.data,
    isPlatformAdmin: await isPlatformAdmin(supabase, userId),
  };
}

export async function createGroup(supabase: DB, _userId: string, name: string) {
  const { data, error } = await supabase.rpc("create_group", { _name: name });
  if (error) fail(error.message);
  return { groupId: data as string };
}

export async function acceptInvite(supabase: DB, _userId: string, inviteId: string) {
  const { data, error } = await supabase.rpc("accept_invite", { _invite_id: inviteId });
  if (error) fail(friendly(error.message));
  return { groupId: data as string };
}

export async function leaveGroup(supabase: DB, _userId: string) {
  const { error } = await supabase.rpc("leave_group");
  if (error) fail(error.message);
  return { ok: true };
}

export async function updateDisplayName(supabase: DB, userId: string, name: string) {
  const { error } = await supabase
    .from("profiles")
    .update({ display_name: name.trim() })
    .eq("id", userId);
  if (error) fail(error.message);
  return { ok: true };
}

export async function inviteToGroup(supabase: DB, userId: string, email: string) {
  const group = await requireGroupOwner(supabase, userId);
  const { data, error } = await supabase
    .from("invites")
    .insert({ email: email.trim().toLowerCase(), group_id: group.id, invited_by: userId })
    .select()
    .single();
  if (error) fail(friendly(error.message));

  const { data: inviter } = await supabase
    .from("profiles")
    .select("display_name, full_name, email")
    .eq("id", userId)
    .maybeSingle();

  try {
    await sendTemplateEmail("group-invite", data.email, {
      templateData: {
        groupName: group.name,
        inviterName:
          inviter?.display_name || inviter?.full_name || inviter?.email?.split("@")[0] || null,
        joinUrl: "https://usebenchmark.app/auth",
      },
      idempotencyKey: `group-invite-${data.id}`,
    });
  } catch (e) {
    console.error("[invite] email send failed", e);
  }

  return data;
}


export async function revokeInvite(supabase: DB, userId: string, inviteId: string) {
  const group = await requireGroupOwner(supabase, userId);
  const { error } = await supabase
    .from("invites")
    .delete()
    .eq("id", inviteId)
    .eq("group_id", group.id);
  if (error) fail(error.message);
  return { ok: true };
}

export async function removeMember(supabase: DB, userId: string, memberId: string) {
  const group = await requireGroupOwner(supabase, userId);
  if (memberId === userId) fail("You cannot remove yourself from your own group.");
  const { error } = await supabase
    .from("profiles")
    .update({ group_id: null })
    .eq("id", memberId)
    .eq("group_id", group.id);
  if (error) fail(error.message);
  return { ok: true };
}

export async function registerUpgradeInterest(
  supabase: DB,
  userId: string,
  seatsWanted: number | null,
) {
  const { data: group } = await supabase
    .from("groups")
    .select("id")
    .eq("owner_id", userId)
    .maybeSingle();
  const { error } = await supabase.from("upgrade_interest").insert({
    user_id: userId,
    group_id: group?.id ?? null,
    seats_wanted: seatsWanted,
  });
  if (error) fail(error.message);
  return { ok: true };
}

function friendly(message: string) {
  if (message.includes("GROUP_LIMIT"))
    return "Group limit reached — the free tier allows 3 members plus you.";
  if (message.includes("invites_group_email_unique"))
    return "That email has already been invited to your group.";
  return message;
}

export async function adminSetCurrentWeek(supabase: DB, userId: string, week: number) {
  await requirePlatformAdmin(supabase, userId);
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
  await requirePlatformAdmin(supabase, userId);
  const clean = Object.fromEntries(
    Object.entries(patch).filter(([, v]) => v !== undefined),
  ) as { company_name?: string; release_day?: string; release_time?: string };
  const { error } = await supabase.from("org_settings").update(clean).eq("id", 1);
  if (error) fail(error.message);
  return { ok: true };
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
  await requirePlatformAdmin(supabase, userId);
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
  await requirePlatformAdmin(supabase, userId);
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
  await requirePlatformAdmin(supabase, userId);
  const { error } = await supabase
    .from("curriculum_weeks")
    .update(patch)
    .eq("week_number", week);
  if (error) fail(error.message);
  return { ok: true };
}
