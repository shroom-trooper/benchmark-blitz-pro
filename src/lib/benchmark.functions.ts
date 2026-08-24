import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
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

export const getLeaderboard = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(({ context }) => svc.loadLeaderboard(context.supabase, context.userId));

export const getTelemetry = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(({ context }) => svc.loadTelemetry(context.supabase, context.userId));

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

export const createDepartment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ name: z.string().min(1).max(80) }).parse(d))
  .handler(({ context, data }) =>
    svc.adminCreateDepartment(context.supabase, context.userId, data.name),
  );

export const assignDepartment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({ userId: z.string().uuid(), departmentId: z.string().uuid().nullable() })
      .parse(d),
  )
  .handler(({ context, data }) =>
    svc.adminAssignDepartment(
      context.supabase,
      context.userId,
      data.userId,
      data.departmentId,
    ),
  );

export const createInvite = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        email: z.string().email(),
        departmentId: z.string().uuid().nullable(),
      })
      .parse(d),
  )
  .handler(({ context, data }) =>
    svc.adminCreateInvite(context.supabase, context.userId, data.email, data.departmentId),
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
