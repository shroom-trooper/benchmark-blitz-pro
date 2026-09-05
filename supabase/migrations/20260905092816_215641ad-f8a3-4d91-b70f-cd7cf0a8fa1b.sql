CREATE TABLE public.sprint_sessions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  questions jsonb NOT NULL,
  answers jsonb NOT NULL DEFAULT '[]'::jsonb,
  difficulty text NOT NULL DEFAULT 'core',
  total integer NOT NULL,
  score integer NOT NULL DEFAULT 0,
  xp_earned integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'active',
  started_at timestamp with time zone NOT NULL DEFAULT now(),
  completed_at timestamp with time zone
);

GRANT SELECT, INSERT, UPDATE ON public.sprint_sessions TO authenticated;
GRANT ALL ON public.sprint_sessions TO service_role;
ALTER TABLE public.sprint_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own sprints" ON public.sprint_sessions FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users create own sprints" ON public.sprint_sessions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own sprints" ON public.sprint_sessions FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Group leads read member sprints" ON public.sprint_sessions FOR SELECT TO authenticated USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    JOIN public.groups g ON g.id = p.group_id
    WHERE p.id = public.sprint_sessions.user_id AND g.owner_id = auth.uid()
  )
);

CREATE INDEX sprint_sessions_user_idx ON public.sprint_sessions (user_id, completed_at DESC);

ALTER TABLE public.profiles
  ADD COLUMN sprint_streak integer NOT NULL DEFAULT 0,
  ADD COLUMN longest_sprint_streak integer NOT NULL DEFAULT 0,
  ADD COLUMN last_sprint_date date;