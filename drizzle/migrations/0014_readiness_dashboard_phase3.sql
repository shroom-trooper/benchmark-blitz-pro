-- Phase 3: TA readiness dashboard (additive only)
CREATE TABLE public.readiness_exports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  group_id uuid REFERENCES public.groups(id) ON DELETE SET NULL,
  export_type text NOT NULL CHECK (export_type IN ('interview_operations','team_capability','individual_capability')),
  range_from timestamptz,
  range_to timestamptz,
  row_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.readiness_exports TO service_role;
ALTER TABLE public.readiness_exports ENABLE ROW LEVEL SECURITY;
COMMENT ON TABLE public.readiness_exports IS 'Audit log of privacy-safe readiness CSV exports. Server-only.';

ALTER TABLE public.prep_questions ADD COLUMN IF NOT EXISTS selection_reason text;
COMMENT ON COLUMN public.prep_questions.selection_reason IS 'Safe selection explanation: interview_relevance | development_area | spaced_reinforcement | capability_coverage | calibration | fallback';

CREATE INDEX IF NOT EXISTS capability_evidence_user_recorded_idx ON public.capability_evidence (user_id, recorded_at);
CREATE INDEX IF NOT EXISTS interview_events_interviewer_starts_idx ON public.interview_events (interviewer_id, starts_at);
CREATE INDEX IF NOT EXISTS interview_events_group_starts_idx ON public.interview_events (group_id, starts_at);
CREATE INDEX IF NOT EXISTS prep_sessions_interview_event_idx ON public.prep_sessions (interview_event_id);
CREATE INDEX IF NOT EXISTS prep_sessions_interviewer_idx ON public.prep_sessions (interviewer_id, generated_at);
CREATE INDEX IF NOT EXISTS notification_deliveries_event_status_idx ON public.notification_deliveries (interview_event_id, status);
