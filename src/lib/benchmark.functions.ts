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
  type LeaderRow = {
    id: string;
    display_name: string | null;
    level: number | null;
    total_xp: number | null;
    current_streak: number | null;
  };
  const { data, error } = await (client as unknown as {
    rpc: (fn: string) => Promise<{ data: LeaderRow[] | null; error: unknown }>;
  }).rpc("get_public_leaderboard");
  if (error) return { players: [], totalPlayers: 0 };

  const players = (data ?? []).map((p, i) => ({
    id: p.id,
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

export const listAssessments = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(({ context }) => asv.listAssessments(context.supabase, context.userId));

export const listMemberAssessments = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(({ context }) => asv.listMemberAssessments(context.supabase, context.userId));

export const getAssessment = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => idSchema.parse(d))
  .handler(({ context, data }) =>
    asv.loadAssessment(context.supabase, context.userId, data.id),
  );

export const submitAssessment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        answers: z.array(z.number().int().min(0).max(5)).min(1).max(25),
      })
      .parse(d),
  )
  .handler(({ context, data }) =>
    asv.submitAssessment(context.supabase, context.userId, data.id, data.answers),
  );

export const loadAssessmentEditor = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => idSchema.parse(d))
  .handler(({ context, data }) =>
    asv.loadAssessmentEditor(context.supabase, context.userId, data.id),
  );

export const createAssessmentFromLibrary = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        title: z.string().min(2).max(120),
        description: z.string().max(400).default(""),
        quarters: z.array(z.number().int().min(1).max(4)).max(4),
        targetQuestions: z.number().int().min(1).max(25),
        minutesPerQuestion: z.number().min(0.5).max(10),
      })
      .parse(d),
  )
  .handler(({ context, data }) =>
    asv.createFromLibrary(context.supabase, context.userId, data),
  );

export const createAssessmentWithAi = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        title: z.string().min(2).max(120),
        description: z.string().max(400).default(""),
        brief: z.string().max(2000).default(""),
        text: z.string().max(200000).default(""),
        files: z
          .array(
            z.object({
              name: z.string().min(1).max(200),
              mimeType: z.string().min(3).max(120),
              dataBase64: z.string().min(1),
            }),
          )
          .max(3)
          .default([]),
        targetQuestions: z.number().int().min(1).max(25),
        minutesPerQuestion: z.number().min(0.5).max(10),
      })
      .parse(d),
  )
  .handler(({ context, data }) =>
    asv.createWithAi(context.supabase, context.userId, data),
  );

export const updateAssessment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        title: z.string().min(2).max(120).optional(),
        description: z.string().max(400).optional(),
        estimatedMinutes: z.number().int().min(1).max(240).optional(),
        status: z.enum(["draft", "published"]).optional(),
      })
      .parse(d),
  )
  .handler(({ context, data }) =>
    asv.updateAssessment(context.supabase, context.userId, data.id, {
      ...(data.title !== undefined ? { title: data.title } : {}),
      ...(data.description !== undefined ? { description: data.description } : {}),
      ...(data.estimatedMinutes !== undefined
        ? { estimated_minutes: data.estimatedMinutes }
        : {}),
      ...(data.status !== undefined ? { status: data.status } : {}),
    }),
  );

export const deleteAssessment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => idSchema.parse(d))
  .handler(({ context, data }) =>
    asv.deleteAssessment(context.supabase, context.userId, data.id),
  );

export const saveAssessmentQuestion = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        assessmentId: z.string().uuid(),
        questionId: z.string().uuid().nullable(),
        scenario: z.string().min(1),
        options: z.array(z.string().min(1)).min(2).max(4),
        correctIndex: z.number().int().min(0).max(3),
        explanation: z.string().max(1000).default(""),
      })
      .parse(d),
  )
  .handler(({ context, data }) =>
    asv.saveAssessmentQuestion(context.supabase, context.userId, data),
  );

export const deleteAssessmentQuestion = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ assessmentId: z.string().uuid(), questionId: z.string().uuid() }).parse(d),
  )
  .handler(({ context, data }) =>
    asv.deleteAssessmentQuestion(
      context.supabase,
      context.userId,
      data.assessmentId,
      data.questionId,
    ),
  );

/* ----------------------- Elective extension library ---------------------- */

const lessonSchema = z.object({
  moduleSlug: z.string().min(1).max(80),
  lessonSlug: z.string().min(1).max(80),
});

export const getElectives = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(({ context }) => svc.loadElectives(context.supabase, context.userId));

export const getElectiveLesson = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => lessonSchema.parse(d))
  .handler(({ context, data }) =>
    svc.loadElectiveLesson(
      context.supabase,
      context.userId,
      data.moduleSlug,
      data.lessonSlug,
    ),
  );

export const submitElective = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    lessonSchema
      .extend({ answers: z.array(z.number().int().min(0).max(5)).min(1).max(10) })
      .parse(d),
  )
  .handler(({ context, data }) =>
    svc.submitElective(
      context.supabase,
      context.userId,
      data.moduleSlug,
      data.lessonSlug,
      data.answers,
    ),
  );

export const getGroupElectives = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(({ context }) => svc.loadGroupElectives(context.supabase, context.userId));

export const setGroupElective = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ moduleSlug: z.string().min(1).max(80), on: z.boolean() }).parse(d),
  )
  .handler(({ context, data }) =>
    svc.setGroupElective(context.supabase, context.userId, data.moduleSlug, data.on),
  );
