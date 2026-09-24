# Phase 1 — Interview Readiness (manual interview → prep → capability evidence)

Reposition Benchmark around the upcoming interview. Everything existing (weekly curriculum, recruiter track, electives, leaderboards, sharing, Quick Drill, badges) stays in the code and database; it is only hidden from the main navigation when the new experience is switched on.

## What participants get
- **Upcoming Interviews** page: list of their interviews (upcoming / past), prep status chip per interview.
- **Add interview** form: date and time, role, candidate display name, stage (preset list or custom), competencies (multi-select + custom), optional responsibility, job description, CV context, company principles.
- **Interview detail**: summary, context completeness, "Start preparation" / "Resume" / "Completed at …".
- **Prep session** (3–5 min): 4–6 scenario questions, one at a time, instant feedback and explanation, capability-area tag on each question. Reuses Quick Drill / weekly session interaction patterns, without timer or arcade effects.
- **Completion screen**: score framed as interviewer readiness (never about the candidate), per-area progress change, any new recognition, calm animation.
- **My Capability** page: four areas (Structured evaluation, Inclusive hiring & bias mitigation, Candidate experience, Decision quality & leadership) with stage, confidence ("Building profile" when evidence is thin), direction, and overall professional level.

## What group owners / TA admins get
New **Interview Readiness** tab in the group console (coaching dashboard, no rankings):
1. **Attention needed** — interviews within 48h with prep not started; members with no prep in 30 days.
2. **Upcoming interviews** — interviewer, role, stage, time, prep status, completed-at. No CV or JD text.
3. **Team capability overview** — each member × four areas: stage or "Building profile", confidence, direction; strongest area and priority development area; preps completed; last prep.
4. **Individual detail** drawer — same, plus prep history (no candidate context).
5. **Team goals** — % of upcoming interviews prepared, members with ≥1 prep this month.

## Navigation and feature flag
- Flag `interview_readiness` (on by default for the interviewer track; can be turned off in one place to restore today's nav).
- When on — participant nav: Interviews, My Capability, Practice (Quick Drill), More (weekly library, electives, leaderboard). Admin nav adds Interview Readiness.

## Technical details

**Migrations (additive only, new file):**
- `interview_events` (group_id, interviewer_id, created_by, source enum manual/calendar/ats, external_event_id unique-when-present per interviewer, external_ats_id, role_title, candidate_display_name, interview_stage, starts_at, duration_minutes, status, timestamps).
- `interview_contexts` (1:1 with event; JD text, candidate text, responsibility, competencies/principles/sources jsonb, completeness score).
- `prep_sessions`, `prep_questions`, `prep_responses`, `capability_evidence` as specified; `prep_sessions.used_fallback` flag added.
- `user_capability_progress` persisted, recalculated server-side after each completion (single tested function, so it can also be recomputed).
- Recognition: reuse `achievements` + `user_achievements` (add `capability_area`, `evidence_snapshot` nullable columns) — no new table.
- Indexes on interviewer_id, group_id, starts_at, interview_event_id, prep_session_id, capability_area, recorded_at.
- GRANTs + RLS: interviewers read/write only their own events, contexts, sessions, questions, responses; `capability_evidence` and `user_capability_progress` are read-own only, written only by server (service role) after verifying answers. Group owners read operational fields and capability progress for members through a security-definer RPC that returns no candidate/JD text; they get no direct SELECT on `interview_contexts`.

**Shared modules (`src/lib/readiness/`):**
- `taxonomy.ts` — capability areas + sub-skills as zod enums.
- `scoring.ts` — weighted score (difficulty weights 1.0/1.25/1.5, recency decay 90-day half-life), confidence thresholds (Low <5 answers, Moderate 5–11, High ≥12), stage thresholds (Emerging → Developing → Proficient → Advanced → Expert requiring both score and evidence count), recent direction (last 5 vs prior), overall level from breadth + confidence (not XP).
- `recognition.ts` — rules: first prep, 5/10 preps, prepared-in-advance ×3, first area at Proficient, all four areas Developing+, perfect prep; idempotent via unique (user, code).
- `selection.ts` — adaptive: bias toward lowest-confidence and priority-development areas, raise difficulty after ≥80% in an area, cover ≥2 areas per session.
- `generator.server.ts` — reuses the assessment-generation AI call (Lovable AI Gateway) with structured context and strict JSON schema + safety instructions (no hire recommendations, no protected-attribute inferences, no invented policy). On failure or invalid output, falls back to curated weekly-library questions tagged by area/sub-skill (week→area mapping per quarter) and records `used_fallback`.

**Server functions (`src/lib/readiness.functions.ts`, all `requireSupabaseAuth`):** listInterviews, createInterview, getInterview, generatePrep, getPrepSession, submitPrepAnswer, completePrep, getMyCapability, getGroupReadiness, getMemberReadiness.

**Routes (under `_authenticated`):** `/interviews`, `/interviews/new`, `/interviews/$id`, `/interviews/$id/prep`, `/capability`; admin tab in existing `/admin`.

**Analytics (PostHog, no candidate/JD/answer text):** interview_created, prep_generated (with fallback flag), prep_started, prep_question_answered, prep_completed, recognition_earned, capability_stage_changed, readiness_dashboard_viewed.

**Tests (Vitest):** taxonomy validation, scoring/confidence/stage/level thresholds, recognition idempotency, adaptive selection, fallback selection, generator output validation, authorization helpers (owner cannot read context, user cannot answer others' sessions). Then typecheck, lint, tests, build, and a Playwright run of the full loop.

**Not in Phase 1:** calendar/ATS sync, scheduled prep delivery emails, recruiter-track readiness, candidate scoring of any kind.

**Deliverable:** closing summary covering all 23 items from the brief (architecture, reuse, migrations, RLS, routes, formulas, thresholds, risks, Phase 2 recommendations).
