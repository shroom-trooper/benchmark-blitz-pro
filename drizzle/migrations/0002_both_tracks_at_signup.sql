CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, display_name, allowed_tracks, active_track)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email,'@',1)),
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email,'@',1)),
    ARRAY['interviewer','recruiter'],
    'interviewer'
  )
  ON CONFLICT (id) DO NOTHING;
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'hiring_manager')
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END $function$;

ALTER TABLE public.profiles ALTER COLUMN allowed_tracks SET DEFAULT ARRAY['interviewer','recruiter'];

-- Backfill self-signup accounts (group owners and members of no group) to both tracks.
-- Invited members (group_id set, not an owner) keep their single invited track.
UPDATE public.profiles p
SET allowed_tracks = ARRAY['interviewer','recruiter']
WHERE p.group_id IS NULL
   OR EXISTS (SELECT 1 FROM public.groups g WHERE g.owner_id = p.id);