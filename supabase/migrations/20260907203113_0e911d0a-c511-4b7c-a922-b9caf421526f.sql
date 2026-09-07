-- Remove blanket PUBLIC execute on all SECURITY DEFINER functions, then re-grant only what each audience needs.
REVOKE EXECUTE ON FUNCTION public.get_public_leaderboard() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_public_profile(text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_share_card(text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.accept_invite(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.create_group(text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.leave_group() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.is_group_member(uuid, uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.is_platform_admin(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.make_share_slug(text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.set_share_slug() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.enforce_group_capacity() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.enforce_invite_capacity() FROM PUBLIC, anon, authenticated;

-- Public read-only helpers (safe, column-limited output)
GRANT EXECUTE ON FUNCTION public.get_public_leaderboard() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_public_profile(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_share_card(text) TO anon, authenticated;

-- Signed-in-only actions (each re-checks auth.uid() internally)
GRANT EXECUTE ON FUNCTION public.accept_invite(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_group(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.leave_group() TO authenticated;

-- Required by row-level security policies for signed-in users only
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_group_member(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_platform_admin(uuid) TO authenticated;