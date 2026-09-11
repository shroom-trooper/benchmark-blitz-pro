-- Track dimension: 'interviewer' (existing) and 'recruiter' (new)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS active_track text NOT NULL DEFAULT 'interviewer';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS allowed_tracks text[] NOT NULL DEFAULT ARRAY['interviewer']::text[];
ALTER TABLE public.groups ADD COLUMN IF NOT EXISTS track text NOT NULL DEFAULT 'interviewer';
ALTER TABLE public.invites ADD COLUMN IF NOT EXISTS track text NOT NULL DEFAULT 'interviewer';

-- Recruiter curriculum weeks
CREATE TABLE IF NOT EXISTS public.recruiter_weeks (
  week_number integer PRIMARY KEY,
  quarter integer NOT NULL,
  topic text NOT NULL,
  focus text NOT NULL DEFAULT '',
  fact text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.recruiter_weeks TO authenticated;
GRANT SELECT ON public.recruiter_weeks TO anon;
GRANT ALL ON public.recruiter_weeks TO service_role;
ALTER TABLE public.recruiter_weeks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "recruiter weeks readable" ON public.recruiter_weeks;
CREATE POLICY "recruiter weeks readable" ON public.recruiter_weeks FOR SELECT USING (true);

-- Recruiter weekly responses
CREATE TABLE IF NOT EXISTS public.recruiter_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  week_number integer NOT NULL REFERENCES public.recruiter_weeks(week_number),
  answers jsonb NOT NULL DEFAULT '[]'::jsonb,
  score integer NOT NULL DEFAULT 0,
  xp_earned integer NOT NULL DEFAULT 0,
  streak_bonus integer NOT NULL DEFAULT 0,
  completed_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, week_number)
);
GRANT SELECT, INSERT ON public.recruiter_responses TO authenticated;
GRANT ALL ON public.recruiter_responses TO service_role;
ALTER TABLE public.recruiter_responses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "recruiter responses insert own" ON public.recruiter_responses;
CREATE POLICY "recruiter responses insert own" ON public.recruiter_responses
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS "recruiter responses read own or group owner" ON public.recruiter_responses;
CREATE POLICY "recruiter responses read own or group owner" ON public.recruiter_responses
  FOR SELECT TO authenticated USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      JOIN public.groups g ON g.id = p.group_id
      WHERE p.id = recruiter_responses.user_id AND g.owner_id = auth.uid()
    )
  );

-- Per-track progress (interviewer progress stays on profiles; recruiter lives here)
CREATE TABLE IF NOT EXISTS public.track_progress (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  track text NOT NULL,
  total_xp integer NOT NULL DEFAULT 0,
  level integer NOT NULL DEFAULT 1,
  current_streak integer NOT NULL DEFAULT 0,
  longest_streak integer NOT NULL DEFAULT 0,
  last_completed_week integer,
  last_completed_at timestamptz,
  started_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, track)
);
GRANT SELECT, INSERT, UPDATE ON public.track_progress TO authenticated;
GRANT ALL ON public.track_progress TO service_role;
ALTER TABLE public.track_progress ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "track progress own" ON public.track_progress;
CREATE POLICY "track progress own" ON public.track_progress
  FOR SELECT TO authenticated USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      JOIN public.groups g ON g.id = p.group_id
      WHERE p.id = track_progress.user_id AND g.owner_id = auth.uid()
    )
  );
DROP POLICY IF EXISTS "track progress insert own" ON public.track_progress;
CREATE POLICY "track progress insert own" ON public.track_progress
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS "track progress update own" ON public.track_progress;
CREATE POLICY "track progress update own" ON public.track_progress
  FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Track-aware group creation: a lead may own one group per track
CREATE OR REPLACE FUNCTION public.create_group_tracked(_name text, _actor uuid, _track text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE uid uuid := _actor; gid uuid; seats integer;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF _track NOT IN ('interviewer','recruiter') THEN RAISE EXCEPTION 'Unknown track'; END IF;
  IF _name IS NULL OR length(btrim(_name)) = 0 THEN RAISE EXCEPTION 'Group name is required'; END IF;
  IF EXISTS (SELECT 1 FROM public.groups WHERE owner_id = uid AND track = _track) THEN
    RAISE EXCEPTION 'You already own a group on this track';
  END IF;
  seats := 1;
  INSERT INTO public.groups (name, owner_id, member_limit, track)
  VALUES (btrim(_name), uid, seats, _track) RETURNING id INTO gid;
  IF _track = 'interviewer' AND NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = uid AND group_id IS NOT NULL) THEN
    UPDATE public.profiles SET group_id = gid WHERE id = uid;
  END IF;
  INSERT INTO public.user_roles (user_id, role) VALUES (uid, 'ta_admin') ON CONFLICT DO NOTHING;
  RETURN gid;
END $$;
REVOKE ALL ON FUNCTION public.create_group_tracked(text, uuid, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.create_group_tracked(text, uuid, text) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_group_tracked(text, uuid, text) TO service_role;