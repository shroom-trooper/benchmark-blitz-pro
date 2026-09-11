# Fix recruiter group creation, seat limits and Pro pricing

Three real gaps, all confirmed in the current code.

## 1. No group section on the Recruiter hub

The "Your group" panel (create a group, join an invite, open the console) only
exists on the Interviewer hub. The Recruiter hub renders the week card, level
card and fact box — nothing about groups. The create form there does have an
Interviewers / Recruiters toggle, but you shouldn't have to go to the other
track to make a recruiter group.

Fix: show the same group panel on the Recruiter hub, locked to the recruiter
track — "Create a recruiter group", invite copy says recruiter, and it opens
the recruiter group console. Each track shows its own group, so owning one of
each works.

## 2. Seat copy still says 3

Two separate problems:

- Groups created before the change still carry a 3-seat limit in the database,
  which is why the console reads "1/3 seats used". New groups already get 1.
  Fix: set every existing group's limit to 1 seat (groups that already hold
  more than one member keep their current count so nobody gets kicked).
- Hard-coded "3" wording remains in the hub group card ("invite up to 3 of
  them"), the Pro modal benefit ("Scale beyond the 3-seat free limit") and the
  public guide page ("groups up to 3 seats included").

Fix: seat wording becomes 1 seat per group — one manager in an interviewer
group, one recruiter in a recruiter group — and the console line reads
"1/1 seats used".

## 3. Upgrade to Pro modal shows the old price

It still shows 490 SEK / month, up to 10 seats, then 99 SEK / seat.

Fix: EUR 199 / month, including 10 hiring manager seats and 5 recruiter seats,
then EUR 15 / month per extra manager or recruiter seat. Update the headline
price, the sub-line, the "unlimited seats" benefit text and the confirmation
message that repeats the locked-in rate.

## Technical notes

- Migration: `update public.groups set member_limit = 1 where member_limit <> 1`
  guarded so a group with N > 1 current members keeps `member_limit = N`.
  `create_group_tracked` already sets 1 and needs no change.
- `src/routes/_authenticated/recruiter.index.tsx`: extract the existing
  `GroupPanel` from `hub.tsx` into a shared component that takes a `track`
  prop; hub passes `interviewer`, recruiter hub passes `recruiter`. Recruiter
  group/invite data comes from `loadRecruiterMe` (add group + pendingInvites to
  its payload, mirroring `loadMe`, filtered to recruiter-track groups).
- `src/routes/_authenticated/admin.tsx`: `PRO_FEATURES[0].body`, the price block
  (lines ~262-269) and the confirmation copy (~312).
- `src/routes/guides/how-to-train-hiring-managers.tsx` line 247 seat wording.
- Verify with `bunx tsgo --noEmit`, `bunx vitest run`, and a signed-in browser
  pass creating a recruiter group from the recruiter hub.

On credits: the earlier turn delivered the track switcher, per-track progress
and track-aware invite copy — these three items were genuinely not covered and
are fixed here.
