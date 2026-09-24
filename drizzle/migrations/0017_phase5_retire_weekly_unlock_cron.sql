DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'weekly-unlock-emails') THEN
    PERFORM cron.unschedule('weekly-unlock-emails');
  END IF;
END $$;
COMMENT ON TABLE public.weekly_unlock_emails IS 'DEPRECATED (Phase 5): weekly curriculum emails retired; kept for history.';