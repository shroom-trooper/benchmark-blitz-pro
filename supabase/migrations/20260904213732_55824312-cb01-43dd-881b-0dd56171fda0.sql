CREATE TABLE public.weekly_unlock_emails (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  week_number integer NOT NULL,
  sent_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (user_id, week_number)
);

GRANT SELECT ON public.weekly_unlock_emails TO authenticated;
GRANT ALL ON public.weekly_unlock_emails TO service_role;

ALTER TABLE public.weekly_unlock_emails ENABLE ROW LEVEL SECURITY;

CREATE POLICY "weekly unlock emails read own"
ON public.weekly_unlock_emails
FOR SELECT
TO authenticated
USING (user_id = auth.uid());