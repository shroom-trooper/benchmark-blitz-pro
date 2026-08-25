# Custom group assessments + AI-generated tests

Group leads get a builder for their own assessments: mix themes from the 52-week library, set a target question count and rough duration, or upload a PDF / paste their own TA principles and let AI draft the questions. Every generated test lands as a draft the lead can edit before publishing to their group.

## What group members see

A new "Group assessments" section on the hub, separate from the weekly programme. Each published assessment shows its title, question count and estimated duration. Completing one awards full XP toward level and the group leaderboard, but does not touch the weekly streak (and does not affect the public weekly leaderboard).

## What the group lead gets

New "Assessments" tab in the Group Console with:

- **List view** — drafts and published assessments, question counts, how many members completed each, average score.
- **Build from library** — pick one or more themes/quarters, set a target number of questions and an estimated minutes-per-question, see the projected duration update live, then generate a draft by sampling questions from the chosen themes.
- **Build with AI** — upload one or more PDFs and/or paste text (company TA principles, process docs, a topic brief), set the target question count, and AI drafts scenario questions grounded in that material.
- **Review & edit** — every draft opens in an editor: reorder, delete or rewrite scenarios, options, correct answer and explanation. Publish when happy; unpublish returns it to draft.
- **Results** — per-member scores for each published assessment, feeding into the existing Analytics tab.

## Data model

New tables (all with grants + RLS, group-scoped):

- `assessments` — id, group_id, created_by, title, description, source (`library` | `ai` | `manual`), target_questions, estimated_minutes, status (`draft` | `published`), timestamps.
- `assessment_questions` — assessment_id, position, scenario, options (jsonb), correct_index, explanation.
- `assessment_responses` — assessment_id, user_id, answers (jsonb), score, xp_earned, completed_at; unique per user+assessment.

Policies: group owner has full write on their group's assessments and questions; group members can read only `published` assessments (and read questions only through the take-flow), and insert their own responses. Owner can read all responses for their group.

## AI generation

- Upload goes to a private `assessment-sources` storage bucket, owner-scoped.
- A server function extracts the document, sends it to the Lovable AI gateway with a strict JSON schema (array of `{scenario, options[3], correctIndex, explanation}`), and writes the result as draft questions. Pasted text follows the same path with no upload.
- Generation is bounded by the target question count; the lead is told when the source material is too thin to reach it.
- Failures surface the real error (credits, rate limit, unreadable file) rather than a silent empty draft.

## Technical notes

- All logic in `src/lib/benchmark.server.ts` + `benchmark.functions.ts`, following the existing `requireGroupOwner` pattern; no edge functions.
- PDF text extraction and generation run inside a `createServerFn` handler; PDFs are sent to the model as base64 file parts so scanned-but-text-layered docs still work.
- XP reuses `computeXp` with a zero streak bonus, so levels stay consistent; streak fields on `profiles` are untouched.
- New routes: `/_authenticated/assessment/$id` (take flow, mirroring the weekly session UI) and assessment management inside the existing `/admin` tab set.
- Free-tier limits stay as they are; assessments are capped at a sane max (e.g. 25 questions) to keep generation cost and session length reasonable.
