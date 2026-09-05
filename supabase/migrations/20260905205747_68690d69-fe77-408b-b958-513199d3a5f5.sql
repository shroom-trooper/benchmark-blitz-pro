CREATE TABLE IF NOT EXISTS public.share_cards (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  png_base64 text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.share_cards TO authenticated;
GRANT ALL ON public.share_cards TO service_role;

ALTER TABLE public.share_cards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "share cards select own" ON public.share_cards
  FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "share cards insert own" ON public.share_cards
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "share cards update own" ON public.share_cards
  FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.get_share_card(p_slug text)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT c.png_base64
  FROM public.share_cards c
  JOIN public.profiles p ON p.id = c.user_id
  WHERE p.share_slug = p_slug
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.get_share_card(text) FROM public;
GRANT EXECUTE ON FUNCTION public.get_share_card(text) TO anon, authenticated;