CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE owner_email text; org uuid; gid uuid;
BEGIN
  INSERT INTO public.profiles (id, email, full_name, display_name, allowed_tracks, active_track)
  VALUES (NEW.id, NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email,'@',1)),
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email,'@',1)),
    ARRAY['interviewer'], 'interviewer')
  ON CONFLICT (id) DO NOTHING;
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'hiring_manager') ON CONFLICT DO NOTHING;

  SELECT value INTO owner_email FROM public.app_config WHERE key = 'pilot_owner_email';
  IF owner_email IS NOT NULL AND lower(NEW.email) = lower(owner_email)
     AND NOT EXISTS (SELECT 1 FROM public.organization_roles WHERE role = 'organization_admin') THEN
    INSERT INTO public.organizations (name, created_by) VALUES ('Benchmark', NEW.id) RETURNING id INTO org;
    INSERT INTO public.organization_roles (organization_id, user_id, role) VALUES (org, NEW.id, 'organization_admin');
    INSERT INTO public.groups (name, owner_id, member_limit, track, organization_id)
    VALUES ('Benchmark pilot', NEW.id, 50, 'interviewer', org) RETURNING id INTO gid;
    UPDATE public.profiles SET group_id = gid WHERE id = NEW.id;
  END IF;
  RETURN NEW;
END $function$;