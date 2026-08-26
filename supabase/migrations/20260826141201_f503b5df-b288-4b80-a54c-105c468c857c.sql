DROP VIEW IF EXISTS public.public_leaderboard;
GRANT EXECUTE ON FUNCTION public.get_public_leaderboard() TO anon, authenticated;