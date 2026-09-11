# Dual-track platform: Recruiter Track + Interviewer Track

Benchmark becomes two parallel training tracks. Interviewer/Hiring Manager training stays exactly as it is today; a new Recruiter track runs alongside it with its own 52-week curriculum, its own groups, its own seats and its own analytics.

## Decisions locked in

- Progress is fully separate per track: each track has its own week counter, streak, XP, level and achievements.
- A person's track is decided by how they were invited. Recruiter invitees see the recruiter track only; manager invitees see the interviewer track only. Solo users pick at signup and can change it.
- A group lead can own one manager group and one recruiter group at the same time.
- Recruiter questions come from the 152-question bank supplied in this conversation (4 options each, with the answer key), mapped to weeks 1–52.

## 1. Track switching

- A segmented control at the top of the hub: Recruiter Track / Interviewer Track. Only shown to people entitled to both; single-track people see their own track with no toggle.
- The chosen track is saved to the person's profile and remembered on next visit; every page (hub, group, analytics, assessments, leaderboard) reads it.

## 2. Recruiter hub view

- No Quick Drill card.
- Renders the 52-week recruiter curriculum, week cards, current week hero, "Did you know?" fact and the same session player.
- Keeps XP, level, current/longest streak, sessions completed, accuracy and achievements — all counted on the recruiter side only.

## 3. Recruiter curriculum content

Four quarters, matching the brief:

- Q1 Intake Calibration & Search Strategy — intake mastery (1–3), Boolean & semantic search (4–6), talent market mapping (7–9), screening frameworks (10–13).
- Q2 Engagement, Outbound & Conversion — cold outreach personalisation (14–17), candidate objections (18–21), candidate experience & ghosting prevention (22–26).
- Q3 Candidate Assessment & Bias Mitigation — behavioural deep dives (27–30), sourcing & screening bias (31–34), technical & skill alignment (35–39).
- Q4 Negotiation, Closing & HM Partnership — pre-closing & anchoring (40–43), salary negotiation & equity (44–47), HM calibration & SLA management (48–52).

Each week gets a topic, focus line, "Did you know?" fact and three questions from the supplied bank, with a written explanation for each correct answer.

## 4. Recruiter groups and seats

- Recruiter groups are separate entities from manager groups. Creating or opening a group while on the recruiter track opens a dedicated Recruiter Group Console.
- Console reads "1/1 recruiter seats used" and the action is "Invite a Recruiter".
- Free tier becomes: 1 admin + 1 manager seat + 1 recruiter seat. This wording is updated everywhere it appears (signup, onboarding, hub, group console, landing copy).
- Analytics stay fully visible on the free tier.
- Pro pricing updated everywhere: EUR 199 / month including 10 hiring manager seats and 5 recruiter seats, then EUR 15 / month per extra manager or recruiter seat.

## 5. Group leaderboard

- Filtered by the active group type, so a recruiter group board only lists recruiters.
- Each member card shows a Recruiter or Manager badge plus level, total XP, current streak, weekly drills completed and average decision accuracy.

## 6. Recruiter analytics

- Hiring Readiness Distribution donut is hidden on the recruiter track.
- Member performance table stays: readiness, combined accuracy, weekly tests, last active — using the same aggregation rules as today, computed from recruiter activity.

## 7. Assessments on the recruiter track

- "Build from Library" and "Build with AI" are hidden.
- Electives tab and custom exercise builders are not rendered.

## Technical notes

- Database: add a `track` dimension (`interviewer` | `recruiter`) to `curriculum_weeks` (composite key with `week_number`), `responses`, `groups`, `invites` and profile-side counters. Because XP/level/streak are per track, per-user progress moves to a `track_progress` table (user, track, total_xp, level, current/longest streak, last completed week/at, unlock anchor date), with existing profile values backfilled into the interviewer row. Profiles gain `active_track` and `allowed_tracks`. Existing rows are stamped `interviewer` so nothing currently in the app changes. All new tables get GRANTs plus RLS mirroring today's group policies.
- Content: new `src/lib/curriculum/recruiter/{q1..q4}.ts` following the existing `WeekQuestions` shape, extended to allow four options; `curriculum_weeks` seeded with recruiter topics/facts via migration.
- Server: `benchmark.server.ts` and `sprints.server.ts` gain a track parameter through loaders, submission, XP award, streak, unlock timing, achievements, leaderboards and analytics; group functions (`create_group`, `accept_invite`, capacity triggers) become track-aware with per-track seat limits.
- UI: track context provider read from profile; hub, admin console, leaderboard, analytics and assessments branch on it. Session and elective routes carry the track so responses land in the right place.
- Weekly unlock emails become per-track so a dual-track user gets the right message for each.

## Delivery order

1. Schema and migration (track columns, `track_progress`, seats, backfill).
2. Recruiter curriculum data files and seeding.
3. Track context, hub switcher and recruiter hub view.
4. Recruiter group console, seat rules and updated free/Pro copy.
5. Leaderboard badges and track filtering.
6. Recruiter analytics and assessments trimming.
7. Tests over the new curriculum data and per-track XP/streak logic.

Given the volume, the recruiter question bank lands in quarter-sized batches.
