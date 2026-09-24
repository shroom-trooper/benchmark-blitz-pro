/**
 * Phase 4 governance: organizations, roles, content lifecycle, flags, evidence invalidation,
 * principles, retention/deletion and audit. Every exported action verifies a permission first.
 */
import {
  ORG_ROLES,
  ROLE_LABELS,
  assignableRoles,
  canRemoveRole,
  permissionsFor,
  type OrgRole,
  type Permission,
} from "@/lib/authz/permissions";
import {
  canApprove,
  checklistComplete,
  isEditable,
  maxRisk,
  sanitizeAuditMetadata,
  suggestedRisk,
  transition,
  validateQuestion,
  type LifecycleAction,
  type QuestionInput,
  type QuestionStatus,
  type RiskLevel,
} from "@/lib/governance/validation";

async function admin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}
function fail(msg: string): never {
  throw new Error(msg);
}

/* ---------------- Organization context ---------------- */

/** Creates an organization for a group owner who doesn't have one yet (groups created after Phase 4). */
async function ensureOrganization(userId: string): Promise<void> {
  const a = await admin();
  const { data: owned } = await a.from("groups").select("id, organization_id").eq("owner_id", userId);
  if (!owned?.length) return;
  let orgId = owned.find((g) => g.organization_id)?.organization_id ?? null;
  if (!orgId) {
    const { data: existing } = await a.from("organizations").select("id").eq("created_by", userId).maybeSingle();
    orgId = existing?.id ?? null;
  }
  if (!orgId) {
    const { data: p } = await a.from("profiles").select("display_name, full_name, email").eq("id", userId).maybeSingle();
    const base = p?.display_name || p?.full_name || p?.email?.split("@")[0] || "My";
    const { data: org, error } = await a.from("organizations").insert({ name: `${base}'s organization`, created_by: userId }).select("id").single();
    if (error || !org) return;
    orgId = org.id;
    await audit(orgId, userId, "organization.created", "organization", orgId, {});
  }
  const missing = owned.filter((g) => g.organization_id !== orgId).map((g) => g.id);
  if (missing.length) await a.from("groups").update({ organization_id: orgId }).in("id", missing).is("organization_id", null);
  await a.from("organization_roles").upsert({ organization_id: orgId, user_id: userId, role: "organization_admin" }, { onConflict: "organization_id,user_id,role", ignoreDuplicates: true });
  const { data: members } = await a.from("profiles").select("id").in("group_id", owned.map((g) => g.id)).neq("id", userId);
  if (members?.length)
    await a.from("organization_roles").upsert(
      members.map((m) => ({ organization_id: orgId!, user_id: m.id, role: "participant" as const })),
      { onConflict: "organization_id,user_id,role", ignoreDuplicates: true },
    );
}

export type OrgContext = { orgId: string; orgName: string; roles: OrgRole[]; permissions: Permission[]; singleReviewerException: boolean };

export async function orgContext(userId: string): Promise<OrgContext | null> {
  await ensureOrganization(userId);
  const a = await admin();
  const { data: rows } = await a.from("organization_roles").select("organization_id, role").eq("user_id", userId);
  if (!rows?.length) return null;
  // Prefer the organization where the user holds the most privileged role.
  const rank = (r: string) => ORG_ROLES.indexOf(r as OrgRole);
  const best = [...rows].sort((x, y) => rank(y.role) - rank(x.role))[0]!;
  const roles = rows.filter((r) => r.organization_id === best.organization_id).map((r) => r.role as OrgRole);
  const { data: org } = await a.from("organizations").select("name, single_reviewer_exception").eq("id", best.organization_id).single();
  return {
    orgId: best.organization_id,
    orgName: org?.name ?? "Organization",
    roles,
    permissions: [...permissionsFor(roles)],
    singleReviewerException: org?.single_reviewer_exception ?? false,
  };
}

export async function requirePermission(userId: string, perm: Permission): Promise<OrgContext> {
  const ctx = await orgContext(userId);
  if (!ctx || !ctx.permissions.includes(perm)) fail("You don't have permission to do that.");
  return ctx;
}

export async function audit(orgId: string | null, actorId: string | null, action: string, targetType: string, targetId: string | null, metadata: Record<string, unknown>) {
  const a = await admin();
  await a.from("audit_events").insert({
    organization_id: orgId,
    actor_id: actorId,
    action,
    target_type: targetType,
    target_id: targetId,
    metadata: sanitizeAuditMetadata(metadata) as never,
  });
}

async function names(ids: string[]) {
  if (!ids.length) return new Map<string, string>();
  const a = await admin();
  const { data } = await a.from("profiles").select("id, display_name, full_name, email").in("id", [...new Set(ids)]);
  return new Map((data ?? []).map((p) => [p.id, p.display_name || p.full_name || p.email.split("@")[0]!]));
}

