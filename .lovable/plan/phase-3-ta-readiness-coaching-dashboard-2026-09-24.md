# Phase 3 — TA Readiness & Coaching Dashboard

## What changes for you
Group owners get a new **Readiness** area in the group console with five tabs: **Overview, Interviews, Capability, People, Program Health**. It shows who has upcoming interviews, who prepared, how strong each capability is, and how much evidence backs every number. It also shows what coaching to do next. It is not a leaderboard. Participants get a clearer personal readiness profile. Existing training, calendar, Gmail, weekly tests, groups and emails keep working unchanged.

## Audit findings (current code) and fixes
- Scoring lives in `src/lib/readiness/scoring.ts` and is reused. Several parts differ from the brief and will be updated in place:
  - Confidence thresholds are 1/5/12; they become Low < 8, Medium 8–19, High ≥ 20.
  - Direction uses "steady" with a one-window compare; it becomes improving / stable / declining / insufficient_data, with a minimum amount of evidence per window and a stability threshold.
  - Development areas are inferred from the lowest score; they become a proper rule requiring Medium confidence and repeats across sessions.
- `getGroupReadiness` currently calculates in memory from raw rows. It will be replaced by the shared analytics module below.
- Check that completing a preparation writes capability evidence, and that cancelled interviews and interviews created after their start time are excluded. Fix the smallest issue if either is broken.

## Canonical definitions (one shared server module)
All metric definitions live in `src/lib/readiness/metrics.ts`, a pure module with tests. The server queries go in `src/lib/readiness/dashboard.server.ts`.
- **Eligible interview:** confirmed, not cancelled, belongs to an active group member (not the owner), created at least 2 hours before its start (a named constant), and starts within the selected period.
- **Preparation coverage** = eligible interviews with a completed preparation ÷ eligible interviews.
- **On-time rate** = eligible interviews whose preparation was completed before the interview starts ÷ eligible interviews.
- **Start rate** = started ÷ delivered; **completion rate** = completed ÷ started.
- **Repeat preparation rate** = interviewers who prepared for 2 or more eligible interviews ÷ interviewers with 2 or more eligible interviews.
- **Current evidence:** evidence recorded within the last 90 days. **Four-area coverage:** at least 8 answers in each of the four areas.
- Every percentage is returned as {numerator, denominator, pct}; the page always shows "39 of 50".

## Scoring, direction, development areas
- **Weighted score** = Σ(correct × difficulty weight × recency decay) ÷ Σ(difficulty weight × recency decay), rounded to 0–100 and capped per sub-skill so one repeated question can't dominate. Recency half-life is 90 days. It never uses candidate outcomes, volume, calendar status or notification opens. A plain-language explanation is shown on the page.
- **Mastery stages:** Building evidence (Low confidence) → Foundation → Practiced → Calibrated → Mastery. Calibrated and Mastery require High confidence.
- **Direction:** compares the last 60 days with the 60 days before. Each window needs at least 5 answers, and a change counts only above 10 points. Otherwise it shows "Not enough comparable evidence".
- **Development areas:** require Medium confidence, a score below 60 (configurable), and misses across 2 or more different preparation sessions, with duplicate questions collapsed. Status is one of emerging / active / improving / resolved / insufficient_evidence, with first-detected and last-confirmed dates. These are calculated on request from the evidence, so no new table is needed.

## Team aggregation and privacy
- **Team score:** the average of *reliable* individual weighted scores (Medium confidence or above). People still building their profile are excluded from the number and reported separately as "N building profile". Each score shows the number of contributing people and the total evidence count.
- **Minimum group size of 3:** team-level metrics with fewer contributors show "Not enough data".
- **Access:** participants see only themselves. Group owners see only members of the groups they own, enforced on the server via the owner check. Platform admins get no extra candidate content. No CV text, Gmail content, calendar descriptions, candidate emails or credentials ever leave the server. Candidate names are not shown in capability history; only role and stage are.

## Adaptive coaching and question selection
- **Coaching recommendation** (explainable, one sentence), prioritized in this order: reliable development area → relevance to the upcoming interview stage → stale evidence → missing coverage → reinforcing a recently improved area. No candidate details appear.
- **Question selection** is updated to a 40/30/20/10 mix (development areas / interview relevance / spaced reinforcement / coverage and calibration). It uses progressive difficulty, avoids near-duplicate questions, and falls back cleanly when there's no history or context. Each question stores a safe `selection_reason`.

## Dashboard pages
- New route `/_authenticated/readiness` with tab sub-routes: `readiness.index` (Overview), `readiness.interviews`, `readiness.capability`, `readiness.capability.$area`, `readiness.people`, `readiness.people.$userId`, `readiness.program`. Linked from the group console and nav for interviewer-group owners.
- **Overview:** Attention Needed items (what, why, who, next action), readiness metrics with denominators, a team capability snapshot, and recent meaningful activity.
- **Interviews:** a filterable, paginated table with the full status set (Needs confirmation … Delivery failed). Cancelled interviews are shown but never counted as missed.
- **Capability:** an accessible heatmap (text plus icon plus color; "Building profile" instead of low scores), sortable and filterable, with a drill-down per area showing sub-skills, the confidence distribution, trend and coaching focus.
- **People:** a searchable directory with default action-priority sort, and an individual profile with sections A–E.
- **Program Health:** the funnel (eligible → generated → delivered → started → completed on time) plus integration, context and attachment success rates.
- The existing `capability.tsx` participant page is upgraded to the same profile component, limited to the participant's own data.
- Charts are limited to the funnel, heatmap, trend and confidence distribution. Each has a text equivalent and follows the existing dark theme.

## Export and analytics
- A CSV export (interview operations, team capability, individual capability) contains no CV, Gmail, candidate email, description or question text. Each export is logged to a new `readiness_exports` table recording who, which type, the date range and when.
- Safe PostHog events via `src/lib/analytics.ts`, for example `ta_dashboard_opened` and `readiness_export_created`. They carry IDs and counts only.

## Technical details
- **Additive migration:** `readiness_exports` table (service_role only, with grants and RLS); `prep_questions.selection_reason` column (nullable); indexes on `capability_evidence(user_id, recorded_at)`, `interview_events(group_id, starts_at)`, `prep_sessions(interview_event_id)` and `notification_deliveries(interview_event_id, status)`. No views or materialized tables for now. Existing RLS is untouched.
- **Queries:** one bounded query per data type per request (interviews, sessions, evidence, deliveries and connections for the group, in the date range, capped at 180 days), aggregated in the pure metrics module. There are no per-cell queries, and lists are paginated. `EXPLAIN` checks run on the main queries.
- **Server functions** in `readiness-dashboard.functions.ts` with `requireSupabaseAuth` plus an owner check; admin-client reads are loaded inside handlers.
- **Tests:** Vitest suites for metrics, scoring, direction, development areas, recommendations, aggregation/suppression, export exclusions and permission helpers; the existing tests stay green. Then typecheck, lint, build, and a Playwright smoke test of the dashboard.
- **Known limitation:** with today's small pilot data, most team metrics will show "Not enough data" or "Building profile". This is by design.
- **Non-goals** as listed in the brief. No legacy features are removed. Weekly-training streaks and leaderboards stay where they are but never appear in the readiness dashboard.
