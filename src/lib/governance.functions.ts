import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { ORG_ROLES } from "@/lib/authz/permissions";
import { FLAG_REASONS, QUESTION_STATUSES } from "@/lib/governance/validation";

const svc = () => import("@/lib/governance.server");
const id = z.string().uuid();
const reason = z.string().trim().max(1000);

const draftSchema = z.object({
  scenario: z.string().trim().min(1).max(2000),
  options: z.array(z.string().max(500)).min(2).max(6),
  correctIndex: z.number().int().min(0).max(5),
  explanation: z.string().trim().min(1).max(2000),
  capabilityArea: z.string().max(60),
  subSkill: z.string().max(80),
  difficulty: z.enum(["foundation", "standard", "advanced"]),
  risk: z.enum(["standard", "elevated", "high"]),
  sources: z.array(z.string().max(200)).max(10),
  interviewStages: z.array(z.string().max(60)).max(10),
});

export const getGovernanceOverview = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => (await svc()).getGovernanceOverview(context.userId));

export const listRoles = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => (await svc()).listRoles(context.userId));

export const setRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ memberId: id, role: z.enum(ORG_ROLES), grant: z.boolean() }).parse(d))
  .handler(async ({ context, data }) => (await svc()).setRole(context.userId, data));

export const listQuestions = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ status: z.enum(QUESTION_STATUSES).optional() }).parse(d ?? {}))
  .handler(async ({ context, data }) => (await svc()).listQuestions(context.userId, data.status));

export const getQuestion = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id }).parse(d))
  .handler(async ({ context, data }) => (await svc()).getQuestion(context.userId, data.id));

export const createDraft = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => draftSchema.parse(d))
  .handler(async ({ context, data }) => (await svc()).createDraft(context.userId, data));

export const updateDraft = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => draftSchema.extend({ id }).parse(d))
  .handler(async ({ context, data }) => {
    const { id: qid, ...rest } = data;
    return (await svc()).updateDraft(context.userId, qid, rest);
  });

export const questionAction = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        id,
        action: z.enum(["submit", "approve", "request_changes", "reject", "publish", "suspend", "retire", "revise"]),
        reason: reason.nullish(),
        checklist: z.record(z.string(), z.boolean()).optional(),
        exceptionReason: reason.nullish(),
      })
      .parse(d),
  )
  .handler(async ({ context, data }) => (await svc()).questionAction(context.userId, data));

export const flagQuestion = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ prepQuestionId: id, reason: z.enum(FLAG_REASONS), comment: reason.nullish() }).parse(d))
  .handler(async ({ context, data }) => (await svc()).flagQuestion(context.userId, data));

export const listFlags = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => (await svc()).listFlags(context.userId));

export const resolveFlag = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ id, decision: z.enum(["under_review", "dismissed", "confirmed_invalid", "fixed"]), note: reason }).parse(d),
  )
  .handler(async ({ context, data }) => (await svc()).resolveFlag(context.userId, data));

export const listInvalidations = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => (await svc()).listInvalidations(context.userId));

export const reverseInvalidation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id, reason }).parse(d))
  .handler(async ({ context, data }) => (await svc()).reverseInvalidation(context.userId, data));

export const listPrinciples = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => (await svc()).listPrinciples(context.userId));

export const savePrinciple = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ principleKey: id.nullish(), title: z.string().trim().min(3).max(120), body: z.string().trim().min(10).max(2000) }).parse(d),
  )
  .handler(async ({ context, data }) => (await svc()).savePrinciple(context.userId, data));

export const retirePrinciple = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id, reason }).parse(d))
  .handler(async ({ context, data }) => (await svc()).retirePrinciple(context.userId, data));

export const getRetention = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => (await svc()).getRetention(context.userId));

export const setRetention = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        candidate_context_days: z.number().int().min(1).max(365),
        attachment_text_days: z.number().int().min(1).max(90),
        calendar_details_days: z.number().int().min(7).max(730),
        audit_days: z.number().int().min(365).max(2555),
      })
      .parse(d),
  )
  .handler(async ({ context, data }) => (await svc()).setRetention(context.userId, data));

export const createDeletionRequest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ subjectType: z.enum(["interview_context", "participant_account_data"]), subjectId: id, reason: z.string().trim().min(5).max(500) }).parse(d),
  )
  .handler(async ({ context, data }) => (await svc()).createDeletionRequest(context.userId, data));

export const processDeletionRequest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id, approve: z.boolean(), note: reason.nullish() }).parse(d))
  .handler(async ({ context, data }) => (await svc()).processDeletionRequest(context.userId, data));

export const listAudit = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ action: z.string().max(40).nullish(), before: z.string().max(40).nullish() }).parse(d ?? {}))
  .handler(async ({ context, data }) => (await svc()).listAudit(context.userId, data));
