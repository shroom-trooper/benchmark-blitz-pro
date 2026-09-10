import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Database } from "@/integrations/supabase/types";
import { levelForXp } from "./gamification";
import * as share from "./share.server";

// The public profile function is server-only, so read it with the trusted
// server client rather than exposing it to browsers.
async function publicClient() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

const slugSchema = z.object({ slug: z.string().min(2).max(64) });

/** Everything the share-card modal needs about the signed-in player. */
export const getShareProfile = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(({ context }) => share.loadShareProfile(context.supabase, context.userId));

export const saveShareCard = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ png: z.string().min(100).max(4_000_000) }).parse(d),
  )
  .handler(({ context, data }) =>
    share.saveShareCard(context.supabase, context.userId, data.png),
  );

export const claimShareBonus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(({ context }) => share.awardShareBonus(context.supabase, context.userId));

/** Public, signed-out readable profile for /p/$slug. */
export const getPublicProfile = createServerFn({ method: "GET" })
  .inputValidator((d: unknown) => slugSchema.parse(d))
  .handler(async ({ data }) => {
    const client = publicClient();
    const { data: rows, error } = await client.rpc("get_public_profile", {
      p_slug: data.slug,
    });
    const row = rows?.[0];
    if (error || !row) return null;
    return {
      slug: data.slug,
      name: row.display_name ?? "Anonymous",
      level: row.level ?? 1,
      levelTitle: levelForXp(row.total_xp ?? 0).title,
      totalXp: row.total_xp ?? 0,
      streak: row.current_streak ?? 0,
      longestStreak: row.longest_streak ?? 0,
      rank: row.rank ?? null,
      totalPlayers: row.total_players ?? 0,
      percentile:
        row.rank && row.total_players
          ? Math.max(1, Math.round((row.rank / row.total_players) * 100))
          : null,
    };
  });
