# Phase 2 — Outlook Calendar automation for interview preparation

Extend the Phase 1 manual flow so interviews can come from each interviewer's own Outlook calendar. Nothing existing gets rewritten, and the manual "Add interview" flow stays as the fallback. The app keeps working when Outlook isn't connected.

## What participants get
- **Settings → Calendar**: a "Connect Outlook" button (a popup with Microsoft sign-in), connection health (last sync, needs reconnect, error), a "Sync now" button, and Disconnect. Notification preferences: prep email on (24h before), refresher off until the user turns it on (20 min before), quiet hours, time zone. No emails go out until the user enables them.
- **Interviews page** gets two new sections:
  - **Detected from calendar**: high-confidence matches, shown as drafts with a "Confirm & correct" step.
  - **Needs confirmation**: medium-confidence events. Each has Confirm or "Not an interview".
  - Low-confidence events stay hidden. "Find a missed event" lets the user recover one by hand.
- **Confirm screen**: pre-filled role, stage, competencies and candidate name (all editable). It lists the invite's own attachments, and the user ticks which ones the AI may use (CV, JD, scorecard, guide).
- **Two-touch delivery**:
  - A prep email with a link to the 4–6 question session. It is generated automatically only for confirmed interviews, and only when the user enabled it.
  - An optional 2–3 question refresher just before the interview.
  - Reschedules move both emails. Cancellations stop them. Completed prep and capability evidence are always kept.

## What TA admins get
The Interview Readiness tab adds:
- Calendar-connected members
- Auto-detected vs manual interviews
- Interviews "confirmed and prepared before start"
- Needs-reconnect warnings

Still no CV, JD or attachment content, and no candidate scoring.

## Gamification
Reuses the existing recognition system. New badges: "Calendar connected", "Prepared ahead ×3 (auto)" and "Refresher streak". Nothing about the candidate is involved.

## Setup needed from you (blocker)
Before anyone can connect Outlook, a workspace admin must register a Microsoft Entra app. You set it up once in workspace App User Connectors:
- Redirect URI: `https://connector-gateway.lovable.dev/api/v1/app-users/oauth2/callback`
- Offline access enabled
- Delegated permissions: `openid profile email offline_access Calendars.Read`

I'll open the connect card when we start. Until that's done, everything is built and tested, but the Connect button shows "Setup needed".

## Technical details

**Token security.** OAuth, PKCE/state and token refresh run through the Lovable connector gateway. Microsoft tokens never reach the app. We store only the per-user connection handle, AES-256-GCM encrypted, in a table that only the server can read (`app_user_connections`). It's never logged or sent to analytics.

**Permissions and why.** `Calendars.Read` reads events and invite attachments. `offline_access` allows background sync. `openid/profile/email` show which account is connected. No Mail, Files, Contacts or SharePoint access.

**Migrations (additive only):**
- `calendar_connections`, `calendar_sync_state` (delta token), `normalized_calendar_events` (unique on connection + external id), `interview_classifications`.
- `calendar_event_attachments` holds metadata only. Extracted text goes in a separate `calendar_attachment_content` table: service role only, deleted 7 days after the interview.
- `preparation_schedules`, `notification_preferences`, `notification_deliveries` (unique idempotency key).
- Adds `source_calendar_event_id` to `interview_events`.
- GRANTs and RLS: users read their own rows. Owners see only through the existing security-definer readiness RPC, which is extended with counts.

**Provider adapter.** `src/lib/calendar/provider.ts` defines the interface: connect, callback, health, initialSync, deltaSync, getEvent, listAttachmentMeta, getAttachment, normalize, disconnect. `microsoft.server.ts` implements it through Graph `/me/calendarView/delta` over a bounded 30-day window. Google is left as a stub for later.

**Detection.** `src/lib/calendar/classifier.ts` is deterministic and versioned. It combines weighted signals: interview keywords, an external attendee, a 30–90 min duration, a stage phrase, role or candidate phrasing, and CV/JD-type attachment names. One weak signal alone is never enough, and names or protected traits are never used. Scores map to likely, possible or not.

**Attachments.** Only direct file attachments on that single event. Types allowed: PDF, DOCX and TXT, up to 5 MB. Metadata is fetched only for likely or possible events. Content is downloaded only after the user approves it. Text extraction uses the existing PDF/AI path. Links in invitations are listed but never fetched.

**Generation.** Reuses `generator.server.ts` with the approved context, plus a refresher mode that returns 2–3 questions. The curated fallback still applies.

**Sync and sending.** Webhooks are skipped for reliability. Instead, a new cron route `/api/public/cron/calendar-sync` runs every 15 minutes, using the same token pattern as the weekly-unlock cron. It handles delta sync, reconciling reschedules and cancellations, and due deliveries. Emails are two new templates (`interview-prep`, `interview-refresher`) in the existing transactional email system. Quiet hours are respected.

**Disconnect.** The gateway revokes access and the handle is deleted. Sync stops and future deliveries are cancelled. Imported interviews and completed prep stay, and extracted attachment text is purged right away.

**Analytics (PostHog, metadata only):** calendar_connected, calendar_sync_completed, interview_detected (confidence band), interview_confirmed, attachment_approved (type only), prep_email_sent, refresher_completed, calendar_disconnected.

**Tests (Vitest):**
- Classifier thresholds and protected-trait exclusion
- Attachment allow-list
- Delta reconcile: reschedule, cancel, duplicate
- Schedule computation with quiet hours and time zones
- Delivery idempotency
- Crypto round-trip
- Disconnect purge

Then typecheck, build, and a Playwright run of the manual fallback and the "Setup needed" state.

**Not in Phase 2:** Google Calendar, ATS, reading email/OneDrive/SharePoint, candidate scoring.

**Deliverable:** a closing summary against the brief's deliverables list, including the audit findings and any Phase 1 fixes.
