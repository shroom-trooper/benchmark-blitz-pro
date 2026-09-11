CREATE OR REPLACE FUNCTION public.create_group_tracked(_name text, _actor uuid, _track text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE uid uuid := _actor; gid uuid; seats integer; member_group uuid;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF _track NOT IN ('interviewer','recruiter') THEN RAISE EXCEPTION 'Unknown track'; END IF;
  IF _name IS NULL OR length(btrim(_name)) = 0 THEN RAISE EXCEPTION 'Group name is required'; END IF;

  SELECT p.group_id INTO member_group FROM public.profiles p WHERE p.id = uid;
  IF member_group IS NOT NULL
     AND NOT EXISTS (SELECT 1 FROM public.groups g WHERE g.id = member_group AND g.owner_id = uid) THEN
    RAISE EXCEPTION 'You are a member of a group and cannot create your own group';
  END IF;

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
END $function$;