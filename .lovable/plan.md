# Benchmark — Hiring Capability Platform

A gamified, continuous interview-training platform. Hiring managers complete weekly 3-question micro-simulations; TA admins get a live intelligence layer on organisational hiring readiness.

## What gets built

### Foundation
- Lovable Cloud backend (Postgres + auth + email) for real persistence — no mock data.
- Dark enterprise design system: slate `#0F172A` canvas, indigo `#6366F1` primary/XP, emerald `#10B981` correct/mastery, amber `#F59E0B` streaks/crowns, rose `#EF4444` incorrect/gaps. All as semantic tokens, Lucide icons, motion for counters, progress fills, shake and level-up modals, confetti on completion.
- Sticky top nav: avatar, level badge ("Lvl 4: Bias Slayer"), XP counter, streak flame, and role switcher (Manager view / TA Admin console) for admins only.

### Auth & roles
- Email/password plus Google sign-in; invited managers arrive through a secure emailed magic link that completes account setup.
- Two roles in a separate `user_roles` table (never on profiles): `ta_admin`, `hiring_manager`. All access enforced with row-level security via a security-definer role check.

### Data model
- `profiles` — user, email, name, department, level, total XP, streak, last completed date.
- `departments` — name, created at.
- `curriculum_weeks` — week 1–52, quarter, topic title, "Did You Know?" fact, release status (locked/active/completed).
- `curriculum_questions` — 3 per week: scenario text, 3–4 options, correct option, principle explanation.
- `responses` — one row per manager per week attempt: answers, score, XP earned, completion status, timestamp.
- `invites` — email, department, token, status, sent date.
- `achievements` / `user_achievements` — badge definitions and unlocks.
- `org_settings` — release schedule (e.g. Mondays 08:00) and company config.
- All scoring, XP, streak and level updates happen server-side so the client cannot inflate scores.

### Manager hub
- Onboarding zero-state explaining the leveling ladder (Lvl 1 Novice Evaluator → Lvl 10 Master Bar Raiser) with "Week 1: Ready to Start".
- Player profile bar: level progress, XP, streak, badge showcase.
- Micro-test player: stepper (Did You Know → Q1 initial reaction → Q2 nuance → Q3 rubric), instant emerald/rose feedback with shake, principle explanation, +50 XP per correct answer.
- Mastery recap: confetti, score, +25 streak bonus, animated XP ticker, level-up modal, "View Leaderboard" CTA.
- Leaderboards: company and department tabs, animated top-3 podium, ranked list, monthly league reset countdown.
- Trophy case: streak, flawless-score, topic-mastery and inclusion badges.

### TA admin console
- Setup wizard zero-state: create departments → set weekly release schedule → send invites.
- Invite manager modal: single email or bulk CSV, department assignment, invites table with status and resend.
- Org intelligence: KPI cards (org readiness %, active monthly learners, top capability gap, weekly completion rate), department capability heatmap with risk badges, filterable manager roster with one-click nudge email.
- Curriculum control centre: all 52 weeks grouped by quarter (Q1 structured evaluation, Q2 bias mitigation, Q3 candidate experience, Q4 advanced decision-making), topic inspector to edit the fact, edit the 3 questions, and toggle release status.

### Curriculum content
All 52 weeks authored with real topic titles, facts, and 156 scenario questions written to the quarter themes, loaded as curriculum content (product content, not fake user activity).

## Assumptions (tell me to change any)
- Sign-in: email/password + Google + magic-link invites; enterprise SAML SSO deferred.
- Invite and nudge emails send through Resend — I'll prompt for the API key; until it exists, invite links are copyable in-app.
- ATS integration (training triggered by scheduled interviews) is out of scope for this build; the schema leaves room for it.
- Built in one pass, in the order above, so the manager loop is clickable early.

## Technical notes
TanStack Start with file-based routes, server functions for all scoring, leaderboard aggregation, invites and admin telemetry; protected routes under an authenticated layout; TanStack Query for reads. Public marketing/landing at `/`, manager hub and admin console behind auth. Leaderboard and readiness metrics computed in SQL views for live accuracy.
