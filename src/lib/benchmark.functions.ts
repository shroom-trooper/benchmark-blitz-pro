import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Database } from "@/integrations/supabase/types";
import * as svc from "./benchmark.server";

const weekSchema = z.object({ week: z.number().int().min(1).max(52) });

export const getMe = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(({ context }) => svc.loadMe(context.supabase, context.userId));

export const getWeek = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => weekSchema.parse(d))
  .handler(({ context, data }) =>
    svc.loadWeek(context.supabase, context.userId, data.week),
  );

export const submitWeek = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        week: z.number().int().min(1).max(52),
        answers: z.array(z.number().int().min(0).max(5)).min(1).max(10),
      })
      .parse(d),
  )
  .handler(({ context, data }) =>
    svc.submitWeek(context.supabase, context.userId, data.week, data.answers),
  );

/** Public, signed-out readable board built from the safe-columns view. */
export const getPublicLeaderboard = createServerFn({ method: "GET" }).handler(async () => {
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"]!;
  const url = process.env["SUPABASE_URL"]!;
  const client = createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, init) => {
        const h = new Headers(init?.headers);
        if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`)
          h.delete("Authorization");
        h.set("apikey", key);
        return fetch(input, { ...init, headers: h });
      },
    },
  });
  const { data, error } = await client
    .from("public_leaderboard")
    .select("id, display_name, level, total_xp, current_streak")
    .order("total_xp", { ascending: false })
    .limit(100);
  if (error) return { players: [], totalPlayers: 0 };
  const players = (data ?? []).map((p, i) => ({
    id: p.id as string,
    name: p.display_name ?? "Anonymous",
    level: p.level ?? 1,
    totalXp: p.total_xp ?? 0,
    streak: p.current_streak ?? 0,
    rank: i + 1,
  }));
  return { players, totalPlayers: players.length };
});

export const getGroupLeaderboard = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(({ context }) => svc.loadGroupLeaderboard(context.supabase, context.userId));

export const getGroupConsole = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(({ context }) => svc.loadGroupConsole(context.supabase, context.userId));

export const createGroup = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ name: z.string().min(2).max(80) }).parse(d))
  .handler(({ context, data }) =>
    svc.createGroup(context.supabase, context.userId, data.name),
  );

export const acceptInvite = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ inviteId: z.string().uuid() }).parse(d))
  .handler(({ context, data }) =>
    svc.acceptInvite(context.supabase, context.userId, data.inviteId),
  );

export const leaveGroup = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(({ context }) => svc.leaveGroup(context.supabase, context.userId));

export const updateDisplayName = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ name: z.string().min(2).max(40) }).parse(d))
  .handler(({ context, data }) =>
    svc.updateDisplayName(context.supabase, context.userId, data.name),
  );

export const inviteToGroup = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ email: z.string().email() }).parse(d))
  .handler(({ context, data }) =>
    svc.inviteToGroup(context.supabase, context.userId, data.email),
  );

export const revokeInvite = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ inviteId: z.string().uuid() }).parse(d))
  .handler(({ context, data }) =>
    svc.revokeInvite(context.supabase, context.userId, data.inviteId),
  );

export const removeMember = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ memberId: z.string().uuid() }).parse(d))
  .handler(({ context, data }) =>
    svc.removeMember(context.supabase, context.userId, data.memberId),
  );

export const registerUpgradeInterest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ seats: z.number().int().min(1).max(10000).nullable() }).parse(d),
  )
  .handler(({ context, data }) =>
    svc.registerUpgradeInterest(context.supabase, context.userId, data.seats),
  );

export const setCurrentWeek = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => weekSchema.parse(d))
  .handler(({ context, data }) =>
    svc.adminSetCurrentWeek(context.supabase, context.userId, data.week),
  );

export const updateOrg = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        company_name: z.string().min(1).max(120).optional(),
        release_day: z.string().min(1).max(20).optional(),
        release_time: z.string().min(1).max(10).optional(),
      })
      .parse(d),
  )
  .handler(({ context, data }) =>
    svc.adminUpdateOrg(context.supabase, context.userId, data),
  );

export const loadWeekEditor = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => weekSchema.parse(d))
  .handler(({ context, data }) =>
    svc.adminLoadWeekEditor(context.supabase, context.userId, data.week),
  );

export const saveQuestion = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        week: z.number().int().min(1).max(52),
        index: z.number().int().min(0).max(9),
        scenario: z.string().min(1),
        options: z.array(z.string().min(1)).min(2).max(6),
        correctIndex: z.number().int().min(0).max(5),
        explanation: z.string().min(1),
      })
      .parse(d),
  )
  .handler(({ context, data }) =>
    svc.adminSaveQuestion(context.supabase, context.userId, data),
  );

export const updateWeekContent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        week: z.number().int().min(1).max(52),
        topic: z.string().min(1).max(200).optional(),
        fact: z.string().min(1).max(1000).optional(),
      })
      .parse(d),
  )
  .handler(({ context, data }) =>
    svc.adminUpdateWeekContent(context.supabase, context.userId, data.week, {
      ...(data.topic !== undefined ? { topic: data.topic } : {}),
      ...(data.fact !== undefined ? { fact: data.fact } : {}),
    }),
  );
