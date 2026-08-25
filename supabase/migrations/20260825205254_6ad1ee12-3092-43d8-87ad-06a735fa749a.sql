DROP POLICY IF EXISTS "platform admins readable" ON public.platform_admins;

CREATE POLICY "platform admins readable to self and admins"
ON public.platform_admins
FOR SELECT
TO authenticated
USING (user_id = auth.uid() OR public.is_platform_admin(auth.uid()));

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  ) AND (auth.uid() IS NULL OR _user_id = auth.uid())
$$;

CREATE OR REPLACE FUNCTION public.is_platform_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.platform_admins WHERE user_id = _user_id)
     AND (auth.uid() IS NULL OR _user_id = auth.uid())
$$;

CREATE OR REPLACE FUNCTION public.is_group_member(_group_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT (auth.uid() IS NULL OR _user_id = auth.uid())
     AND (
       EXISTS (SELECT 1 FROM public.groups g WHERE g.id = _group_id AND g.owner_id = _user_id)
       OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = _user_id AND p.group_id = _group_id)
     )
$$;

REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM anon;
REVOKE EXECUTE ON FUNCTION public.is_platform_admin(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.is_group_member(uuid, uuid) FROM anon;