/* ---------------- Overview ---------------- */

export async function getGovernanceOverview(userId: string) {
  const ctx = await orgContext(userId);
  if (!ctx) return null;
  const a = await admin();
  const has = (p: Permission) => ctx.permissions.includes(p);
  const [review, flags, deletions] = await Promise.all([
    has("content.review")
      ? a.from("question_definitions").select("id", { count: "exact", head: true }).eq("organization_id", ctx.orgId).eq("current_status", "in_review")
      : Promise.resolve({ count: 0 }),
    has("question_flags.read")
      ? a.from("question_flags").select("id", { count: "exact", head: true }).eq("organization_id", ctx.orgId).in("status", ["open", "under_review"])
      : Promise.resolve({ count: 0 }),
    has("deletion.execute")
      ? a.from("deletion_requests").select("id", { count: "exact", head: true }).eq("organization_id", ctx.orgId).eq("status", "pending")
      : Promise.resolve({ count: 0 }),
  ]);
  return { ...ctx, counts: { inReview: review.count ?? 0, openFlags: flags.count ?? 0, pendingDeletions: deletions.count ?? 0 } };
}

/* ---------------- Roles ---------------- */

export async function listRoles(userId: string) {
  const ctx = await requirePermission(userId, "members.read");
  const a = await admin();
  const { data } = await a.from("organization_roles").select("user_id, role, created_at").eq("organization_id", ctx.orgId);
  const n = await names((data ?? []).map((r) => r.user_id));
  const by = new Map<string, { id: string; name: string; roles: OrgRole[] }>();
  for (const r of data ?? []) {
    const cur = by.get(r.user_id) ?? { id: r.user_id, name: n.get(r.user_id) ?? "Member", roles: [] };
    cur.roles.push(r.role as OrgRole);
    by.set(r.user_id, cur);
  }
  return {
    members: [...by.values()].sort((x, y) => x.name.localeCompare(y.name)),
    assignable: assignableRoles(ctx.roles),
    canAssign: ctx.permissions.includes("roles.assign"),
    me: userId,
  };
}

export async function setRole(userId: string, input: { memberId: string; role: OrgRole; grant: boolean }) {
  const ctx = await requirePermission(userId, "roles.assign");
  if (!assignableRoles(ctx.roles).includes(input.role)) fail("You can't grant that role.");
  const a = await admin();
  const { data: member } = await a.from("organization_roles").select("id").eq("organization_id", ctx.orgId).eq("user_id", input.memberId).limit(1);
  if (!member?.length) fail("That person isn't in your organization.");
  if (input.grant) {
    await a.from("organization_roles").upsert(
      { organization_id: ctx.orgId, user_id: input.memberId, role: input.role, granted_by: userId },
      { onConflict: "organization_id,user_id,role", ignoreDuplicates: true },
    );
  } else {
    const { count } = await a.from("organization_roles").select("id", { count: "exact", head: true }).eq("organization_id", ctx.orgId).eq("role", "organization_admin");
    const check = canRemoveRole({ role: input.role, adminCount: count ?? 0 });
    if (!check.ok) fail(check.reason);
    await a.from("organization_roles").delete().eq("organization_id", ctx.orgId).eq("user_id", input.memberId).eq("role", input.role);
  }
  await audit(ctx.orgId, userId, input.grant ? "role.granted" : "role.removed", "member", input.memberId, { role: input.role });
  return { ok: true, label: ROLE_LABELS[input.role] };
}

/* ---------------- Content ---------------- */

type VersionRow = {
  id: string;
  version_number: number;
  scenario: string;
  options: unknown;
  correct_index: number;
  explanation: string;
  capability_area: string;
  sub_skill: string;
  difficulty: string;
  risk_level: string;
  generated_by_ai: boolean;
  source_references: unknown;
  validation: unknown;
  locked: boolean;
  created_by: string;
  created_at: string;
};

