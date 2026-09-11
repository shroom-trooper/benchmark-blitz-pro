CREATE OR REPLACE FUNCTION public.get_public_recruiter_leaderboard()
RETURNS TABLE(id uuid, display_name text, level integer, total_xp integer, current_streak integer, last_completed_week integer)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT p.id,
         COALESCE(NULLIF(btrim(p.display_name), ''), 'Anonymous') AS display_name,
         tp.level,
         tp.total_xp,
         tp.current_streak,
         tp.last_completed_week
  FROM public.track_progress tp
  JOIN public.profiles p ON p.id = tp.user_id
  WHERE tp.track = 'recruiter' AND tp.total_xp > 0
  ORDER BY tp.total_xp DESC
  LIMIT 100
$$;

CREATE OR REPLACE FUNCTION public.get_group_recruiter_leaderboard(_actor uuid)
RETURNS TABLE(id uuid, name text, total_xp integer, level integer, current_streak integer, group_id uuid, group_name text, member_limit integer, owner_id uuid)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  WITH g AS (
    SELECT gr.*
    FROM public.groups gr
    WHERE gr.track = 'recruiter'
      AND (
        gr.owner_id = _actor
        OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = _actor AND p.group_id = gr.id)
      )
    LIMIT 1
  )
  SELECT p.id,
         COALESCE(NULLIF(btrim(p.display_name), ''), NULLIF(btrim(p.full_name), ''), 'Member') AS name,
         COALESCE(tp.total_xp, 0) AS total_xp,
         COALESCE(tp.level, 1) AS level,
         COALESCE(tp.current_streak, 0) AS current_streak,
         g.id,
         g.name,
         g.member_limit,
         g.owner_id
  FROM public.profiles p
  CROSS JOIN g
  LEFT JOIN public.track_progress tp ON tp.user_id = p.id AND tp.track = 'recruiter'
  WHERE p.group_id = g.id OR p.id = g.owner_id
$$;

REVOKE ALL ON FUNCTION public.get_public_recruiter_leaderboard() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.get_group_recruiter_leaderboard(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_public_recruiter_leaderboard() TO service_role;
GRANT EXECUTE ON FUNCTION public.get_group_recruiter_leaderboard(uuid) TO service_role;