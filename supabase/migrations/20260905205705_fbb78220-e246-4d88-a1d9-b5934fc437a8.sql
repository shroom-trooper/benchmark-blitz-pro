ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS share_slug text,
  ADD COLUMN IF NOT EXISTS share_card_url text,
  ADD COLUMN IF NOT EXISTS share_bonus_awarded boolean NOT NULL DEFAULT false;

CREATE OR REPLACE FUNCTION public.make_share_slug(_seed text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  base text;
  candidate text;
  i int := 0;
BEGIN
  base := lower(regexp_replace(coalesce(nullif(trim(_seed), ''), 'player'), '[^a-zA-Z0-9]+', '-', 'g'));
  base := trim(both '-' from base);
  IF base = '' THEN base := 'player'; END IF;
  base := left(base, 24);
  LOOP
    candidate := base || '-' || substr(md5(random()::text || clock_timestamp()::text), 1, 5);
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.profiles WHERE share_slug = candidate);
    i := i + 1;
    EXIT WHEN i > 10;
  END LOOP;
  RETURN candidate;
END;
$$;

UPDATE public.profiles
SET share_slug = public.make_share_slug(coalesce(display_name, full_name, split_part(email, '@', 1)))
WHERE share_slug IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS profiles_share_slug_key ON public.profiles (share_slug);

CREATE OR REPLACE FUNCTION public.set_share_slug()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.share_slug IS NULL THEN
    NEW.share_slug := public.make_share_slug(coalesce(NEW.display_name, NEW.full_name, split_part(NEW.email, '@', 1)));
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_share_slug ON public.profiles;
CREATE TRIGGER profiles_share_slug
BEFORE INSERT ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.set_share_slug();

CREATE OR REPLACE FUNCTION public.get_public_profile(p_slug text)
RETURNS TABLE (
  display_name text,
  level int,
  total_xp int,
  current_streak int,
  longest_streak int,
  share_card_url text,
  rank int,
  total_players int
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH ranked AS (
    SELECT p.id,
           p.display_name,
           p.level,
           p.total_xp,
           p.current_streak,
           p.longest_streak,
           p.share_card_url,
           p.share_slug,
           rank() OVER (ORDER BY p.total_xp DESC)::int AS rnk,
           count(*) OVER ()::int AS total
    FROM public.profiles p
    WHERE p.total_xp > 0
  )
  SELECT r.display_name, r.level, r.total_xp, r.current_streak, r.longest_streak,
         r.share_card_url, r.rnk, r.total
  FROM ranked r
  WHERE r.share_slug = p_slug
  UNION ALL
  SELECT p.display_name, p.level, p.total_xp, p.current_streak, p.longest_streak,
         p.share_card_url, NULL::int, (SELECT count(*)::int FROM public.profiles WHERE total_xp > 0)
  FROM public.profiles p
  WHERE p.share_slug = p_slug AND p.total_xp <= 0
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.get_public_profile(text) FROM public;
GRANT EXECUTE ON FUNCTION public.get_public_profile(text) TO anon, authenticated;