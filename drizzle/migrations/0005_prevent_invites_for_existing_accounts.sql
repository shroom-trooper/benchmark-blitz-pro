CREATE OR REPLACE FUNCTION public.reject_existing_account_invite()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE lower(p.email) = lower(btrim(NEW.email))
  ) THEN
    RAISE EXCEPTION 'That email already has a Benchmark account and cannot be invited to a group.';
  END IF;
  NEW.email := lower(btrim(NEW.email));
  RETURN NEW;
END
$function$;

DROP TRIGGER IF EXISTS invites_reject_existing_accounts ON public.invites;
CREATE TRIGGER invites_reject_existing_accounts
BEFORE INSERT ON public.invites
FOR EACH ROW
EXECUTE FUNCTION public.reject_existing_account_invite();

REVOKE EXECUTE ON FUNCTION public.reject_existing_account_invite() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.reject_existing_account_invite() TO service_role;