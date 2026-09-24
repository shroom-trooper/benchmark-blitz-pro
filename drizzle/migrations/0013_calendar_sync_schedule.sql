-- lovable-cron-fallback-reviewed: calendar sync + time-based prep/refresher delivery; brief requires 15-minute cadence and no provider push channel is wired
INSERT INTO public.cron_tokens (name) VALUES ('calendar-sync') ON CONFLICT (name) DO NOTHING;

SELECT cron.schedule(
  'calendar-sync-15min',
  '*/15 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://project--070ffcc7-e65f-4fa4-9ddc-329ad3739349.lovable.app/api/public/cron/calendar-sync',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (SELECT token FROM public.cron_tokens WHERE name = 'calendar-sync')
    ),
    body := '{}'::jsonb
  );
  $$
);