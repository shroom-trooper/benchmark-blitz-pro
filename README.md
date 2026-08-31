# Benchmark Brilliance

Build a production-ready, highly gamified B2B web application for continuous hiring capability training ("Benchmark"). This is a live, full-stack web application with persistent database storage where Managers log in to complete weekly 3-question micro-simulations, level up, and compete on leaderboards, while TA Admins manage users, curriculum releases, and organizational telemetry.

DESIGN SYSTEM & BRANDING:

- Dark-mode enterprise UI built with Tailwind CSS and Lucide React icons (Zinc/Slate neutral backgrounds `#0F172A`).

- Vibrant Accent Palette:

  * Primary Violet/Indigo (`#6366F1`) for primary actions, CTA buttons, and XP indicators.

  * Emerald (`#10B981`) for correct choices, high readiness scores, and mastery badges.

  * Amber/Gold (`#F59E0B`) for active streaks (🔥), warnings, and leaderboard crowns.

  * Rose (`#EF4444`) for incorrect choices, score penalties, and capability gaps.

- Smooth Micro-Interactions: Confetti bursts on test completion, animated XP counter tickers, visual progress bar fills, streak flame icons, and tier level unlock modal animations.

- Sticky Top Navigation Bar: Displays user avatar, current level badge (e.g., "Lvl 4: Bias Slayer"), ⚡ total XP counter, 🔥 active streak counter, and a role switcher toggle ("Manager App View" vs "TA Admin Console") visible to admin users.

1. DATABASE, AUTH & SYSTEM ARCHITECTURE (Production Live State):

- Real-time database integration (e.g., Supabase / PostgreSQL) for full persistence across user sessions. No static mock seed data.

- Authentication & RBAC (Role-Based Access Control): Email/Password, Magic Link, and SSO login flows supporting two distinct roles:

  1. `TA_Admin`: Can send invites, configure curriculum release schedules, view global telemetry, and manage departments.

  2. `Hiring_Manager`: Can log in, complete assigned weekly scenario tests, view personal scorecards, and participate in company/department leaderboards.

- Data Schema Requirements:

  * Profiles Table: User ID, Email, Role, Department ID, Current Level, Total XP, Active Streak Count, Last Test Completed Date.

  * Curriculum Table: 52-Week Master Table containing Week Number (1–52), Quarter (Q1–Q4), Topic Title, "Did You Know?" Fact Content, and an array of 3 Scenario Questions (Question Text, Options A/B/C/D, Correct Option ID, Principle Explanation).

  * Responses Table: Records every attempt per manager per week (User ID, Week ID, Answers Selected, Score, XP Earned, Timestamp, Completion Status).

  * Departments Table: Department Name, Department ID, Created At.

- Email Invite Pipeline: Integrated SMTP / Transactional Email service (e.g., Resend, SendGrid) to send secure invitation links to prospective managers.

- Zero-State Experience:

  * Admin View: Empty state setup wizard prompting the admin to (1) Set up company departments, (2) Configure the weekly curriculum release schedule (e.g., Every Monday at 8:00 AM), and (3) Send initial email invites to Hiring Managers.

  * Manager View: Clean onboarding screen introducing the leveling system and displaying "Week 1: Ready to Start" with zero initial XP/streak until the first test is completed.

2. TA ADMIN CONSOLE & SYSTEM MANAGEMENT:

A. User Provisioning & Invite System:

- "Invite Managers" action opening a modal with single-email invite or bulk CSV upload option.

- Invites Table: Email, Department Dropdown, Status (Pending Invite, Active, Inactive), Sent Date, and "Resend Invite Link" CTA.

- Generates a secure magic-link token for invited users to set up their accounts.

B. Org Intelligence Dashboard:

- KPI Cards: Org Readiness Score (0-100% calculated live), Active Monthly Learners Ratio, Top Capability Gap Topic, and Weekly Completion Rate.

- Department Capability Heatmap: Grid view of created departments displaying live proficiency scores, active streak averages, and risk status badges (Low, Medium, High).

- Manager Roster Table: Filterable list showing Manager Name, Email, Department, Current Level, Last Test Date, Active Streak, and a single-click "Send Nudge Email" CTA.

C. Content & Curriculum Control Center:

- 52-Week Master Curriculum View: Displays all 52 topics structured across 4 Quarters:

  * Q1: Foundational & Structured Evaluation (Weeks 1-13)

  * Q2: Inclusive Hiring & Bias Mitigation (Weeks 14-26)

  * Q3: Candidate Experience & Employer Brand (Weeks 27-39)

  * Q4: Advanced Decision-Making & Leadership (Weeks 40-52)

- Topic Inspector Modal: View/edit the "Did You Know?" fact banner, modify the 3-question scenario streams, and toggle week release status (Locked, Active, Completed).

3. MANAGER HUB & GAMIFIED LEARNING ENGINE:

A. Gamification & Engagement Architecture:

- Player Profile Bar: Displays Level Progress Bar (Level 1: Novice Evaluator up to Level 10: Master Bar Raiser), Total XP, Weekly Streak Count (🔥), and Earned Badges Showcase.

- Leaderboard Hub:

  * Global Company Leaderboard & Department Filter tabs.

  * Top 3 Podium View (Gold, Silver, Bronze cards with animated avatars) + Ranked List below showing user position, XP, and active streaks derived from live database calculations.

  * Monthly League Reset Countdown timer to drive recurring retention.

- Achievements & Trophy Case: Unlockable badges for specific accomplishments (e.g., "5-Week Streak", "Neurodiversity Champion", "Flawless Score").

B. Interactive 3-Question Micro-Test Engine:

- Interactive stepper player for the active week's topic:

  * Header Step Indicator: Step 1 ("Did You Know?" Fact) -> Q1 (Initial Reaction) -> Q2 (Nuance & Edge Case) -> Q3 (Rubric & Scoring).

  * Step 1 - Did You Know? Card: High-impact data fact callout box with a "Start Challenge" pulse button.

  * Steps 2–4 - 3-Question Scenario Sequence:

    - Clear scenario context text.

    - 3-4 distinct answer options per question.

    - On click: Immediate visual feedback (Emerald highlight for correct, Rose highlight with shake animation for incorrect).

    - Detailed explanation box revealing the underlying hiring principle.

    - Live XP calculation (+50 XP per correct question).

  * Final Screen - Session Mastery Recap:

    - Confetti animation, final score recap (e.g., 3/3 Correct!), bonus streak multiplier applied (+25 XP Streak Bonus), updated total XP, level-up trigger if XP threshold met, and a "View Leaderboard" CTA.


Intersted in the concept ? here is some detail for you to know

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://benchmark-blitz-pro.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/070ffcc7-e65f-4fa4-9ddc-329ad3739349).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
