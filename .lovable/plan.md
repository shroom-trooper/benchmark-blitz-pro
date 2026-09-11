# Why the track switcher is hidden — and how to fix it

## Diagnosis (confirmed)

The segmented control `[Recruiter Track | Interviewer Track]` exists and is
rendered on the Hub (`TrackSwitch` component), but it deliberately renders
nothing unless your profile is entitled to **both** tracks:

```text
allowedTracks = profiles.allowed_tracks   (e.g. ["interviewer", "recruiter"])
if allowedTracks.length < 2 → show nothing
```

Your account (`abhay.ajitraj@yandex.com`) currently has:

```text
allowed_tracks: [interviewer]     active_track: interviewer
```

The only code path that adds a track to `allowed_tracks` today is **accepting
a group invitation** for that track. There is no self-serve way to unlock the
Recruiter track — not even creating a recruiter group grants it
(`create_group_tracked` never updates `allowed_tracks`). So the switcher
correctly stays hidden; it's an entitlement gap, not a rendering bug.

## Plan

1. **Self-serve track unlock on the Hub.** When a user has only one track,
   replace the (hidden) switcher area with an "Unlock the Recruiter Track"
   card: short pitch + one button calling a new `unlockTrack` server function
   that appends the track to `allowed_tracks`, initializes `track_progress`,
   and switches `active_track`. Idempotent — safe to call twice.
2. **Grant the track on group creation.** Update `create_group_tracked` so a
   lead who creates a recruiter group automatically gets `recruiter` added to
   their own `allowed_tracks` (same for interviewer), so owners can always
   preview the track they administer.
3. **Show the switcher whenever both tracks are held.** No change needed —
   `TrackSwitch` already appears automatically once step 1/2 grants the second
   track, on both `/hub` and `/recruiter`.
4. **Verify.** Typecheck + existing tests, then a browser check: your account
   unlocks the Recruiter track, the segmented control appears on the Hub, and
   switching navigates between `/hub` and `/recruiter`.

## Technical details

- New `unlockTrack` server function in `src/lib/benchmark.functions.ts` +
  handler in `src/lib/recruiter.server.ts` (updates `profiles.allowed_tracks`
  / `active_track`, inserts `track_progress` row for the new track).
- SQL migration altering `public.create_group_tracked` to also upsert the
  track into the owner's `allowed_tracks` (server-only RPC; grants unchanged).
- `src/components/TrackSwitch.tsx` unchanged; new `UnlockTrackCard` component
  rendered on `src/routes/_authenticated/hub.tsx` when `allowedTracks` has
  one entry.
- Existing members invited to recruiter groups are unaffected (invite flow
  already grants the track).