export async function listQuestions(userId: string, status?: QuestionStatus) {
  const ctx = await requirePermission(userId, "content.read");
  const a = await admin();
  let q = a.from("question_definitions").select("id, current_status, created_by, updated_at, content_scope").eq("organization_id", ctx.orgId).order("updated_at", { ascending: false }).limit(300);
  if (status) q = q.eq("current_status", status);
  const { data: defs } = await q;
  const ids = (defs ?? []).map((d) => d.id);
  const { data: vers } = ids.length
    ? await a.from("question_versions").select("question_definition_id, version_number, scenario, capability_area, sub_skill, risk_level, generated_by_ai").in("question_definition_id", ids)
    : { data: [] };
  const latest = new Map<string, NonNullable<typeof vers>[number]>();
  for (const v of vers ?? []) {
    const cur = latest.get(v.question_definition_id);
    if (!cur || v.version_number > cur.version_number) latest.set(v.question_definition_id, v);
  }
  const n = await names((defs ?? []).map((d) => d.created_by));
  return {
    questions: (defs ?? []).map((d) => {
      const v = latest.get(d.id);
      return {
        id: d.id,
        status: d.current_status as QuestionStatus,
        updatedAt: d.updated_at,
        author: n.get(d.created_by) ?? "Member",
        version: v?.version_number ?? 1,
        scenario: v?.scenario.slice(0, 160) ?? "",
        area: v?.capability_area ?? "",
        subSkill: v?.sub_skill ?? "",
        risk: (v?.risk_level ?? "standard") as RiskLevel,
        ai: v?.generated_by_ai ?? false,
      };
    }),
    permissions: ctx.permissions,
  };
}

export async function getQuestion(userId: string, id: string) {
  const ctx = await requirePermission(userId, "content.read");
  const a = await admin();
  const { data: def } = await a.from("question_definitions").select("*").eq("id", id).eq("organization_id", ctx.orgId).maybeSingle();
  if (!def) fail("Question not found");
  const { data: versions } = await a.from("question_versions").select("*").eq("question_definition_id", id).order("version_number", { ascending: false });
  const vIds = (versions ?? []).map((v) => v.id);
  const [{ data: reviews }, { data: pubs }, { data: flags }] = await Promise.all([
    vIds.length ? a.from("question_reviews").select("*").in("question_version_id", vIds).order("reviewed_at", { ascending: false }) : Promise.resolve({ data: [] }),
    vIds.length ? a.from("question_publications").select("*").in("question_version_id", vIds).order("published_at", { ascending: false }) : Promise.resolve({ data: [] }),
    vIds.length ? a.from("question_flags").select("id, reason, status, created_at").in("question_version_id", vIds) : Promise.resolve({ data: [] }),
  ]);
  const n = await names([def.created_by, ...(versions ?? []).map((v) => v.created_by), ...(reviews ?? []).map((r) => r.reviewer_id)]);
  const reviewers = await eligibleReviewerCount(ctx.orgId);
  return {
    definition: { id: def.id, status: def.current_status as QuestionStatus, statusReason: def.status_reason, createdBy: def.created_by, author: n.get(def.created_by) ?? "Member" },
    versions: (versions ?? []).map((v: VersionRow) => ({
      id: v.id,
      version_number: v.version_number,
      scenario: v.scenario,
      options: v.options as string[],
      correct_index: v.correct_index,
      explanation: v.explanation,
      capability_area: v.capability_area,
      sub_skill: v.sub_skill,
      difficulty: v.difficulty,
      risk_level: v.risk_level as RiskLevel,
      generated_by_ai: v.generated_by_ai,
      sources: (v.source_references as string[]) ?? [],
      validation: (v.validation as { ok?: boolean; issues?: string[] }) ?? {},
      locked: v.locked,
      created_by: v.created_by,
      created_at: v.created_at,
      author: n.get(v.created_by) ?? "Member",
    })),
    reviews: (reviews ?? []).map((r) => ({ id: r.id, decision: r.decision, feedback: r.feedback, reviewedAt: r.reviewed_at, exception: r.single_reviewer_exception, exceptionReason: r.exception_reason, reviewer: n.get(r.reviewer_id) ?? "Reviewer" })),
    publications: (pubs ?? []).map((p) => ({ id: p.id, versionId: p.question_version_id, publishedAt: p.published_at, unpublishedAt: p.unpublished_at })),
    flags: flags ?? [],
    permissions: ctx.permissions,
    me: userId,
    eligibleReviewers: reviewers,
  };
}

async function eligibleReviewerCount(orgId: string) {
  const a = await admin();
  const { data } = await a.from("organization_roles").select("user_id").eq("organization_id", orgId).in("role", ["content_reviewer", "organization_admin"]);
  return new Set((data ?? []).map((r) => r.user_id)).size;
}

export type DraftInput = QuestionInput & { difficulty: "foundation" | "standard" | "advanced"; risk: RiskLevel; sources: string[]; interviewStages: string[] };

function versionPayload(input: DraftInput) {
  const validation = validateQuestion(input);
  const risk = maxRisk(input.risk, suggestedRisk([input.scenario, input.explanation, ...input.options].join(" "), input.capabilityArea));
  return {
    scenario: input.scenario.trim(),
    options: input.options.map((o) => o.trim()),
    correct_index: input.correctIndex,
    explanation: input.explanation.trim(),
    capability_area: input.capabilityArea,
    sub_skill: input.subSkill,
    difficulty: input.difficulty,
    risk_level: risk,
    source_references: input.sources,
    interview_stages: input.interviewStages,
    validation,
  };
}

