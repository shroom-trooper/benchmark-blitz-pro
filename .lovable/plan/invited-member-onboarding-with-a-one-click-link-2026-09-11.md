# Invited-member onboarding with a one-click link

## Goal
When someone is invited to a group, clicking the link in their email signs them straight in, puts them in that group, and limits them to the single track they were invited to — no password, no account-type choice, and no ability to run their own group.

## What changes for the invited person
1. The invite email button points at a new page carrying a private invite code instead of the generic sign-in page.
2. That page checks the code. If the invitation is still open, it emails a one-click sign-in link to the invited address (same address the invite was sent to), and shows a short "check your inbox" screen.
3. Clicking that sign-in link brings them back to the invite page, already signed in. The invitation is accepted automatically: they join the group, get access only to the invited track (interviewer or recruiter), and they are not set up as a group owner.
4. They land directly on that track's weekly tests — the interviewer hub or the recruiter hub, depending on the invitation.
5. For later visits, the sign-in page gets an "email me a sign-in link" option, so invited members never need a password. Existing password sign-in stays untouched for everyone else.

## Guard rails
- Codes are single-purpose: revoked, already accepted, or unknown codes show a friendly message asking them to contact the group owner.
- If the signed-in person's email doesn't match the invitation, they're told the invitation belongs to another address.
- Invited members can't create their own group: the group creation panel is hidden for them and the server refuses the request.
- People who already have a Benchmark account still can't be invited — that existing rule stays.
- Self-signups keep today's behaviour: both tracks, and they can create one group per track.

## Technical detail
- New public route `src/routes/accept-invite.tsx` reading `?token=`; SSR-safe, with error and not-found fallbacks and its own head metadata.
- Two public server functions in a new `src/lib/invites.functions.ts`:
  - `startInviteSignIn({ token })` — service-role lookup of `public.invites` by `token`, status `pending`; sends a Supabase magic link (`signInWithOtp`, no auto sign-up disabled — user is created on first link click) with `emailRedirectTo` back to `/accept-invite?token=...`. Returns only a safe shape (group name, track, masked email).
  - `completeInvite({ token })` — runs with `requireSupabaseAuth`; verifies the session email equals the invite email, calls the existing `accept_invite` RPC via `supabaseAdmin`, then sets `allowed_tracks = [invite.track]` and `active_track = invite.track`, marks the invite accepted, and returns the track for redirect.
- Reuse of the existing single-track logic already in `acceptInvite`; no change needed to `handle_new_user()` because it only grants the `hiring_manager` role and defaults — the invite completion narrows `allowed_tracks` immediately after first sign-in. `ta_admin` is only granted in `create_group_tracked`, so blocking group creation for invited members is what keeps them non-admin.
- Migration: add a `not_a_member` guard to `create_group_tracked` so a user whose `profiles.group_id` is set (i.e. an invited member) cannot create a group on any track. Existing owners unaffected.
- `src/lib/benchmark.server.ts`: change the invite email `joinUrl` to `${APP_URL}/accept-invite?token=${invite.token}`; update `src/lib/email-templates/group-invite.tsx` copy to "Join your group" / one-click wording.
- `src/routes/auth.tsx`: add a "Email me a sign-in link" action next to password sign-in (`signInWithOtp`, redirect to `/hub`).
- `src/components/GroupPanel.tsx`: hide the create-group form when the profile belongs to a group they don't own.
- Redirect targets map to existing routes: interviewer → `/hub`, recruiter → `/recruiter` (the request's `/dashboard/tests` doesn't exist in this app).
- Verification: typecheck, Vitest, build, plus a browser pass over `/accept-invite` with an invalid and a valid pending token.
