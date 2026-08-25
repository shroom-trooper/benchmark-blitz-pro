-- 1. Platform admins (curriculum + release schedule owners)
CREATE TABLE public.platform_admins (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.platform_admins TO authenticated;
GRANT ALL ON public.platform_admins TO service_role;
ALTER TABLE public.platform_admins ENABLE ROW LEVEL SECURITY;
CREATE POLICY "platform admins readable" ON public.platform_admins FOR SELECT TO authenticated USING (true);

INSERT INTO public.platform_admins (user_id)
SELECT user_id FROM public.user_roles WHERE role = 'ta_admin'
ON CONFLICT DO NOTHING;

CREATE OR REPLACE FUNCTION public.is_platform_admin(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.platform_admins WHERE user_id = _user_id)
$$;
GRANT EXECUTE ON FUNCTION public.is_platform_admin(uuid) TO authenticated, service_role;

-- 2. Groups
CREATE TABLE public.groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  member_limit integer NOT NULL DEFAULT 3,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX groups_owner_unique ON public.groups(owner_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.groups TO authenticated;
GRANT ALL ON public.groups TO service_role;
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;

-- 3. Profiles: display name + group
ALTER TABLE public.profiles
  ADD COLUMN display_name text,
  ADD COLUMN group_id uuid REFERENCES public.groups(id) ON DELETE SET NULL;

CREATE OR REPLACE FUNCTION public.is_group_member(_group_id uuid, _user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.groups g WHERE g.id = _group_id AND g.owner_id = _user_id)
      OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = _user_id AND p.group_id = _group_id)
$$;
GRANT EXECUTE ON FUNCTION public.is_group_member(uuid, uuid) TO authenticated, service_role;

UPDATE public.profiles
SET display_name = COALESCE(full_name, split_part(email, '@', 1))
WHERE display_name IS NULL;

-- migrate existing departments into groups owned by the first platform admin
DO $$
DECLARE owner uuid;
BEGIN
  SELECT user_id INTO owner FROM public.platform_admins LIMIT 1;
  IF owner IS NOT NULL AND EXISTS (SELECT 1 FROM public.departments) THEN
    INSERT INTO public.groups (id, name, owner_id)
    SELECT gen_random_uuid(), d.name, owner FROM public.departments d LIMIT 1;
    UPDATE public.profiles SET group_id = (SELECT id FROM public.groups LIMIT 1)
    WHERE department_id IS NOT NULL;
  END IF;
END $$;

CREATE POLICY "groups readable by members" ON public.groups FOR SELECT TO authenticated
  USING (owner_id = auth.uid() OR public.is_group_member(id, auth.uid()));
CREATE POLICY "groups updated by owner" ON public.groups FOR UPDATE TO authenticated
  USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());
CREATE POLICY "groups deleted by owner" ON public.groups FOR DELETE TO authenticated
  USING (owner_id = auth.uid());

-- 4. Membership cap (3 members + owner)
CREATE OR REPLACE FUNCTION public.enforce_group_capacity()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE cnt integer; lim integer; owner uuid;
BEGIN
  IF NEW.group_id IS NULL OR NEW.group_id IS NOT DISTINCT FROM OLD.group_id THEN
    RETURN NEW;
  END IF;
  SELECT g.owner_id, g.member_limit INTO owner, lim FROM public.groups g WHERE g.id = NEW.group_id;
  IF owner IS NULL THEN RAISE EXCEPTION 'Group not found'; END IF;
  IF NEW.id = owner THEN RETURN NEW; END IF;
  SELECT count(*) INTO cnt FROM public.profiles p WHERE p.group_id = NEW.group_id AND p.id <> owner;
  IF cnt >= lim THEN
    RAISE EXCEPTION 'GROUP_LIMIT: this group already has % members', lim;
  END IF;
  RETURN NEW;
END $$;

CREATE TRIGGER profiles_group_capacity
BEFORE INSERT OR UPDATE OF group_id ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.enforce_group_capacity();

-- 5. Invites reworked to groups
ALTER TABLE public.invites
  ADD COLUMN group_id uuid REFERENCES public.groups(id) ON DELETE CASCADE;
ALTER TABLE public.invites DROP COLUMN department_id;
UPDATE public.invites SET group_id = (SELECT id FROM public.groups LIMIT 1) WHERE group_id IS NULL;
DELETE FROM public.invites WHERE group_id IS NULL;
ALTER TABLE public.invites ALTER COLUMN group_id SET NOT NULL;
CREATE UNIQUE INDEX invites_group_email_unique ON public.invites(group_id, lower(email));

DROP POLICY IF EXISTS "invites admin" ON public.invites;
CREATE POLICY "invites managed by group owner" ON public.invites FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.groups g WHERE g.id = invites.group_id AND g.owner_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.groups g WHERE g.id = invites.group_id AND g.owner_id = auth.uid()));
CREATE POLICY "invites visible to invitee" ON public.invites FOR SELECT TO authenticated
  USING (lower(email) = lower(coalesce(auth.jwt() ->> 'email', '')));

CREATE OR REPLACE FUNCTION public.enforce_invite_capacity()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE lim integer; owner uuid; used integer;
BEGIN
  SELECT g.owner_id, g.member_limit INTO owner, lim FROM public.groups g WHERE g.id = NEW.group_id;
  IF owner IS NULL THEN RAISE EXCEPTION 'Group not found'; END IF;
  SELECT (SELECT count(*) FROM public.profiles p WHERE p.group_id = NEW.group_id AND p.id <> owner)
       + (SELECT count(*) FROM public.invites i WHERE i.group_id = NEW.group_id AND i.status = 'pending')
    INTO used;
  IF used >= lim THEN
    RAISE EXCEPTION 'GROUP_LIMIT: this group already has % seats used', lim;
  END IF;
  RETURN NEW;
