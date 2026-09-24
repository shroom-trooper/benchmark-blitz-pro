# Pre-pilot reset, simpler onboarding, role-based navigation

## 1. Reset all previous users (confirmed: live and preview)
- Preview and usebenchmark.app share one database. You confirmed that all 23 accounts get wiped.
- Before deleting anything: export every user-data table to CSV files in Files as a backup, then report the exact counts.
- Disconnect Google Calendar/Gmail connections before deleting their records.
- Delete all test-user data: accounts, sessions, profiles, groups, organizations, roles, invites, calendar data, interviews, preparations, evidence, progress, achievements earned, notifications, sprints, shares, upgrade interest, audit/test analytics.
- Keep: question library, curriculum, electives content, achievement definitions, levels config, migration history, all tables.
- Afterwards, check that every user table is empty and that sign-in, invites and calendar sync all fail for old users.

## 2. Controlled first admin
- Pilot owner email: **hey@usebenchmark.app**. When that email signs up, the server creates the first organization and makes this user its organization admin. This happens only while no organization admin exists.
- Every other self-signup becomes a `participant`. Nobody can pick an admin or reviewer role. Invites give the role and organization they were sent with. Only organization admins can change roles.

## 3. New onboarding (resumable)
The steps are: Welcome, then Name, then How Benchmark works (interview detected or added, then training, then points and levels), then Connect Google Calendar or Add manually, then optional Gmail (can be skipped), then notification timing, then privacy note, then add or confirm your first interview, then Home.
- Removes "Just train me", "Create a group", public display name copy, track choice and weekly curriculum.
- Invitees skip organization setup and join the inviter's organization.
- The current step is saved so users pick up where they left off.

## 4. Where people land after sign-in
- Participant goes to /home. TA admin goes to /readiness. Content reviewer only goes to the review queue. Organization admin goes to /readiness. Users with several roles go to their main work screen and can still reach their own training.
- The server enforces this on every protected page, not just by hiding links.

## 5. Navigation (one central config)
- Participant: Home, Interviews, Progress, Settings.
- TA admin: Readiness, People, Content (if allowed), Admin (if allowed).
- Reviewer: Review queue, Content library, Flagged questions.
- Organization admin: Readiness, People, Content, Admin. Admin holds Members & invitations, Roles, Organization settings, Integrations, Retention & deletion, and Audit log.
- New **Progress** page: training-area progress, points, level, achievements, ranking, recent history.
- Redirect old pages to the right new screen: weekly Hub, recruiter hub, weekly sessions, elective catalogue, public profile, old group console.
- Remove duplicate links, tabs and cards across the header, Home, Readiness, Governance, Admin, Calendar settings and Interviews. Every screen gets one main action and a clear empty state.

## 6. Tests and checks
- Automated tests cover: role routing (single and multiple roles), navigation per role with no duplicates, first-admin bootstrap rules, invite expiry and revocation, blocking access across organizations, onboarding step resume.
- Browser checks cover: signup, onboarding manual path and Gmail skip, mobile menu.
- Then run lint, typecheck and a production build.

## Technical details
- Additive migration: `profiles.onboarding_step`, `profiles.onboarding_completed_at`. The `handle_new_user` trigger gives the participant role and bootstraps the pilot owner (email stored in a server-side settings row, checked against the verified auth email).
- Wipe through a data-change SQL script run in dependency order, plus deletion of auth users through the admin API in a one-off server call. Revoke connector connections first through the existing disconnect path.
- `src/lib/authz/navigation.ts` becomes the single source for nav and landing. `_authenticated` pages check permissions with a shared guard.
- Obsolete routes keep their files but `beforeLoad` redirects.