export async function createDraft(userId: string, input: DraftInput) {
  const ctx = await requirePermission(userId, "content.create");
  const a = await admin();
  const { data: def, error } = await a.from("question_definitions").insert({ organization_id: ctx.orgId, created_by: userId }).select("id").single();
  if (error || !def) fail(error?.message ?? "Could not create question");
  const payload = versionPayload(input);
  await a.from("question_versions").insert({ ...payload, question_definition_id: def.id, version_number: 1, created_by: userId });
  await audit(ctx.orgId, userId, "content.draft_created", "question", def.id, { risk: payload.risk_level, area: input.capabilityArea });
  return { id: def.id, validation: payload.validation };
}

export async function updateDraft(userId: string, id: string, input: DraftInput) {
  const ctx = await requirePermission(userId, "content.edit_draft");
  const a = await admin();
  const { data: def } = await a.from("question_definitions").select("current_status").eq("id", id).eq("organization_id", ctx.orgId).maybeSingle();
  if (!def) fail("Question not found");
  if (!isEditable(def.current_status as QuestionStatus)) fail("Only drafts can be edited. Create a new version instead.");
  const { data: v } = await a.from("question_versions").select("id, locked").eq("question_definition_id", id).order("version_number", { ascending: false }).limit(1).single();
  if (!v || v.locked) fail("This version is locked.");
  const payload = versionPayload(input);
  const { error } = await a.from("question_versions").update(payload).eq("id", v.id);
  if (error) fail(error.message);
  await a.from("question_definitions").update({ updated_at: new Date().toISOString() }).eq("id", id);
  await audit(ctx.orgId, userId, "content.draft_edited", "question", id, {});
  return { validation: payload.validation };
}

const ACTION_PERMISSION: Record<LifecycleAction, Permission> = {
  submit: "content.submit_review",
  approve: "content.approve",
  request_changes: "content.review",
  reject: "content.review",
  publish: "content.publish",
  suspend: "content.suspend_scoring",
  retire: "content.retire",
  revise: "content.edit_draft",
};

export async function questionAction(
  userId: string,
  input: { id: string; action: LifecycleAction; reason?: string | null | undefined; checklist?: Record<string, boolean> | undefined; exceptionReason?: string | null | undefined },
) {
  const ctx = await requirePermission(userId, ACTION_PERMISSION[input.action]);
  const a = await admin();
  const { data: def } = await a.from("question_definitions").select("*").eq("id", input.id).eq("organization_id", ctx.orgId).maybeSingle();
  if (!def) fail("Question not found");
  const t = transition(def.current_status as QuestionStatus, input.action, input.reason);
  if (!t.ok) fail(t.error);
  const { data: v } = await a.from("question_versions").select("*").eq("question_definition_id", input.id).order("version_number", { ascending: false }).limit(1).single();
  if (!v) fail("Question version missing");
  const now = new Date().toISOString();
  let exception = false;

  if (input.action === "submit") {
    const val = validateQuestion({ scenario: v.scenario, options: v.options as string[], correctIndex: v.correct_index, explanation: v.explanation, capabilityArea: v.capability_area, subSkill: v.sub_skill });
    if (!val.ok) fail(`Fix these before submitting: ${val.issues.join(" ")}`);
    await a.from("question_versions").update({ locked: true, validation: val }).eq("id", v.id);
  }
  if (input.action === "approve" || input.action === "request_changes" || input.action === "reject") {
    if (input.action === "approve") {
      if (!checklistComplete(input.checklist ?? {})) fail("Complete every item of the review checklist before approving.");
      const sod = canApprove({
        risk: v.risk_level as RiskLevel,
        reviewerIsAuthor: v.created_by === userId || def.created_by === userId,
        eligibleReviewers: await eligibleReviewerCount(ctx.orgId),
        exceptionReason: input.exceptionReason ?? null,
      });
      if (!sod.ok) fail(sod.error);
      exception = sod.exception;
    }
    await a.from("question_reviews").insert({
      question_version_id: v.id,
      reviewer_id: userId,
      decision: input.action === "approve" ? "approved" : input.action === "reject" ? "rejected" : "changes_requested",
      review_checklist: input.checklist ?? {},
      feedback: input.reason ?? null,
      single_reviewer_exception: exception,
      exception_reason: exception ? input.exceptionReason ?? null : null,
    });
    if (input.action === "request_changes") await a.from("question_versions").update({ locked: false }).eq("id", v.id);
  }
  if (input.action === "publish") {
    await a.from("question_publications").update({ unpublished_at: now }).in("question_version_id", (await a.from("question_versions").select("id").eq("question_definition_id", input.id)).data?.map((x) => x.id) ?? []).is("unpublished_at", null);
    await a.from("question_publications").insert({ question_version_id: v.id, published_by: userId });
  }
  if (input.action === "suspend" || input.action === "retire") {
    await a.from("question_publications").update({ unpublished_at: now }).eq("question_version_id", v.id).is("unpublished_at", null);
  }
  if (input.action === "revise") {
    const { id: _id, created_at: _c, version_number, locked: _l, ...rest } = v;
    await a.from("question_versions").insert({ ...rest, version_number: version_number + 1, locked: false, created_by: userId });
  }
  await a.from("question_definitions").update({ current_status: t.to, status_reason: input.reason ?? null, updated_at: now }).eq("id", input.id);
  await audit(ctx.orgId, userId, `content.${input.action}`, "question", input.id, {
    from: def.current_status,
    to: t.to,
    version: v.version_number,
    risk: v.risk_level,
    single_reviewer_exception: exception,
    reason: input.reason ?? input.exceptionReason ?? null,
  });
  return { status: t.to, exception };
}

