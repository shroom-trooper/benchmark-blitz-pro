CREATE OR REPLACE VIEW public.public_leaderboard AS
  SELECT p.id,
         COALESCE(NULLIF(btrim(p.display_name), ''), 'Anonymous') AS display_name,
         p.level,
         p.total_xp,
         p.current_streak,
         p.last_completed_week
  FROM public.profiles p
  WHERE p.total_xp > 0;
GRANT SELECT ON public.public_leaderboard TO anon, authenticated, service_role;