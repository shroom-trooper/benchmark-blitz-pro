# Fix: elective lessons never open from the catalogue

## Problem

Clicking a lesson on `/electives` changes the URL (e.g. `/electives/engineering-technical-assessment/eng-1-defining-the-bar`) but the page still shows the catalogue — there is no way to start, answer, or complete a lesson. Loading the lesson URL directly shows the catalogue too.

## Root cause (confirmed)

The lesson page file `src/routes/_authenticated/electives.$module.$lesson.tsx` is nested **under** the catalogue page `src/routes/_authenticated/electives.tsx` (dot-based file nesting). The catalogue component never renders an `<Outlet />`, so TanStack Router swallows the child lesson route and only the parent catalogue renders. Route registration itself is correct — this is purely the missing outlet/layout split.

## Fix

1. Convert `src/routes/_authenticated/electives.tsx` into a thin parent layout that renders only `<Outlet />` inside `AppShell`.
2. Move the current catalogue UI into a new `src/routes/_authenticated/electives.index.tsx` (path stays `/electives`; head metadata moves with it).
3. The lesson page `electives.$module.$lesson.tsx` stays as-is — it now renders through the outlet.
4. Verify all `Link to="/electives/$module/$lesson"` references still resolve (catalogue list items; no path changes needed).

## Verification

- Playwright: sign in, open `/electives`, click a lesson, confirm scenarios render, select answers, submit, confirm score/XP completion screen and catalogue checkmarks update.
- Confirm direct load of a lesson URL works.
- Typecheck + build green.
