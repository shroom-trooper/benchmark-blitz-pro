# Send recruiter-only members to the recruiter hub

## What is happening

Signing in always lands people on the interviewer hub, no matter which track they belong to. A recruiter-only member who clicks a magic link is dropped on the interviewer page ("Novice Interviewer", interviewer week 1, elective tracks), because:

- The sign-in screen navigates everyone to `/hub` after a session is established.
- `/hub` itself has no track check, so it happily renders interviewer content for a recruiter-only member.
- The top navigation "Hub" link always points at the interviewer hub.

The accept-invite screen does route by track, but that only applies on the very first acceptance — later sign-ins bypass it.

## The fix

1. After any successful sign-in (password, magic link, existing session on page load), read the person's track and send them to the recruiter hub when recruiter is their track, otherwise the interviewer hub.
2. Guard the interviewer hub: if the signed-in person is not entitled to the interviewer track, redirect to the recruiter hub. Mirror the same guard on the recruiter hub for interviewer-only members.
3. Make the "Hub" navigation link point to the hub for the person's active track, so recruiter-only members never see an interviewer link.

People entitled to both tracks (self-signups) are unaffected — they keep landing on the interviewer hub with the track switcher.

## Technical notes

- Add a small public/authenticated server fn (or reuse the existing profile fetch in `src/lib/recruiter.server.ts` / `benchmark.functions`) returning `allowedTracks` + `activeTrack`.
- `src/routes/auth.tsx`: replace both `navigate({ to: "/hub" })` calls with a track-aware destination resolved after the session exists.
- `src/routes/_authenticated/hub.tsx` and `recruiter.index.tsx`: redirect when the track is not allowed (client-side, after the me-query resolves, to avoid SSR/session issues).
- `src/components/AppShell.tsx`: derive the Hub link target from `useMe().activeTrack`.
