# Track access: both tracks for every new account

## Why the switcher isn't showing

The segmented control `[Recruiter Track | Interviewer Track]` is already built
and rendered on the Hub, but it hides itself unless the account is entitled to
both tracks. Your account currently holds only `interviewer`, so it renders
nothing. Today the only way to gain a track is accepting an invite for it —
signing up grants interviewer only. That's the gap.

## Target behaviour

- Every new account gets **both** tracks straight away: Interviewer and
  Recruiter, each with its own week counter, XP, level and streak.
- The Hub switcher appears for everyone, so people can move between tracks.
- Each person can create **one group per track**: one Interviewer group and
  one Recruiter group.
- Each free group has **one seat**: an interviewer group can invite one
  manager, a recruiter group can invite one recruiter.
- **Invited people are single-track**: accepting a recruiter invite grants the
  recruiter track only; accepting an interviewer invite grants interviewer
  only. No switcher for them.

## Plan

1. **Grant both tracks at signup.** New profiles get
   `allowed_tracks = [interviewer, recruiter]` with interviewer active, and a
   progress row for each track created on first use. Existing solo accounts
   (people who own a group or belong to none) are backfilled to both tracks;
   accounts that joined via an invite keep their single invited track.
2. **Invites stay single-track.** Invite acceptance keeps granting exactly the
   invited track and does not add the second one. An invited member never sees
   the switcher.
3. **One group per track, one seat each.** Group creation is already scoped per
   track; confirm the seat limit is 1 for both and that the console labels read
   "Invite a manager" on the interviewer track and "Invite a recruiter" on the
   recruiter track, with matching seat counters.
4. **Switcher visibility.** No component change — once both tracks are granted
   the control appears automatically on `/hub` and `/recruiter`.
5. **Verify.** Typecheck plus existing tests, then a browser pass: a fresh
   account sees both tracks and can switch; your account sees the switcher
   after the backfill; an invited member sees only their track.

## Technical details

- Migration: update `handle_new_user()` to set
  `allowed_tracks = ARRAY['interviewer','recruiter']`; change the profiles
  column default to match. Backfill `allowed_tracks` for existing profiles
  that own a group or have no `group_id`, leaving invited members untouched.
- `accept_invite` / the tracked invite path continues to set
  `allowed_tracks` to the invited track only — no widening.
- `create_group_tracked` already enforces one group per track and
  `member_limit = 1`; verify and leave as is.
- Recruiter progress rows are created lazily in `recruiter.server.ts` on first
  recruiter visit, so no bulk `track_progress` seeding is needed.
- Group console copy in `src/routes/_authenticated/admin.tsx` becomes
  track-aware for the invite button and seat text.