/* ---------------- Flags & evidence invalidation ---------------- */

export async function flagQuestion(userId: string, input: { prepQuestionId: string; reason: string; comment?: string | null | undefined }) {
  const a = await admin();
  const { data: q } = await a.from("prep_questions").select("id, prep_session_id, question_version_id").eq("id", input.prepQuestionId).maybeSingle();
  if (!q) fail("Question not found");
  const { data: s } = await a.from("prep_sessions").select("interviewer_id").eq("id", q.prep_session_id).single();
  if (s?.interviewer_id !== userId) fail("You can only flag questions from your own preparation.");
  const ctx = await orgContext(userId);
  const { error } = await a.from("question_flags").upsert(
    {
      organization_id: ctx?.orgId ?? null,
      prep_question_id: q.id,
      question_version_id: q.question_version_id,
      reporter_id: userId,
      reason: input.reason,
      comment: input.comment?.slice(0, 1000) ?? null,
      status: "open",
    },
    { onConflict: "prep_question_id,reporter_id" },
  );
  if (error) fail(error.message);
  await audit(ctx?.orgId ?? null, userId, "question.flagged", "prep_question", q.id, { reason: input.reason });
  return { ok: true };
}

export async function listFlags(userId: string) {
  const ctx = await requirePermission(userId, "question_flags.read");
  const a = await admin();
  const { data } = await a.from("question_flags").select("*").eq("organization_id", ctx.orgId).order("created_at", { ascending: false }).limit(200);
  const qIds = (data ?? []).map((f) => f.prep_question_id).filter(Boolean) as string[];
  const { data: qs } = qIds.length ? await a.from("prep_questions").select("id, scenario, options, correct_index, explanation, capability_area, sub_skill").in("id", qIds) : { data: [] };
  const qm = new Map((qs ?? []).map((q) => [q.id, q]));
  const n = await names((data ?? []).map((f) => f.reporter_id));
  return {
    flags: (data ?? []).map((f) => ({
      id: f.id,
      reason: f.reason,
      comment: f.comment,
      status: f.status,
      createdAt: f.created_at,
      resolutionNote: f.resolution_note,
      reporter: n.get(f.reporter_id) ?? "Participant",
      question: f.prep_question_id ? qm.get(f.prep_question_id) ?? null : null,
    })),
    canResolve: ctx.permissions.includes("question_flags.resolve"),
  };
}

export async function resolveFlag(userId: string, input: { id: string; decision: "under_review" | "dismissed" | "confirmed_invalid" | "fixed"; note: string }) {
  const ctx = await requirePermission(userId, "question_flags.resolve");
  if (input.decision !== "under_review" && input.note.trim().length < 5) fail("Add a resolution note (5+ characters).");
  const a = await admin();
  const { data: f } = await a.from("question_flags").select("*").eq("id", input.id).eq("organization_id", ctx.orgId).maybeSingle();
  if (!f) fail("Flag not found");
  let affected = 0;
  if (input.decision === "confirmed_invalid") {
    if (!ctx.permissions.includes("content.suspend_scoring")) fail("You don't have permission to invalidate evidence.");
    affected = await invalidateEvidence(ctx.orgId, userId, { prepQuestionId: f.prep_question_id, versionId: f.question_version_id, flagId: f.id, reason: input.note });
  }
  const done = input.decision !== "under_review";
  await a.from("question_flags").update({
    status: input.decision,
    resolution_note: input.note || null,
    resolved_by: done ? userId : null,
    resolved_at: done ? new Date().toISOString() : null,
  }).eq("id", f.id);
  // Close sibling flags on the same question when a decision is final.
  if (done && f.prep_question_id)
    await a.from("question_flags").update({ status: input.decision, resolved_by: userId, resolved_at: new Date().toISOString(), resolution_note: input.note }).eq("prep_question_id", f.prep_question_id).in("status", ["open", "under_review"]);
  await audit(ctx.orgId, userId, `flag.${input.decision}`, "question_flag", f.id, { reason: input.note, affected_evidence: affected });
  return { affected };
}

