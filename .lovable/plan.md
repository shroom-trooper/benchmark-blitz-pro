# Separate leaderboard for recruiter scores

Today the leaderboard page ranks everyone on their interviewer scores only. Recruiter XP, levels and streaks are tracked separately, so they need their own board.

## What changes

The leaderboard page gets two boards instead of one:

- **Interviewer** — exactly what exists today (global ranking plus the group board, if the person leads or belongs to an interviewer group).
- **Recruiter** — the same layout, ranked on recruiter XP, level and streak, plus the recruiter group board when the person has a recruiter group.

Tabs across the top: Interviewer · Recruiter, and inside each, the global list and (where relevant) that group's list.

Rules kept the same as today:
- Only people with recruiter activity (XP above zero) appear on the recruiter board.
- Group leads administer and are not ranked among their members.
- Names shown are display names only; no emails.
- Signed-out visitors can see both global boards; group boards need sign-in.

## Technical notes

- New database functions mirroring the existing ones, reading `track_progress` filtered to `track = 'recruiter'` joined to `profiles` for display name: `get_public_recruiter_leaderboard()` and `get_group_recruiter_leaderboard(_actor uuid)`. Both `SECURITY DEFINER`, safe columns only, execute revoked from browser roles like the existing pair.
- The group variant resolves the actor's recruiter group (owned or member) rather than the profile's single `group_id`, so a dual-track lead sees the recruiter roster.
- New server functions in `src/lib/benchmark.functions.ts`: `getPublicRecruiterLeaderboard` (public, admin client, same shape as `getPublicLeaderboard`) and `getRecruiterGroupLeaderboard` (auth middleware, delegating to a `loadRecruiterGroupLeaderboard` helper in `src/lib/recruiter.server.ts` that reuses the ranking/owner-exclusion logic).
- `src/routes/leaderboard.tsx` becomes track-aware: outer tabs for Interviewer/Recruiter, existing `Row`/`RankBadge` reused, recruiter level titles via `levelProgressIn("recruiter", xp)` so recruiter rank titles match the recruiter ladder. Recruiter queries are enabled lazily when that tab is opened.
- Level titles: interviewer board keeps `levelForXp`; recruiter board uses the recruiter ladder from `src/lib/gamification.ts`.
- Add tests over recruiter ranking/owner exclusion alongside the existing Vitest suite.
