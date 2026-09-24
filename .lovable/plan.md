# Phase 2 — Google Calendar + optional Gmail invitation attachments

Switch Phase 2 from Outlook to Google. Everything already built that isn't tied to one provider stays as it is: the calendar and attachment tables, interview detection, the confirm screen, scheduling, the prep and refresher emails, quiet hours, the 7-day attachment deletion and the manual "Add interview" flow. The Outlook code stays in the project but is switched off and hidden.

## What participants get
- **Calendar page**: two separate connections, each with its own Connect and Disconnect button.
  1. **Google Calendar** (needed for automation): read-only access to upcoming events.
  2. **Gmail invitation attachments** (optional, off by default): a clear explanation comes first. Benchmark uses Gmail only to find the invite email for an interview it already detected, and only to take files attached to that email. It never reads other emails, threads or replies, never searches by candidate name and never trains a model on your email. We also say plainly that Google's permission technically allows reading your whole inbox, and that Benchmark limits itself on its own side.
- **Found in your calendar** list, confirm screen and "Not an interview" work as today. The confirm screen lists documents from two places: files attached to the calendar event, and files on the matching Gmail invite (when Gmail is connected). Each file is labelled as a CV, job description, interview guide, rubric, scorecard or other, and can be excluded. Only ticked files are read.
- If Gmail is connected but no matching invite is found, the screen says: "No matching Gmail invitation attachment found." You can still add context by hand.
- Google Docs or Drive files linked from an event are **shown as links only** in this phase. They are not fetched automatically, because that would need broad Drive access. You can paste their content using the Phase 1 manual flow.
- Email settings (preparation email, refresher email, quiet hours) are unchanged and stay off until you turn them on.

## What TA admins get
The readiness tab also shows which sources were used ("Calendar", "Calendar + invitation attachments") as counts only. Admins never see file names, CV text or job-description text.

## Setup you will need to do
One Google OAuth web client in Google Cloud Console, linked to two app sign-in connections (Google Calendar and Gmail). The approval cards include step-by-step instructions. Authorized redirect URI: `https://connector-gateway.lovable.dev/api/v1/app-users/oauth2/callback`. Gmail's read-only permission is a "restricted" permission in Google's terms, so using it with outside users means going through Google's app verification. Internal or test users work straight away.

## Technical details

**Access Benchmark asks Google for**
- Calendar: `openid email profile` plus `https://www.googleapis.com/auth/calendar.events.readonly`. Offline access is included so background sync can run.
- Gmail: `https://www.googleapis.com/auth/gmail.readonly` only. No send, modify, compose, labels or Drive access. The Gmail connection is linked, stored and disconnected separately from Calendar.

**Provider layer (`src/lib/calendar/`)**
- `google-calendar.server.ts` implements the existing `CalendarProvider` interface:
  - The first sync covers events from now to 30 days ahead (`singleEvents=true`) and stores the `nextSyncToken`.
  - Later syncs are incremental. If Google says the sync token has expired (HTTP 410), it falls back to a full sync.
  - Cancelled events are handled through `status=cancelled`.
  - Event attachments come from `attachments[]` in the event data. Attachment files are not downloaded in this phase; they are recorded as `drive_reference` link-only rows.
  - External attendees are detected by comparing attendee email domains with the user's own domain.
  - The Google event `iCalUID` is stored.
- `gmail-invitation.server.ts` is a new `InvitationSourceProvider` (`findMatchingInvitation`, `getInvitationAttachments`, `retrieveApprovedAttachment`):
  - It runs only for events rated "likely" or confirmed by the user.
  - Search query: `has:attachment filename:ics` limited to a date window around when the event was created, plus the organizer, `maxResults=10`. It reads metadata only (`format=metadata`), then checks the `text/calendar` part's `UID` against the event's `iCalUID` (the invite's unique ID).
  - If there is no exact UID match, it records `no_match` and stops. It never searches by candidate name and never reads the thread.
  - It stores only `message_id` and attachment metadata. It downloads an attachment only after the user approves it.
- File checks before extraction:
  - The file's actual signature is checked against its claimed type (PDF `%PDF`, DOCX zip `PK`, TXT UTF-8).
  - Size limit 5 MB; extracted text is capped at 60k characters.
  - Password-protected, corrupt or unsupported files are rejected.
- `sync.server.ts` switches its provider to `google_calendar`. After detection it calls the Gmail matcher if Gmail is connected. `interview_contexts.sources` records the source types used.

**Additive migration**
- Add `source_kind` (`calendar_event` | `gmail_invitation` | `drive_reference`) and `gmail_message_id` to `calendar_event_attachments`.
- Add `ical_uid` to `normalized_calendar_events`.
- Create `invitation_matches` (event_id, status `matched`/`no_match`/`skipped`, matched_at). Access is service-role only; users can read their own status through the server.
- Existing tables are reused. Connection keys are stored encrypted in `app_user_connections`, one row per user per connection (`google_calendar`, `google_mail`).

**Server functions and user interface**
- Split `calendar.functions.ts` connect/complete/disconnect into Calendar and Gmail versions, using the same popup sign-in with a one-time code.
- Update the OAuth return pages to `/oauth/google-calendar/return` and `/oauth/gmail/return`.
- Update the Calendar page with two cards and the Gmail explanation dialog.
- Update the confirm screen with a source label per file, link-only Drive references and the no-match message.
- Disconnecting Gmail deletes stored invitation attachment text and matches right away.

**Cron**
- Add the `calendar-sync` token and a pg_cron job that runs every 15 minutes (schedule migration). The run syncs calendars, runs Gmail matching for newly likely events, sends due emails and purges expired attachment text.

**Analytics** (no text, names or file names)
- calendar_connected and gmail_connected (provider only), invitation_match_result (matched / no_match), attachment_approved (type), interview_confirmed (source).

**Tests (Vitest)**
- Google event normalization, cancellations and handling of an expired sync token.
- The UID matcher: accepts only an exact UID and never sends a candidate-name query.
- File-signature checks.
- Gmail disconnect purge.
- Classifier regressions.
- Then typecheck, build and a Playwright check of the Calendar page when Google is not set up.

**Not in this phase:** automatic Google Drive or Docs file fetching, Outlook (kept but disabled), ATS.