async function invalidateEvidence(orgId: string, userId: string, t: { prepQuestionId: string | null; versionId: string | null; flagId: string | null; reason: string }) {
  const a = await admin();
  let qIds: string[] = t.prepQuestionId ? [t.prepQuestionId] : [];
  if (t.versionId) {
    const { data } = await a.from("prep_questions").select("id").eq("question_version_id", t.versionId);
    qIds = [...new Set([...qIds, ...(data ?? []).map((x) => x.id)])];
  }
  if (!qIds.length) return 0;
  const { data: inv } = await a
    .from("evidence_invalidations")
    .insert({ organization_id: orgId, prep_question_id: t.prepQuestionId, question_version_id: t.versionId, flag_id: t.flagId, reason: t.reason, invalidated_by: userId })
    .select("id")
    .single();
  const { data: rows } = await a
    .from("capability_evidence")
    .update({ invalidated_at: new Date().toISOString(), invalidation_id: inv!.id })
    .in("prep_question_id", qIds)
    .is("invalidated_at", null)
    .select("id");
  const affected = rows?.length ?? 0;
  await a.from("evidence_invalidations").update({ affected_evidence: affected }).eq("id", inv!.id);
  return affected;
}

export async function listInvalidations(userId: string) {
  const ctx = await requirePermission(userId, "question_flags.read");
  const a = await admin();
  const { data } = await a.from("evidence_invalidations").select("*").eq("organization_id", ctx.orgId).order("created_at", { ascending: false }).limit(100);
  return { items: data ?? [], canReverse: ctx.permissions.includes("content.suspend_scoring") };
}

export async function reverseInvalidation(userId: string, input: { id: string; reason: string }) {
  const ctx = await requirePermission(userId, "content.suspend_scoring");
  if (input.reason.trim().length < 5) fail("A reason is required.");
  const a = await admin();
  const { data: inv } = await a.from("evidence_invalidations").select("id, reversed_at").eq("id", input.id).eq("organization_id", ctx.orgId).maybeSingle();
  if (!inv || inv.reversed_at) fail("Invalidation not found or already reversed");
  await a.from("capability_evidence").update({ invalidated_at: null, invalidation_id: null }).eq("invalidation_id", inv.id);
  await a.from("evidence_invalidations").update({ reversed_at: new Date().toISOString(), reversed_by: userId }).eq("id", inv.id);
  await audit(ctx.orgId, userId, "evidence.invalidation_reversed", "evidence_invalidation", inv.id, { reason: input.reason });
  return { ok: true };
}

/* ---------------- Company principles ---------------- */

export async function listPrinciples(userId: string) {
  const ctx = await orgContext(userId);
  if (!ctx) fail("No organization");
  const a = await admin();
  const { data } = await a.from("company_principles").select("*").eq("organization_id", ctx.orgId).order("created_at", { ascending: false });
  return { principles: data ?? [], canManage: ctx.permissions.includes("principles.manage") };
}

export async function savePrinciple(userId: string, input: { principleKey?: string | null | undefined; title: string; body: string }) {
  const ctx = await requirePermission(userId, "principles.manage");
  const a = await admin();
  let version = 1;
  if (input.principleKey) {
    const { data: prev } = await a.from("company_principles").select("id, version_number").eq("organization_id", ctx.orgId).eq("principle_key", input.principleKey).eq("status", "active").maybeSingle();
    if (!prev) fail("Principle not found");
    version = prev.version_number + 1;
    await a.from("company_principles").update({ status: "superseded" }).eq("id", prev.id);
  }
  const { data, error } = await a
    .from("company_principles")
    .insert({ organization_id: ctx.orgId, ...(input.principleKey ? { principle_key: input.principleKey } : {}), version_number: version, title: input.title.trim(), body: input.body.trim(), created_by: userId })
    .select("id, principle_key")
    .single();
  if (error || !data) fail(error?.message ?? "Could not save");
  await audit(ctx.orgId, userId, input.principleKey ? "principle.revised" : "principle.created", "principle", data.principle_key, { version, title: input.title });
  return data;
}

