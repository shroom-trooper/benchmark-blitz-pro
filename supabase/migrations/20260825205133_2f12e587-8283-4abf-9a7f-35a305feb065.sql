DROP VIEW IF EXISTS public.public_leaderboard;

CREATE OR REPLACE FUNCTION public.get_public_leaderboard()
RETURNS TABLE (
  id uuid,
  display_name text,
  level integer,
  total_xp integer,
  current_streak integer,
  last_completed_week integer
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.id,
         COALESCE(NULLIF(btrim(p.display_name), ''), 'Anonymous') AS display_name,
         p.level,
         p.total_xp,
         p.current_streak,
         p.last_completed_week
  FROM public.profiles p
  WHERE p.total_xp > 0
  ORDER BY p.total_xp DESC
  LIMIT 100
$$;

GRANT EXECUTE ON FUNCTION public.get_public_leaderboard() TO anon, authenticated, service_role;

DROP POLICY IF EXISTS "profiles readable" ON public.profiles;

CREATE POLICY "profiles readable to self group and platform admins"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  id = auth.uid()
  OR (group_id IS NOT NULL AND public.is_group_member(group_id, auth.uid()))
  OR public.is_platform_admin(auth.uid())
);