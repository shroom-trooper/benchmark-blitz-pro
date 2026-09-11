ALTER TABLE public.weekly_unlock_emails
  ADD COLUMN IF NOT EXISTS track text NOT NULL DEFAULT 'interviewer';

ALTER TABLE public.weekly_unlock_emails
  DROP CONSTRAINT IF EXISTS weekly_unlock_emails_user_id_week_number_key;

CREATE UNIQUE INDEX IF NOT EXISTS weekly_unlock_emails_user_week_track_key
  ON public.weekly_unlock_emails (user_id, week_number, track);