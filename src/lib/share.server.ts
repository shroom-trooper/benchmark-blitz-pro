import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { levelForXp } from "./gamification";

type DB = SupabaseClient<Database>;

export const SHARE_BONUS_XP = 50;

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
