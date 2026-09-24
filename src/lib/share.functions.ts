import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { levelForXp, levelForXpIn } from "./gamification";
import * as share from "./share.server";

// The public profile function is server-only, so read it with the trusted
// server client rather than exposing it to browsers.
async function publicClient() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

const trackSchema = z.enum(["interviewer", "recruiter"]).default("interviewer");
const slugSchema = z.object({ slug: z.string().min(2).max(64), track: trackSchema.optional() });

/** Everything the share-card modal needs about the signed-in player. */
export const getShareProfile = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ track: trackSchema }).parse(d ?? {}))
  .handler(({ context, data }) =>
    data.track === "recruiter"
      ? share.loadRecruiterShareProfile(context.supabase, context.userId)
      : share.loadShareProfile(context.supabase, context.userId),
  );

export const saveShareCard = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ png: z.string().min(100).max(4_000_000), track: trackSchema }).parse(d),
  )
  .handler(async (): Promise<never> => {
    // Phase 5: social sharing and XP bonuses are retired.
    throw new Error("Sharing is no longer available.");
  });

export const claimShareBonus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ track: trackSchema }).parse(d ?? {}))
  .handler(async (): Promise<never> => {
    // Phase 5: social sharing and XP bonuses are retired.
    throw new Error("Sharing is no longer available.");
  });