# Rename "Telemetry" to "Analytics" and add a member performance table

## What changes

1. **Wording**: every "Telemetry" label becomes "Analytics" — the tab in the group console, the page description ("Manage your training group and see capability analytics"), and any nearby copy.

2. **New "Member performance" table** at the top of the Analytics tab, one row per person in the group:
   - Name (with "you" marker for the owner)
   - Email
   - Sessions completed (e.g. "4 of 12 released")
   - Average score (out of 3, plus accuracy %)
   - Last training (relative, e.g. "3 days ago", or "Never")
   - A subtle "Dormant" badge when they have never trained or haven't trained in the current week

   Sortable-by-default on average score descending, with a clear empty state when the group has no members yet.

3. The existing accuracy-by-week chart and "Weakest capability areas" panel stay, below the new table.

4. The Team tab keeps invite/remove management; the per-member stats line there stays as-is so the two tabs don't duplicate work.

## Technical notes

- `loadGroupConsole` in `src/lib/benchmark.server.ts` already returns per-user `name`, `email`, `completions`, `level`, `totalXp`, `streak`, `lastCompletedAt`. It needs two extra derived fields per user: `avgScore` (mean of that user's `responses.score`) and `accuracy` (`avgScore / 3` as a percent), computed from the already-fetched `rows`. Also return `releasedWeeks` (count of weeks up to `current_week`) so "4 of 12" can be shown.
- UI work is in `src/routes/_authenticated/admin.tsx`: rename the tab value/label, add a `MemberAnalytics` table component inside the Analytics tab.
- Relative dates via a small local formatter (no new dependency).
- No database or schema changes.
