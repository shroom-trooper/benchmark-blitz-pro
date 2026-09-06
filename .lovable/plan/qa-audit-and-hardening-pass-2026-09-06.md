# QA audit and hardening pass

I ran a first read-only pass over the codebase. Here is what I found and what I propose to fix.

## What already checks out

- All 52 weeks of core content and all 14 elective tracks (52 lessons, 156 questions) are structurally complete: no missing text, no duplicate options, every correct answer points at a real option, no duplicate module or lesson IDs.
- Protected pages sit behind the single sign-in gate, so signed-out visitors get sent to the sign-in page.
- The latest build is clean.

## Confirmed gaps to fix

1. **No automated safety net.** There are no tests at all, so the content above is only correct until someone edits it. I will add a small test suite that fails the build if curriculum or elective data ever breaks, plus tests for the scoring rules (XP, perfect bonus, streak bonus, levels, weekly unlock timing, sprint multipliers).
2. **Pages have no error fallback.** Only the app shell has one. If a single page fails to load its data, the visitor sees a blank screen instead of a readable "couldn't load this, try again" panel. I will add a shared fallback to every data-loading page.
3. **AI test generation can hang.** The request to the AI service has no time limit and no fallback message, and a malformed AI reply is not defensively checked. I will add a time limit with a clear "took too long, try again" message, validate the generated questions before showing them, and make sure the spinner always clears.
4. **Upload edge cases.** Empty briefs, non-PDF files, unreadable/corrupt PDFs and oversized payloads need explicit, friendly messages rather than silent failures. Total size cap stays at 12 MB; per-file type and read errors get their own messages.
5. **Offline / failed saves.** Finishing a session, sprint or assessment while the connection drops currently surfaces a raw error. I will add a retry-aware message so no answer is silently lost, and guard against double submits.
6. **Mobile and contrast pass.** Audit the group console tables, leaderboard, hub, elective and assessment views at phone width: no sideways scrolling of the page itself, tables scroll inside their own container, and low-contrast text in the dark palette gets lifted.

## Technical notes

- Add `vitest` as a dev dependency with `src/lib/__tests__/curriculum.test.ts`, `electives.test.ts`, `gamification.test.ts`; run with `bunx vitest run`.
- Add a shared `RouteError` component and wire `errorComponent` / `notFoundComponent` on each route that has a loader or query.
- Wrap the Lovable AI Gateway call in `src/lib/assessments.server.ts` with `AbortSignal.timeout`, and Zod-validate the parsed `questions` array (scenario/options/correctIndex/explanation) before persisting a draft.
- Client-side file guards in `src/components/AssessmentsTab.tsx`: MIME/extension check, per-file read try/catch, disabled submit while pending.
- No schema or business-logic changes; scoring values stay exactly as they are.

## Deliverable

A summary listing critical fixes, high/medium issues resolved, and the manual checks worth doing afterwards (publish, real PDF upload, a live sprint on a phone).
