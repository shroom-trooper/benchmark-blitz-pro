ALTER TABLE public.normalized_calendar_events ADD COLUMN IF NOT EXISTS ical_uid text;
ALTER TABLE public.calendar_event_attachments ADD COLUMN IF NOT EXISTS source_kind text NOT NULL DEFAULT 'calendar_event' CHECK (source_kind IN ('calendar_event','gmail_invitation','drive_reference'));
ALTER TABLE public.calendar_event_attachments ADD COLUMN IF NOT EXISTS gmail_message_id text;

CREATE TABLE public.invitation_matches (
  normalized_calendar_event_id uuid PRIMARY KEY REFERENCES public.normalized_calendar_events(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status text NOT NULL CHECK (status IN ('matched','no_match','skipped','error')),
  gmail_message_id text,
  matched_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.invitation_matches TO service_role;
ALTER TABLE public.invitation_matches ENABLE ROW LEVEL SECURITY;
CREATE INDEX invitation_matches_user_idx ON public.invitation_matches(user_id);