export async function retirePrinciple(userId: string, input: { id: string; reason: string }) {
  const ctx = await requirePermission(userId, "principles.manage");
  if (input.reason.trim().length < 5) fail("A reason is required.");
  const a = await admin();
  await a.from("company_principles").update({ status: "retired" }).eq("id", input.id).eq("organization_id", ctx.orgId);
  await audit(ctx.orgId, userId, "principle.retired", "principle", input.id, { reason: input.reason });
  return { ok: true };
}

/* ---------------- Retention & deletion ---------------- */

export const DEFAULT_RETENTION = { candidate_context_days: 30, attachment_text_days: 7, calendar_details_days: 90, audit_days: 730 };

export async function getRetention(userId: string) {
  const ctx = await requirePermission(userId, "retention.manage");
  const a = await admin();
  const [{ data: policy }, { data: requests }] = await Promise.all([
    a.from("retention_policies").select("*").eq("organization_id", ctx.orgId).maybeSingle(),
    a.from("deletion_requests").select("*").eq("organization_id", ctx.orgId).order("created_at", { ascending: false }).limit(100),
  ]);
  const members = await orgMemberIds(ctx.orgId);
  const { data: interviews } = members.length
    ? await a.from("interview_events").select("id, role_title, interview_stage, starts_at, interviewer_id").in("interviewer_id", members).order("starts_at", { ascending: false }).limit(200)
    : { data: [] };
  const n = await names([...members, ...(requests ?? []).map((r) => r.requested_by)]);
  return {
    policy: { ...DEFAULT_RETENTION, ...(policy ?? {}) },
    requests: (requests ?? []).map((r) => ({ ...r, requester: n.get(r.requested_by) ?? "Member" })),
    interviews: (interviews ?? []).map((i) => ({ id: i.id, label: `${i.role_title} · ${i.interview_stage} · ${i.starts_at.slice(0, 10)}`, interviewer: n.get(i.interviewer_id) ?? "Member" })),
    members: members.map((id) => ({ id, name: n.get(id) ?? "Member" })),
    canDelete: ctx.permissions.includes("deletion.execute"),
  };
}

export async function setRetention(userId: string, input: typeof DEFAULT_RETENTION) {
  const ctx = await requirePermission(userId, "retention.manage");
  const a = await admin();
  const { error } = await a.from("retention_policies").upsert({ organization_id: ctx.orgId, ...input, updated_by: userId, updated_at: new Date().toISOString() });
  if (error) fail(error.message);
  await audit(ctx.orgId, userId, "retention.updated", "retention_policy", ctx.orgId, input);
  return { ok: true };
}

async function orgMemberIds(orgId: string) {
  const a = await admin();
  const { data } = await a.from("organization_roles").select("user_id").eq("organization_id", orgId);
  return [...new Set((data ?? []).map((r) => r.user_id))];
}

export async function createDeletionRequest(userId: string, input: { subjectType: "interview_context" | "participant_account_data"; subjectId: string; reason: string }) {
  const ctx = await requirePermission(userId, "deletion.execute");
  await assertSubjectInOrg(ctx.orgId, input.subjectType, input.subjectId);
  const a = await admin();
  const { data, error } = await a
    .from("deletion_requests")
    .insert({ organization_id: ctx.orgId, requested_by: userId, subject_type: input.subjectType, subject_id: input.subjectId, reason: input.reason })
    .select("id")
    .single();
  if (error || !data) fail(error?.message ?? "Could not create request");
  await audit(ctx.orgId, userId, "deletion.requested", input.subjectType, input.subjectId, { reason: input.reason });
  return data;
}

async function assertSubjectInOrg(orgId: string, type: string, id: string) {
  const members = await orgMemberIds(orgId);
  if (type === "participant_account_data") {
    if (!members.includes(id)) fail("That person isn't in your organization.");
    return;
  }
  const a = await admin();
  const { data } = await a.from("interview_events").select("interviewer_id").eq("id", id).maybeSingle();
  if (!data || !members.includes(data.interviewer_id)) fail("That interview isn't in your organization.");
}

/** Removes candidate context for the given interviews. Keeps de-identified capability evidence. */
async function purgeInterviewContext(interviewIds: string[]) {
  if (!interviewIds.length) return { contexts: 0, attachments: 0, events: 0 };
  const a = await admin();
  const { data: ctxRows } = await a
    .from("interview_contexts")
    .update({ candidate_profile_text: null, job_description_text: null, context_sources: [] })
    .in("interview_event_id", interviewIds)
    .select("id");
  await a.from("interview_events").update({ candidate_display_name: "Candidate (removed)" }).in("id", interviewIds);
  const { data: nce } = await a.from("normalized_calendar_events").select("id").in("linked_interview_event_id", interviewIds);
  const nceIds = (nce ?? []).map((x) => x.id);
  let attachments = 0;
  if (nceIds.length) {
    const { data: att } = await a.from("calendar_event_attachments").select("id").in("normalized_calendar_event_id", nceIds);
    const attIds = (att ?? []).map((x) => x.id);
    if (attIds.length) {
      const { data: del } = await a.from("calendar_attachment_content").delete().in("attachment_id", attIds).select("attachment_id");
      attachments = del?.length ?? 0;
      await a.from("calendar_event_attachments").update({ processing_status: "deleted", approved_for_generation: false, filename: "removed" }).in("id", attIds);
    }
    await a.from("normalized_calendar_events").update({ sanitized_description: null, subject: null }).in("id", nceIds);
  }
  return { contexts: ctxRows?.length ?? 0, attachments, events: nceIds.length };
}

