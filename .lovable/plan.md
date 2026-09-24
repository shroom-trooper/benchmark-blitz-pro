# Phase 5: Consolidate Benchmark into an interview-readiness product

Delivered in two stages. Nothing is deleted from the database; old features are hidden, redirected, or stopped.

## Decisions already made
- Recruiter-only members get the same interview-prep home as everyone else. Their recruiter progress stays saved but is no longer shown.
- Old public profile links and the public leaderboard send visitors to the homepage.

## Stage 1: Navigation, home, retiring old features, landing page

**Navigation that follows permissions**
- One central list of menu items, each tied to a permission from the existing Phase 4 permission matrix.
- Participant: Home, Interviews, My capability, Calendar, Settings.
- TA admin: Readiness, Interviews, People, Team capability, Program health, Content (when allowed), Settings.
- Content reviewer: Content library, Review queue, Flagged questions, Principles (when allowed).
- Organization admin: all of the above, plus Access, Retention and deletion, Audit log, Integrations.
- Remove XP bar, streak flame, level title, Practice/Hub, Leaderboard, Group, and track switch from the header.

**New participant home (`/home`)**
- Next interview with its preparation status and a start button.
- Calendar interviews waiting for confirmation.
- When preparation is due.
- Recommended coaching focus (from Phase 3 development areas).
- Capability snapshot with confidence levels.
- Recent preparations.
- Meaningful recognition (Phase 1). No XP or streaks.
- Empty state: "Add your first interview" and "Connect your calendar".
- After sign-in, participants land on `/home` and TA admins land on `/readiness`.

**Practice repositioned**
- Quick Drill logic stays, but it only appears as an optional "Practice a capability" button from My capability, linked to a development area. No timer badges, XP, or streak multipliers are shown.

**Old features retired (hidden or redirected, data kept)**
- `/hub`, `/recruiter`, `/recruiter/session/*`, `/session/*`, `/electives/*`: redirect to `/home`.
- `/leaderboard`, `/p/$slug`: redirect to `/`. The share-card image endpoint returns a neutral image. Share and XP-bonus actions are turned off on the server.
- `/admin` (group console) redirects to `/readiness`, or to Access for organization admins. Invitations move to Access in Stage 2. Until then, the invite panel is reachable from Access.
- The weekly-unlock job returns "disabled" without sending anything. Its schedule is removed in a new migration. The email template stays but is never used.
- The sitemap drops the retired routes.

**Landing page and copy**
- Rewrite `/` around the interview flow: detect or add an interview, confirm the context, get focused preparation, build capability evidence, get coaching focus, and give TA privacy-safe visibility.
- Remove copy about weekly curriculum, leaderboards, streaks, XP, and recruiter tracks. Update page titles and descriptions for every public page. Keep the Pro contact form but reword it for organizations.

**Analytics cleanup**
- Stop sending events for retired features. Rename events to interview terms. Check that no event includes candidate, CV, Gmail, or calendar text.

## Stage 2: Onboarding, governance, question selection, retention

- **Onboarding:** personal details, team context, role in hiring, calendar connection, optional Gmail, preparation timing, privacy explanation, first interview. Invitees skip team creation.
- **Access management:** members, invitations, role grants, and removal, all in one Access page. This replaces the old group console. Last-admin protection stays.
- **Content governance:** finish the gaps in the Phase 4 screens (version comparison, bulk review, better filters, clearer empty states). Flags gain more reasons and a resolution history.
- **Governed questions in preparation:** when preparation is generated, the app first picks published question versions that match the organization, capability and sub-skill, interview stage, and role family. It skips suspended, retired, or unsafe versions. It saves the exact version used and the principle version. Any remaining slots are filled with validated, session-only generated questions.
- **Retention, deletion, and audit:** clearer policy editor, deletion requests with status and confirmation, and an audit viewer with filters, date range, and CSV export (no private content).
- **Tests:** permission-based navigation, redirects, weekly job disabled, question selection and fallback, suspended versions excluded, candidate-context blocking. Then lint, typecheck, and a production build.
- **Final report:** covers all 33 deliverables from the brief, including a list of inactive old tables and code kept for a later cleanup.

## Technical details
- Nav config lives in `src/lib/authz/navigation.ts` and uses `permissionsFor()`. `getMe` returns effective org permissions, so the client never checks role names.
- Redirects use `beforeLoad` + `redirect()` in the existing route files, so old URLs keep resolving.
- Migration (additive): `cron.unschedule('weekly-unlock')`. Later migrations will add the question-selection index on `question_versions (status, capability, stage)`. No table drops and no RLS loosening.
- The weekly-unlock route handler returns early, so even a stray scheduler call cannot send.
- Selection lives in `src/lib/governance/selection.ts` (pure and tested), and `readiness.server.ts` generation calls it.
