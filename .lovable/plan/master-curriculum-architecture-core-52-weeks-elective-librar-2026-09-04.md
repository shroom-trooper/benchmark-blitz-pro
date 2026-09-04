# Master Curriculum Architecture: Core 52 Weeks + Elective Library

Build the full two-tier curriculum into Benchmark: rewrite the 52-week universal pathway to the new quarterly themes, and add a 14-module elective extension library that group leads can assign, with hand-written questions for every lesson.

## Part 1 — Core 52-week curriculum

Rewrite all 52 weekly topics, focus summaries and "Did you know?" facts to the new themes:

- Q1 (1–13) Interview Fundamentals & Evidence Capture
- Q2 (14–26) Bias Mitigation & Fair Evaluation
- Q3 (27–39) Candidate Experience & Employer Brand
- Q4 (40–52) Strategic Talent Leadership & Advanced Decision-Making

Weeks 13, 26, 39 and 52 become capstone sessions that pull the whole quarter together. Each week keeps the existing 3-question format; questions are rewritten where the new topic no longer matches the old one. Existing member progress and XP stay intact — week numbers do not change.

## Part 2 — Elective extension library

14 modules across 4 categories, each with title, target audience, learning objectives, lesson-by-lesson breakdown and the signal/artifact it produces:

- Functional tracks (4 lessons each): Engineering & Technical Assessment; Product & Design Signal Extraction; GTM & Revenue Hiring; Executive & Senior Leadership Vetting.
- Operational & contextual (4 each): Startup & High-Growth Speed Hiring; Async & Distributed Assessment; Early-Career & Internal Mobility; Cross-Functional & Culture-Add Alignment.
- Manager & panel playbooks (4 each): Job Spec & Loop Architecture; Debrief Moderation & Consensus; Offer Structuring & Closing; Hiring Analytics & Panel Accuracy Auditing.
- Compliance guardrails (2 each): Global Employment Law & Protected Questions; Cross-Cultural & Non-Native Candidate Evaluation.

That is 52 elective lessons, each with 3 hand-written scenario questions (156 total), never repeating core mechanics already covered in the 52 weeks.

## How electives work in the app

- Members see an "Electives" area in the hub: modules grouped by category, each showing audience, objectives, lesson list and the artifact produced.
- Group leads can enable specific modules for their group, so members see a focused shortlist rather than all 14.
- Lessons play through the existing session player (3 questions, instant feedback, explanation).
- Elective lessons award XP and count towards level, but do not affect the weekly streak — the streak stays tied to the weekly habit.
- Admin analytics gains elective completion per member alongside weekly and custom tests.

## Delivery order

1. Database: elective module, lesson, group-enablement and response tables with access rules; seed all 14 modules and 52 lessons.
2. Content: new 52-week core topics/facts/questions, then all elective lesson questions.
3. Member UI: elective catalogue, module detail, lesson player, completion recap.
4. Lead UI: enable/disable modules for the group, elective progress in Analytics.
5. Also export the whole architecture as a readable master curriculum document in the project for sharing.

## Technical notes

New tables `elective_modules`, `elective_lessons`, `elective_questions`, `group_elective_modules`, `elective_responses` with grants and RLS (published modules readable to authenticated users; enablement writable by group owner; responses insert/select own, readable by group owner). Content seeded through migrations plus typed files under `src/lib/curriculum/` mirroring the existing q1–q4 pattern. Server logic extends `src/lib/benchmark.server.ts` (scoring, XP, analytics) and new routes `/_authenticated/electives` and `/_authenticated/elective.$lessonId`. Given volume, content lands in several batches: core weeks first, then one elective category per batch.