export async function processDeletionRequest(userId: string, input: { id: string; approve: boolean; note?: string | null | undefined }) {
  const ctx = await requirePermission(userId, "deletion.execute");
  const a = await admin();
  const { data: r } = await a.from("deletion_requests").select("*").eq("id", input.id).eq("organization_id", ctx.orgId).maybeSingle();
  if (!r || r.status !== "pending") fail("Request not found or already processed");
  let result: Record<string, unknown> = { note: input.note ?? null };
  if (input.approve) {
    await assertSubjectInOrg(ctx.orgId, r.subject_type, r.subject_id);
    let ids: string[] = [r.subject_id];
    if (r.subject_type === "participant_account_data") {
      const { data } = await a.from("interview_events").select("id").eq("interviewer_id", r.subject_id);
      ids = (data ?? []).map((x) => x.id);
    }
    const purged = await purgeInterviewContext(ids);
    result = { ...result, ...purged, removed: ["candidate profile", "job description", "attachment text", "calendar details", "candidate name"], retained: ["de-identified capability evidence", "preparation completion history"] };
  }
  await a.from("deletion_requests").update({ status: input.approve ? "completed" : "rejected", result: result as never, processed_by: userId, processed_at: new Date().toISOString() }).eq("id", r.id);
  await audit(ctx.orgId, userId, input.approve ? "deletion.completed" : "deletion.rejected", r.subject_type, r.subject_id, {
    contexts: (result["contexts"] as number) ?? 0,
    attachments: (result["attachments"] as number) ?? 0,
  });
  return { result: JSON.parse(JSON.stringify(result)) as { note: string | null; contexts?: number; attachments?: number; events?: number; removed?: string[]; retained?: string[] } };
}

/** Daily retention job across all organizations. */
export async function runRetention() {
  const a = await admin();
  const { data: orgs } = await a.from("organizations").select("id");
  const { data: policies } = await a.from("retention_policies").select("*");
  const pm = new Map((policies ?? []).map((p) => [p.organization_id, p]));
  const totals = { orgs: 0, contexts: 0, attachments: 0, events: 0 };
  for (const o of orgs ?? []) {
    const p = { ...DEFAULT_RETENTION, ...(pm.get(o.id) ?? {}) };
    const members = await orgMemberIds(o.id);
    if (!members.length) continue;
    const cutoff = new Date(Date.now() - p.candidate_context_days * 86_400_000).toISOString();
    const { data: old } = await a.from("interview_events").select("id").in("interviewer_id", members).lt("starts_at", cutoff).neq("candidate_display_name", "Candidate (removed)").limit(500);
    const r = await purgeInterviewContext((old ?? []).map((x) => x.id));
    const calCutoff = new Date(Date.now() - p.calendar_details_days * 86_400_000).toISOString();
    await a.from("normalized_calendar_events").update({ sanitized_description: null }).in("user_id", members).lt("ends_at", calCutoff).not("sanitized_description", "is", null);
    totals.orgs++;
    totals.contexts += r.contexts;
    totals.attachments += r.attachments;
    totals.events += r.events;
    if (r.contexts || r.attachments) await audit(o.id, null, "retention.executed", "organization", o.id, r);
  }
  return totals;
}

/* ---------------- Audit viewer ---------------- */

export async function listAudit(userId: string, input: { action?: string | null | undefined; before?: string | null | undefined }) {
  const ctx = await requirePermission(userId, "audit.read");
  const a = await admin();
  let q = a.from("audit_events").select("*").eq("organization_id", ctx.orgId).order("created_at", { ascending: false }).limit(100);
  if (input.action) q = q.like("action", `${input.action}%`);
  if (input.before) q = q.lt("created_at", input.before);
  const { data } = await q;
  const n = await names((data ?? []).map((e) => e.actor_id).filter(Boolean) as string[]);
  return { events: (data ?? []).map((e) => ({ ...e, actor: e.actor_id ? n.get(e.actor_id) ?? "Member" : "System" })) };
}
