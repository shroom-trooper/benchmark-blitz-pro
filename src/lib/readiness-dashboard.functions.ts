import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { capabilityAreaSchema } from "@/lib/readiness/taxonomy";

const rangeSchema = z.object({ from: z.string().max(40).optional(), to: z.string().max(40).optional() });

export const getReadinessDashboard = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => rangeSchema.parse(d ?? {}) as { from?: string; to?: string })
  .handler(async ({ data, context }) => {
    const m = await import("@/lib/readiness/dashboard.server");
    return m.getReadinessDashboard(context.supabase, context.userId, data);
  });

export const getCapabilityDetail = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ area: capabilityAreaSchema }).parse(d))
  .handler(async ({ data, context }) => {
    const m = await import("@/lib/readiness/dashboard.server");
    return m.getCapabilityDetail(context.supabase, context.userId, data.area);
  });

export const getMemberProfile = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ memberId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const m = await import("@/lib/readiness/dashboard.server");
    return m.getMemberProfile(context.supabase, context.userId, data.memberId);
  });

export const getOwnReadinessProfile = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const m = await import("@/lib/readiness/dashboard.server");
    return m.getOwnProfile(context.userId);
  });

export const exportReadiness = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    rangeSchema
      .extend({ type: z.enum(["interview_operations", "team_capability", "individual_capability"]) })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const m = await import("@/lib/readiness/dashboard.server");
    return m.exportReadiness(context.supabase, context.userId, data);
  });