END $$;

CREATE TRIGGER invites_capacity
BEFORE INSERT ON public.invites
FOR EACH ROW WHEN (NEW.status = 'pending') EXECUTE FUNCTION public.enforce_invite_capacity();

-- 6. Group creation + invite acceptance
CREATE OR REPLACE FUNCTION public.create_group(_name text)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE uid uuid := auth.uid(); gid uuid;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF _name IS NULL OR length(btrim(_name)) = 0 THEN RAISE EXCEPTION 'Group name is required'; END IF;
  IF EXISTS (SELECT 1 FROM public.groups WHERE owner_id = uid) THEN
    RAISE EXCEPTION 'You already own a group';
  END IF;
  IF EXISTS (SELECT 1 FROM public.profiles WHERE id = uid AND group_id IS NOT NULL) THEN
    RAISE EXCEPTION 'You are already a member of a group';
  END IF;
  INSERT INTO public.groups (name, owner_id) VALUES (btrim(_name), uid) RETURNING id INTO gid;
  UPDATE public.profiles SET group_id = gid WHERE id = uid;
  INSERT INTO public.user_roles (user_id, role) VALUES (uid, 'ta_admin') ON CONFLICT DO NOTHING;
  RETURN gid;
END $$;
GRANT EXECUTE ON FUNCTION public.create_group(text) TO authenticated;

CREATE OR REPLACE FUNCTION public.accept_invite(_invite_id uuid)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE uid uuid := auth.uid(); uemail text; inv public.invites%ROWTYPE;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  SELECT lower(email) INTO uemail FROM auth.users WHERE id = uid;
  SELECT * INTO inv FROM public.invites WHERE id = _invite_id;
  IF inv.id IS NULL OR inv.status <> 'pending' THEN RAISE EXCEPTION 'Invite is no longer available'; END IF;
  IF lower(inv.email) <> uemail THEN RAISE EXCEPTION 'This invite is for a different email address'; END IF;
  IF EXISTS (SELECT 1 FROM public.groups WHERE owner_id = uid) THEN
    RAISE EXCEPTION 'You already own a group';
  END IF;
  UPDATE public.profiles SET group_id = inv.group_id WHERE id = uid;
  UPDATE public.invites SET status = 'accepted' WHERE id = inv.id;
  RETURN inv.group_id;
END $$;
GRANT EXECUTE ON FUNCTION public.accept_invite(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.leave_group()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE uid uuid := auth.uid();
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF EXISTS (SELECT 1 FROM public.groups WHERE owner_id = uid) THEN
    RAISE EXCEPTION 'Group owners cannot leave their own group';
  END IF;
  UPDATE public.profiles SET group_id = NULL WHERE id = uid;
END $$;
GRANT EXECUTE ON FUNCTION public.leave_group() TO authenticated;

-- 7. New signups are plain users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, display_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email,'@',1)),
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email,'@',1))
  )
  ON CONFLICT (id) DO NOTHING;
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'hiring_manager')
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END $$;

-- 8. Public leaderboard view (safe columns only, readable signed-out)
CREATE VIEW public.public_leaderboard AS
  SELECT p.id,
         COALESCE(NULLIF(btrim(p.display_name), ''), 'Anonymous') AS display_name,
         p.level,
         p.total_xp,
         p.current_streak,
         p.last_completed_week
  FROM public.profiles p
  WHERE p.total_xp > 0;
GRANT SELECT ON public.public_leaderboard TO anon, authenticated, service_role;

-- 9. Upgrade interest capture
CREATE TABLE public.upgrade_interest (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  group_id uuid REFERENCES public.groups(id) ON DELETE SET NULL,
  seats_wanted integer,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.upgrade_interest TO authenticated;
GRANT ALL ON public.upgrade_interest TO service_role;
ALTER TABLE public.upgrade_interest ENABLE ROW LEVEL SECURITY;
CREATE POLICY "upgrade interest own" ON public.upgrade_interest FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "upgrade interest insert own" ON public.upgrade_interest FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

-- 10. Curriculum + settings limited to platform admins
DROP POLICY IF EXISTS "weeks admin write" ON public.curriculum_weeks;
CREATE POLICY "weeks platform admin write" ON public.curriculum_weeks FOR ALL TO authenticated
  USING (public.is_platform_admin(auth.uid())) WITH CHECK (public.is_platform_admin(auth.uid()));
DROP POLICY IF EXISTS "overrides admin write" ON public.question_overrides;
CREATE POLICY "overrides platform admin write" ON public.question_overrides FOR ALL TO authenticated
  USING (public.is_platform_admin(auth.uid())) WITH CHECK (public.is_platform_admin(auth.uid()));
DROP POLICY IF EXISTS "org settings admin update" ON public.org_settings;
CREATE POLICY "org settings platform admin update" ON public.org_settings FOR UPDATE TO authenticated
  USING (public.is_platform_admin(auth.uid())) WITH CHECK (public.is_platform_admin(auth.uid()));

-- 11. Retire departments
ALTER TABLE public.profiles DROP COLUMN department_id;
DROP TABLE public.departments;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END $$;

CREATE TRIGGER groups_updated_at BEFORE UPDATE ON public.groups
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();