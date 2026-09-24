import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const ONBOARDING_STEPS = 9;

export const getOnboarding = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data } = await supabaseAdmin
      .from("profiles")
      .select("full_name, onboarding_step, onboarding_completed_at")
      .eq("id", context.userId)
      .maybeSingle();
    return {
      name: data?.full_name ?? "",
      step: data?.onboarding_step ?? 0,
      completed: !!data?.onboarding_completed_at,
    };
  });

export const saveOnboarding = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        step: z.number().int().min(0).max(ONBOARDING_STEPS),
        name: z.string().trim().min(2).max(60).optional(),
        complete: z.boolean().optional(),
      })
      .parse(d),
  )
  .handler(async ({ context, data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    // Only these columns can be written — roles are never touched here.
    const patch: { onboarding_step: number; full_name?: string; display_name?: string; onboarding_completed_at?: string } = {
      onboarding_step: data.step,
    };
    if (data.name) {
      patch.full_name = data.name;
      patch.display_name = data.name;
    }
    if (data.complete) patch.onboarding_completed_at = new Date().toISOString();
    const { error } = await supabaseAdmin.from("profiles").update(patch).eq("id", context.userId);
    if (error) throw new Error("Could not save your progress");
    return { ok: true };
  });

/** Rank by completed preparations among everyone training on Benchmark. */
export const getMyRanking = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data } = await supabaseAdmin
      .from("prep_sessions")
      .select("interviewer_id")
      .eq("status", "completed");
    const counts = new Map<string, number>();
    for (const r of data ?? []) counts.set(r.interviewer_id, (counts.get(r.interviewer_id) ?? 0) + 1);
    const mine = counts.get(context.userId) ?? 0;
    if (!mine) return { rank: null as number | null, total: counts.size };
    const rank = 1 + [...counts.values()].filter((c) => c > mine).length;
    return { rank, total: counts.size };
  });
