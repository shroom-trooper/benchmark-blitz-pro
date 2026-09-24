/**
 * Central authorization module. Components and server functions check permissions,
 * never role names. Must stay in sync with public.org_role_permissions() in the database.
 */
export const ORG_ROLES = ["participant", "ta_admin", "content_reviewer", "organization_admin"] as const;
export type OrgRole = (typeof ORG_ROLES)[number];

export const ROLE_LABELS: Record<OrgRole, string> = {
  participant: "Participant",
  ta_admin: "TA admin",
  content_reviewer: "Content reviewer",
  organization_admin: "Organization admin",
};

const PARTICIPANT = [
  "interviews.read_own",
  "preparation.complete_own",
  "preparation.read_own",
  "capability.read_own",
  "questions.flag",
] as const;
const TA_ADMIN = [
  "interviews.read_team",
  "interviews.manage_team",
  "preparation.read_team_status",
  "capability.read_team",
  "capability.export_team",
  "members.read",
  "members.manage",
  "content.create",
  "content.edit_draft",
  "content.submit_review",
  "content.read",
  "integrations.view_health",
  "exports.create",
  "question_flags.read",
] as const;
const REVIEWER = [
  "content.read",
  "content.review",
  "content.approve",
  "content.publish",
  "content.retire",
  "content.suspend_scoring",
  "question_flags.read",
  "question_flags.resolve",
] as const;
const ORG_ADMIN_ONLY = [
  "roles.assign",
  "principles.manage",
  "integrations.manage",
  "retention.manage",
  "deletion.execute",
  "audit.read",
  "organization.manage",
] as const;

export type Permission =
  | (typeof PARTICIPANT)[number]
  | (typeof TA_ADMIN)[number]
  | (typeof REVIEWER)[number]
  | (typeof ORG_ADMIN_ONLY)[number];

export const ROLE_PERMISSIONS: Record<OrgRole, readonly Permission[]> = {
  participant: PARTICIPANT,
  ta_admin: TA_ADMIN,
  content_reviewer: REVIEWER,
  organization_admin: [...new Set<Permission>([...ORG_ADMIN_ONLY, ...TA_ADMIN, ...REVIEWER])],
};

export function permissionsFor(roles: readonly OrgRole[]): Set<Permission> {
  const out = new Set<Permission>();
  for (const r of roles) for (const p of ROLE_PERMISSIONS[r] ?? []) out.add(p);
  return out;
}

export const can = (roles: readonly OrgRole[], perm: Permission) => permissionsFor(roles).has(perm);

/** Roles an actor may grant. Only organization admins assign roles; nobody grants beyond their own. */
export function assignableRoles(actorRoles: readonly OrgRole[]): OrgRole[] {
  if (!can(actorRoles, "roles.assign")) return [];
  return ORG_ROLES.filter((r) => actorRoles.includes("organization_admin") || actorRoles.includes(r));
}

/** Blocks removing the final organization admin. */
export function canRemoveRole(args: { role: OrgRole; adminCount: number }): { ok: true } | { ok: false; reason: string } {
  if (args.role === "organization_admin" && args.adminCount <= 1)
    return { ok: false, reason: "Assign another organization admin before removing the last one." };
  return { ok: true };
}
