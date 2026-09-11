import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { levelForXp, levelForXpIn } from "./gamification";

type DB = SupabaseClient<Database>;
export type ShareTrack = "interviewer" | "recruiter";

export const SHARE_BONUS_XP = 50;

async function admin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

/** Recruiter-track share profile, ranked on recruiter XP only. */
export async function loadRecruiterShareProfile(supabase: DB, userId: string) {
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, share_slug, share_bonus_recruiter")
    .eq("id", userId)
    .maybeSingle();
  if (!profile) throw new Error("Profile not found.");

  const client = await admin();
  const { data: rows } = await client.rpc("get_recruiter_share_stats", { _user: userId });
  const row = rows?.[0];
  const totalXp = row?.total_xp ?? 0;
  const rank = row?.rank ?? null;
  const totalPlayers = row?.total_players ?? 0;

  return {
    track: "recruiter" as const,
    slug: profile.share_slug,
    name: row?.display_name ?? "Anonymous",
    level: row?.level ?? 1,
    levelTitle: levelForXpIn("recruiter", totalXp).title,
    totalXp,
    streak: row?.current_streak ?? 0,
    longestStreak: row?.longest_streak ?? 0,
    rank,
    totalPlayers,
    percentile:
      rank && totalPlayers > 0
        ? Math.max(1, Math.round((rank / totalPlayers) * 100))
        : null,
    bonusAwarded: Boolean(profile.share_bonus_recruiter),
  };
}

/** One-time +50 recruiter XP the first time a recruiter shares. */
export async function awardRecruiterShareBonus(supabase: DB, userId: string) {
  const { data: profile } = await supabase
    .from("profiles")
    .select("share_bonus_recruiter")
    .eq("id", userId)
    .maybeSingle();
  if (!profile) throw new Error("Profile not found.");

  const client = await admin();
  const { data: progress } = await client
    .from("track_progress")
    .select("total_xp")
    .eq("user_id", userId)
    .eq("track", "recruiter")
    .maybeSingle();

  const currentXp = progress?.total_xp ?? 0;
  if (profile.share_bonus_recruiter) {
    return { awarded: false as const, xp: 0, totalXp: currentXp };
  }

  const totalXp = currentXp + SHARE_BONUS_XP;
  const level = levelForXpIn("recruiter", totalXp).level;

  const { error } = await client
    .from("track_progress")
    .upsert(
      { user_id: userId, track: "recruiter", total_xp: totalXp, level },
      { onConflict: "user_id,track" },
    );
  if (error) throw new Error(error.message);

  await client
    .from("profiles")
    .update({ share_bonus_recruiter: true })
    .eq("id", userId);

  return { awarded: true as const, xp: SHARE_BONUS_XP, totalXp };
}

export async function loadShareProfile(supabase: DB, userId: string) {
  const { data: profile } = await supabase
    .from("profiles")
    .select(
      "id, display_name, full_name, email, level, total_xp, current_streak, longest_streak, share_slug, share_bonus_awarded",
    )
    .eq("id", userId)
    .maybeSingle();

  if (!profile) throw new Error("Profile not found.");

  const { data: board } = await supabase
    .from("profiles")
    .select("id, total_xp")
    .gt("total_xp", 0)
    .order("total_xp", { ascending: false });

  const players = board ?? [];
  const index = players.findIndex((p) => p.id === userId);
  const rank = index >= 0 ? index + 1 : null;
  const totalPlayers = players.length;
  const percentile =
    rank && totalPlayers > 0
      ? Math.max(1, Math.round((rank / totalPlayers) * 100))
      : null;

  return {
    slug: profile.share_slug,
    name: profile.display_name ?? profile.full_name ?? "Anonymous",
    level: profile.level ?? 1,
    levelTitle: levelForXp(profile.total_xp ?? 0).title,
    totalXp: profile.total_xp ?? 0,
    streak: profile.current_streak ?? 0,
    longestStreak: profile.longest_streak ?? 0,
    rank,
    totalPlayers,
    percentile,
    bonusAwarded: Boolean(profile.share_bonus_awarded),
  };
}

export async function saveShareCard(supabase: DB, userId: string, pngBase64: string) {
  const { error } = await supabase
    .from("share_cards")
    .upsert({ user_id: userId, png_base64: pngBase64, updated_at: new Date().toISOString() });
  if (error) throw new Error(error.message);
  return { ok: true as const };
}

/** One-time +50 XP the first time a player shares their achievement. */
export async function awardShareBonus(supabase: DB, userId: string) {
  const { data: profile } = await supabase
    .from("profiles")
    .select("total_xp, share_bonus_awarded")
    .eq("id", userId)
    .maybeSingle();

  if (!profile) throw new Error("Profile not found.");
  if (profile.share_bonus_awarded) {
    return { awarded: false as const, xp: 0, totalXp: profile.total_xp ?? 0 };
  }

  const totalXp = (profile.total_xp ?? 0) + SHARE_BONUS_XP;
  const level = levelForXp(totalXp).level;

  const { error } = await supabase
    .from("profiles")
    .update({ total_xp: totalXp, level, share_bonus_awarded: true })
    .eq("id", userId);
  if (error) throw new Error(error.message);

  return { awarded: true as const, xp: SHARE_BONUS_XP, totalXp };
}
