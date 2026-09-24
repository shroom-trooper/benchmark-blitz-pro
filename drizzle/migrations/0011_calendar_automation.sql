CREATE TABLE public.app_user_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  connector_id text NOT NULL,
  connection_key_ciphertext text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, connector_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.app_user_connections TO service_role;
ALTER TABLE public.app_user_connections ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.calendar_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider text NOT NULL CHECK (provider IN ('microsoft','google')),
  provider_account_id text,
  provider_email text,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','needs_reauthorization','disconnected','error')),
  scopes jsonb NOT NULL DEFAULT '[]'::jsonb,
  connected_at timestamptz NOT NULL DEFAULT now(),
  last_successful_sync_at timestamptz,
  last_sync_attempt_at timestamptz,
  last_error_code text,
  last_error_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, provider)
);
GRANT SELECT ON public.calendar_connections TO authenticated;
GRANT ALL ON public.calendar_connections TO service_role;
ALTER TABLE public.calendar_connections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own calendar connections" ON public.calendar_connections FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE TABLE public.calendar_sync_state (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  calendar_connection_id uuid NOT NULL REFERENCES public.calendar_connections(id) ON DELETE CASCADE,
  external_calendar_id text NOT NULL DEFAULT 'primary',
  delta_token text,
  last_window_start timestamptz,
  last_window_end timestamptz,
  last_successful_sync_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (calendar_connection_id, external_calendar_id)
);
GRANT ALL ON public.calendar_sync_state TO service_role;
ALTER TABLE public.calendar_sync_state ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.normalized_calendar_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  calendar_connection_id uuid NOT NULL REFERENCES public.calendar_connections(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  external_event_id text NOT NULL,
  external_calendar_id text NOT NULL DEFAULT 'primary',
  subject text,
  sanitized_description text,
  starts_at timestamptz NOT NULL,
  ends_at timestamptz NOT NULL,
  timezone text,
  organizer_identifier text,
  attendee_count integer,
  meeting_url text,
  is_cancelled boolean NOT NULL DEFAULT false,
  is_recurring boolean NOT NULL DEFAULT false,
  provider_last_modified_at timestamptz,
  classification_status text NOT NULL DEFAULT 'pending' CHECK (classification_status IN ('pending','likely_interview','possible_interview','not_interview','needs_confirmation','confirmed','dismissed')),
  linked_interview_event_id uuid REFERENCES public.interview_events(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (calendar_connection_id, external_event_id)
);
CREATE INDEX normalized_calendar_events_user_idx ON public.normalized_calendar_events (user_id, starts_at);
GRANT SELECT ON public.normalized_calendar_events TO authenticated;
GRANT ALL ON public.normalized_calendar_events TO service_role;
ALTER TABLE public.normalized_calendar_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own calendar events" ON public.normalized_calendar_events FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE TABLE public.interview_classifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  normalized_calendar_event_id uuid NOT NULL UNIQUE REFERENCES public.normalized_calendar_events(id) ON DELETE CASCADE,
  classification text NOT NULL CHECK (classification IN ('likely_interview','possible_interview','not_interview','needs_confirmation')),
  confidence_score numeric NOT NULL DEFAULT 0,
  detected_role_title text,
  detected_candidate_display_name text,
  detected_interview_stage text,
  detected_competencies jsonb NOT NULL DEFAULT '[]'::jsonb,
  detection_reasons jsonb NOT NULL DEFAULT '[]'::jsonb,
  classifier_version text NOT NULL,
  confirmed_by_user boolean NOT NULL DEFAULT false,
  confirmed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.interview_classifications TO service_role;
ALTER TABLE public.interview_classifications ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.calendar_event_attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  normalized_calendar_event_id uuid NOT NULL REFERENCES public.normalized_calendar_events(id) ON DELETE CASCADE,
  external_attachment_id text NOT NULL,
  attachment_type text NOT NULL,
  filename text NOT NULL,
  mime_type text,
  byte_size integer,
  document_classification text,
  processing_status text NOT NULL DEFAULT 'discovered' CHECK (processing_status IN ('discovered','unsupported','approved','processing','extracted','failed','purged')),
  approved_for_generation boolean NOT NULL DEFAULT false,
  extraction_metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  processing_error_code text,
  retention_expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (normalized_calendar_event_id, external_attachment_id)
);
GRANT ALL ON public.calendar_event_attachments TO service_role;
ALTER TABLE public.calendar_event_attachments ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.calendar_attachment_content (
  attachment_id uuid PRIMARY KEY REFERENCES public.calendar_event_attachments(id) ON DELETE CASCADE,
  extracted_text text NOT NULL,
  retention_expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.calendar_attachment_content TO service_role;
ALTER TABLE public.calendar_attachment_content ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.preparation_schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  interview_event_id uuid NOT NULL UNIQUE REFERENCES public.interview_events(id) ON DELETE CASCADE,
  prep_session_id uuid REFERENCES public.prep_sessions(id) ON DELETE SET NULL,
  preparation_delivery_at timestamptz NOT NULL,
  refresher_delivery_at timestamptz,
  preparation_status text NOT NULL DEFAULT 'scheduled' CHECK (preparation_status IN ('scheduled','delivered','skipped','cancelled','failed','completed')),
  refresher_status text NOT NULL DEFAULT 'skipped' CHECK (refresher_status IN ('scheduled','delivered','skipped','cancelled','failed','completed')),
  source_timezone text NOT NULL DEFAULT 'UTC',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.preparation_schedules TO service_role;
ALTER TABLE public.preparation_schedules ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.notification_preferences (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  calendar_detection_enabled boolean NOT NULL DEFAULT true,
  email_preparation_enabled boolean NOT NULL DEFAULT false,
  email_refresher_enabled boolean NOT NULL DEFAULT false,
  preparation_lead_minutes integer NOT NULL DEFAULT 1440 CHECK (preparation_lead_minutes BETWEEN 30 AND 10080),
  refresher_lead_minutes integer NOT NULL DEFAULT 20 CHECK (refresher_lead_minutes BETWEEN 5 AND 240),
  quiet_hours_start smallint CHECK (quiet_hours_start BETWEEN 0 AND 23),
  quiet_hours_end smallint CHECK (quiet_hours_end BETWEEN 0 AND 23),
  timezone text NOT NULL DEFAULT 'UTC',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.notification_preferences TO authenticated;
GRANT ALL ON public.notification_preferences TO service_role;
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own prefs read" ON public.notification_preferences FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "own prefs insert" ON public.notification_preferences FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "own prefs update" ON public.notification_preferences FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE TABLE public.notification_deliveries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  interview_event_id uuid NOT NULL REFERENCES public.interview_events(id) ON DELETE CASCADE,
  prep_session_id uuid REFERENCES public.prep_sessions(id) ON DELETE SET NULL,
  notification_type text NOT NULL CHECK (notification_type IN ('preparation','refresher')),
  channel text NOT NULL DEFAULT 'email' CHECK (channel IN ('email')),
  scheduled_for timestamptz NOT NULL,
  attempted_at timestamptz,
  delivered_at timestamptz,
  failed_at timestamptz,
  status text NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled','processing','delivered','failed','cancelled','skipped')),
  provider_message_id text,
  error_code text,
  retry_count integer NOT NULL DEFAULT 0,
  idempotency_key text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX notification_deliveries_due_idx ON public.notification_deliveries (status, scheduled_for);
GRANT ALL ON public.notification_deliveries TO service_role;
ALTER TABLE public.notification_deliveries ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.interview_events ADD COLUMN source_calendar_event_id uuid REFERENCES public.normalized_calendar_events(id) ON DELETE SET NULL;
ALTER TABLE public.interview_events ADD COLUMN confirmation_status text NOT NULL DEFAULT 'confirmed' CHECK (confirmation_status IN ('draft','confirmed'));