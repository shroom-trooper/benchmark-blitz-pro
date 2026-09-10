-- 1. Lock the public read RPCs to the trusted server only
REVOKE EXECUTE ON FUNCTION public.get_public_leaderboard() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_public_profile(text) FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_share_card(text) FROM anon, authenticated, PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_leaderboard() TO service_role;
GRANT EXECUTE ON FUNCTION public.get_public_profile(text) TO service_role;
GRANT EXECUTE ON FUNCTION public.get_share_card(text) TO service_role;

-- 2. Group mutations: move from client-callable to server-only with an explicit verified actor
DROP FUNCTION IF EXISTS public.create_group(text);
DROP FUNCTION IF EXISTS public.accept_invite(uuid);
DROP FUNCTION IF EXISTS public.leave_group();

CREATE OR REPLACE FUNCTION public.create_group(_name text, _actor uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE uid uuid := _actor; gid uuid;
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
END $function$;

CREATE OR REPLACE FUNCTION public.accept_invite(_invite_id uuid, _actor uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE uid uuid := _actor; uemail text; inv public.invites%ROWTYPE;
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
END $function$;

CREATE OR REPLACE FUNCTION public.leave_group(_actor uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE uid uuid := _actor;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF EXISTS (SELECT 1 FROM public.groups WHERE owner_id = uid) THEN
    RAISE EXCEPTION 'Group owners cannot leave their own group';
  END IF;
  UPDATE public.profiles SET group_id = NULL WHERE id = uid;
END $function$;

REVOKE EXECUTE ON FUNCTION public.create_group(text, uuid) FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.accept_invite(uuid, uuid) FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.leave_group(uuid) FROM anon, authenticated, PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_group(text, uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.accept_invite(uuid, uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.leave_group(uuid) TO service_role;

-- 3. Group leaderboard without email exposure, server-only
CREATE OR REPLACE FUNCTION public.get_group_leaderboard(_actor uuid)
RETURNS TABLE(id uuid, name text, total_xp integer, level integer, current_streak integer, group_id uuid, group_name text, member_limit integer, owner_id uuid)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  WITH me AS (SELECT p.group_id FROM public.profiles p WHERE p.id = _actor),
       g AS (SELECT gr.* FROM public.groups gr JOIN me ON me.group_id = gr.id)
  SELECT p.id,
         COALESCE(NULLIF(btrim(p.display_name), ''), NULLIF(btrim(p.full_name), ''), 'Member') AS name,
         p.total_xp,
         p.level,
         p.current_streak,
         g.id,
         g.name,
         g.member_limit,
         g.owner_id
  FROM public.profiles p
  CROSS JOIN g
  WHERE p.group_id = g.id
$function$;

REVOKE EXECUTE ON FUNCTION public.get_group_leaderboard(uuid) FROM anon, authenticated, PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_group_leaderboard(uuid) TO service_role;

-- 4. Stop peers from reading each other's profile rows (email exposure)
DROP POLICY IF EXISTS "profiles readable to self group and platform admins" ON public.profiles;
CREATE POLICY "profiles readable to self group owner and platform admins"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  id = auth.uid()
  OR (group_id IS NOT NULL AND EXISTS (
        SELECT 1 FROM public.groups g WHERE g.id = profiles.group_id AND g.owner_id = auth.uid()
      ))
  OR public.is_platform_admin(auth.uid())
);
