import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import * as svc from "./readiness.server";

const id = z.object({ id: z.string().uuid() });

export const listInterviews = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(({ context }) => svc.listInterviews(context.supabase, context.userId));

export const createInterview = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        roleTitle: z.string().trim().min(2).max(160),
        candidateDisplayName: z.string().trim().min(1).max(120),
        stage: z.string().trim().min(2).max(80),
        startsAt: z.string().datetime({ offset: true }),
        durationMinutes: z.number().int().min(5).max(480).nullable().optional(),
        competencies: z.array(z.string().trim().min(1).max(60)).max(12),
        responsibility: z.string().max(1000).nullable().optional(),
        jobDescription: z.string().max(20000).nullable().optional(),
        candidateProfile: z.string().max(12000).nullable().optional(),
        principles: z.array(z.string().trim().min(1).max(300)).max(10).optional(),
      })
      .parse(d),
  )
  .handler(({ context, data }) => svc.createInterview(context.supabase, context.userId, data));

export const getInterview = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => id.parse(d))
  .handler(({ context, data }) => svc.getInterview(context.supabase, context.userId, data.id));

export const generatePrep = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => id.parse(d))
  .handler(({ context, data }) => svc.generatePrep(context.supabase, context.userId, data.id));

export const getPrepSession = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => id.parse(d))
  .handler(({ context, data }) => svc.getPrepSession(context.userId, data.id));

export const submitPrepAnswer = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        sessionId: z.string().uuid(),
        questionId: z.string().uuid(),
        selectedIndex: z.number().int().min(0).max(5),
        responseTimeSeconds: z.number().int().min(0).max(3600).optional(),
      })
      .parse(d),
  )
  .handler(({ context, data }) => svc.submitPrepAnswer(context.userId, data));

export const completePrep = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => id.parse(d))
  .handler(({ context, data }) => svc.completePrep(context.userId, data.id));

export const getMyCapability = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(({ context }) => svc.getMyCapability(context.supabase, context.userId));

export const getGroupReadiness = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(({ context }) => svc.getGroupReadiness(context.supabase, context.userId));
