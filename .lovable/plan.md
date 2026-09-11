# Weekly unlock emails: make them track-aware

## What happens today

- Unlocking itself is already individual. Interviewer weeks open from the date the account was created; recruiter weeks open from the date that person started the recruiter track. Both give week 1 straight away and one new week every 7 days up to week 52.
- The weekly reminder email is not track-aware. The daily job looks only at the account creation date and the interviewer week list, and sends one interviewer-worded email per person per week, linking to the interviewer session page.
- Consequences: recruiter-only members get an interviewer email pointing at a page they cannot open, and people with both tracks never get a recruiter reminder.

## What to change

1. Send one reminder per person per track they have access to.
   - Interviewer reminder: only for people with interviewer access, based on their signup date and the interviewer week topics.
   - Recruiter reminder: only for people with recruiter access who have started the recruiter track, based on their recruiter start date and the recruiter week topics.
2. Customise the wording per track.
   - Interviewer: current copy ("hiring simulation", interviewer topic, link to the interviewer week).
   - Recruiter: recruiter wording ("recruiting scenarios"), recruiter topic for that week, link to the recruiter week.
   - Both show the streak for that track only, not a shared number.
3. Keep the "send once" guarantee per person, per week, per track, so nobody gets a duplicate and the two tracks don't block each other.

## Technical notes

- `weekly_unlock_emails` gets a `track` column (default `interviewer`) and its unique index becomes `(user_id, week_number, track)`; existing rows stay valid.
- `src/routes/api/public/cron/weekly-unlock.ts` loops per track: interviewer rows from `profiles.created_at` + `curriculum_weeks`, recruiter rows from `track_progress.started_at` (track = recruiter) + `recruiter_weeks`, each filtered by `profiles.allowed_tracks`.
- Session link per track: `/session/{week}` vs `/recruiter/session/{week}`.
- Email template: add a `track` prop to `weekly-unlock.tsx` driving the heading, body copy and subject line, or register a second recruiter template — one template with a track prop is preferred to keep styling identical.
- Idempotency key becomes `weekly-unlock-{userId}-{track}-{week}`.
