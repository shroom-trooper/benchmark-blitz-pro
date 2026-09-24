# Phase 4: Governance, Roles and Trust

Phase 4 adds roles, content review, question flags, evidence correction, audit logs, retention and deletion controls on top of Phases 1–3. Every database change is additive. Existing preparation, calendar/Gmail, dashboards, curriculum, sprints and leaderboards keep working.

## Key decision: organizations
Benchmark has no organizations today. Each group owner automatically gets one organization and becomes its **Organization admin**. Their interviewer and recruiter groups belong to that organization, and existing members become **Participants**. No one has to set anything up again, and access stays the same until an admin grants a new role.

## What users will see

**Organization admins** get a new **Governance** section with these pages:
- **Roles:** list members, grant or remove TA admin and Content reviewer. You can't remove the last organization admin without handing over first. You can't grant a role you don't hold.
- **Content library:** questions organized by status (Draft, In review, Changes requested, Approved, Published, Suspended, Retired, Rejected). Each question has version history, a risk level and where it came from.
- **Review queue:** a structured checklist covering evidence quality, capability mapping, bias and fairness, candidate experience, privacy, and explanation quality. The reviewer approves, rejects or requests changes, and must give a reason where required.
- **Flags:** questions participants reported, with actions to resolve them or send them for evidence review.
- **Company principles:** versioned principles that questions can cite.
- **Retention and deletion:** set how long candidate context, attachment text and calendar details are kept. Handle deletion requests, and show what was removed versus kept (anonymized skill evidence).
- **Audit log:** who changed roles, content, settings, retention and deletions. It is read-only, filterable, and never contains candidate or email content.

**TA admins** keep the Readiness dashboard and group management. They can write draft questions and submit them for review, but can't approve their own.

**Content reviewers** can review, publish, suspend and retire questions.

**Participants** get a "Flag this question" option during preparation, with reasons: unclear, incorrect, biased, inappropriate, or other.

## Rules enforced on the server
- One permission module maps roles to permissions (the list in the brief). Every sensitive server action checks a permission, not a role name, and the database checks the organization boundary.
- Separation of duties: authors can't approve their own elevated or high-risk content. An organization with only one admin gets a recorded single-reviewer exception with a reason, allowed for standard and elevated content but never high-risk.
- Published versions can't be changed. Editing creates a new draft version. Suspending, retiring and rejecting all require a reason.
- AI-generated questions store safe provenance only (generator version, requested skill, types of context used, validation results) and never become library content without review.
- Automated validation runs before any question counts toward scores: 4 options, one correct answer, a valid skill tag, no emails, phone numbers or links, and no prompt-injection text.
- **Evidence correction:** when a reviewer confirms a question is invalid, its evidence is marked invalid instead of deleted. Scores, development areas and the Readiness dashboard ignore invalid evidence. A flagged-but-unconfirmed question can't create a new development area on its own. Admins can never edit scores directly.
- **Candidate context:** only the assigned interviewer, and TA admins with explicit access, can see it. A daily job enforces retention. Deletion removes candidate details and keeps anonymized skill evidence.
- **Internal support access** stays outside organization roles: time-limited, requires a reason, and is always audited. It is a database table and check only, with no customer-facing screen.

## Out of scope
New integrations (ATS, Slack, Teams), scoring or ranking candidates, and a Benchmark-wide platform review screen. The core-content table structure is included but has no editing screen.

## Technical details
- **New tables:** `organizations`, `organization_members`, `organization_roles` (enum `org_role`: participant, ta_admin, content_reviewer, organization_admin), `question_definitions`, `question_versions`, `question_reviews`, `question_publications`, `question_flags`, `evidence_invalidations`, `company_principles` (versioned), `retention_policies`, `deletion_requests`, `audit_events` (append-only, with UPDATE/DELETE blocked by trigger), `support_access_grants`.
- **Additive columns:** `groups.organization_id`, `prep_questions.question_version_id`, `prep_questions.provenance` jsonb, `capability_evidence.invalidated_at`/`invalidation_id`.
- **Backfill:** one organization per group owner; owner becomes organization_admin; members become participants.
- **Permission helpers:** `has_org_permission(_user, _org, _perm)` (security definer) for RLS. In code, `src/lib/authz/permissions.ts` holds the role→permission map, and `requirePermission()` wraps it for server functions. Each new table gets GRANTs and RLS scoped to organization membership plus permission, and audit/support tables are server-only.
- **Existing code:** scoring, development areas and the Phase 3 dashboard filter out `invalidated_at is null` evidence. The generator records provenance and runs validation. Group-owner checks in admin server functions are replaced with permission checks, with the same result for current owners.
- **Server functions:** `governance.functions.ts` covers roles, content, reviews, flags, principles, retention, deletion and audit. The retention cron is a `/api/public/cron/retention` route using the existing cron token.
- **Routes:** `/governance` (index, roles, content, content/$id, review, flags, principles, retention, audit), plus a flag dialog in `prep.$sessionId`.
- **Tests:** the permission matrix, separation of duties, single-admin exception, last-admin protection, lifecycle transitions, immutable versions, validation rules, evidence invalidation effects on scoring, retention and deletion effects, and checks that audit logs and exports contain no private data. Then typecheck, lint and build.
