CREATE TABLE public.cron_tokens (
  name text PRIMARY KEY,
  token text NOT NULL DEFAULT encode(extensions.gen_random_bytes(24), 'hex'),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT ALL ON public.cron_tokens TO service_role;

ALTER TABLE public.cron_tokens ENABLE ROW LEVEL SECURITY;

INSERT INTO public.cron_tokens (name) VALUES ('weekly-unlock');

CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

SELECT cron.schedule(
  'weekly-unlock-emails',
  '0 8 * * *',
  $$
  SELECT net.http_post(
    url := 'https://project--070ffcc7-e65f-4fa4-9ddc-329ad3739349.lovable.app/api/public/cron/weekly-unlock',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (SELECT token FROM public.cron_tokens WHERE name = 'weekly-unlock')
    ),
    body := '{}'::jsonb
  );
  $$
);