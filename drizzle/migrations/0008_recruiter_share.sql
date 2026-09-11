ALTER TABLE public.share_cards
  ADD COLUMN IF NOT EXISTS track text NOT NULL DEFAULT 'interviewer';

ALTER TABLE public.share_cards DROP CONSTRAINT IF EXISTS share_cards_pkey;
ALTER TABLE public.share_cards ADD PRIMARY KEY (user_id, track);

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS share_bonus_recruiter boolean NOT NULL DEFAULT false;

CREATE OR REPLACE FUNCTION public.get_share_card_tracked(p_slug text, p_track text)
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT c.png_base64
  FROM public.share_cards c
  JOIN public.profiles p ON p.id = c.user_id
  WHERE p.share_slug = p_slug AND c.track = p_track
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.get_recruiter_share_stats(_user uuid)
RETURNS TABLE (
  display_name text,
  level int,
  total_xp int,
  current_streak int,
  longest_streak int,
  rank int,
  total_players int
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  WITH ranked AS (
    SELECT tp.user_id,
           rank() OVER (ORDER BY tp.total_xp DESC)::int AS rnk,
           count(*) OVER ()::int AS total
    FROM public.track_progress tp
    WHERE tp.track = 'recruiter' AND tp.total_xp > 0
  )
  SELECT COALESCE(NULLIF(btrim(p.display_name), ''), NULLIF(btrim(p.full_name), ''), 'Anonymous'),
         COALESCE(tp.level, 1),
         COALESCE(tp.total_xp, 0),
         COALESCE(tp.current_streak, 0),
         COALESCE(tp.longest_streak, 0),
         r.rnk,
         COALESCE(r.total, (SELECT count(*)::int FROM public.track_progress WHERE track = 'recruiter' AND total_xp > 0))
  FROM public.profiles p
  LEFT JOIN public.track_progress tp ON tp.user_id = p.id AND tp.track = 'recruiter'
  LEFT JOIN ranked r ON r.user_id = p.id
  WHERE p.id = _user
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.get_public_recruiter_profile(p_slug text)
RETURNS TABLE (
  display_name text,
  level int,
  total_xp int,
  current_streak int,
  longest_streak int,
  rank int,
  total_players int
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT s.*
  FROM public.profiles p
  CROSS JOIN LATERAL public.get_recruiter_share_stats(p.id) s
  WHERE p.share_slug = p_slug
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.get_share_card_tracked(text, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.get_recruiter_share_stats(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.get_public_recruiter_profile(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_share_card_tracked(text, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.get_recruiter_share_stats(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.get_public_recruiter_profile(text) TO service_role;