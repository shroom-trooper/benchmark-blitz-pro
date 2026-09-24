CREATE TABLE public.interview_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid REFERENCES public.groups(id) ON DELETE SET NULL,
  interviewer_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  source text NOT NULL DEFAULT 'manual' CHECK (source IN ('manual','calendar','ats')),
  external_event_id text,
  external_ats_id text,
  role_title text NOT NULL,
  candidate_display_name text NOT NULL,
  interview_stage text NOT NULL,
  starts_at timestamptz NOT NULL,
  duration_minutes integer,
  status text NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled','completed','cancelled')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX interview_events_external_unique ON public.interview_events (interviewer_id, source, external_event_id) WHERE external_event_id IS NOT NULL;
CREATE INDEX interview_events_interviewer_idx ON public.interview_events (interviewer_id, starts_at);
CREATE INDEX interview_events_group_idx ON public.interview_events (group_id, starts_at);
GRANT SELECT, INSERT, UPDATE ON public.interview_events TO authenticated;
GRANT ALL ON public.interview_events TO service_role;
ALTER TABLE public.interview_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own interviews select" ON public.interview_events FOR SELECT TO authenticated USING (interviewer_id = auth.uid());
CREATE POLICY "Own interviews insert" ON public.interview_events FOR INSERT TO authenticated WITH CHECK (interviewer_id = auth.uid() AND created_by = auth.uid() AND source = 'manual');
CREATE POLICY "Own interviews update" ON public.interview_events FOR UPDATE TO authenticated USING (interviewer_id = auth.uid()) WITH CHECK (interviewer_id = auth.uid());
CREATE TRIGGER interview_events_updated_at BEFORE UPDATE ON public.interview_events FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.interview_contexts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  interview_event_id uuid NOT NULL UNIQUE REFERENCES public.interview_events(id) ON DELETE CASCADE,
  job_description_text text,
  candidate_profile_text text,
  interviewer_responsibility text,
  competencies jsonb NOT NULL DEFAULT '[]'::jsonb,
  company_principles jsonb NOT NULL DEFAULT '[]'::jsonb,
  context_sources jsonb NOT NULL DEFAULT '[]'::jsonb,
  context_completeness_score integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.interview_contexts TO authenticated;
GRANT ALL ON public.interview_contexts TO service_role;
ALTER TABLE public.interview_contexts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own context select" ON public.interview_contexts FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.interview_events e WHERE e.id = interview_event_id AND e.interviewer_id = auth.uid()));
CREATE POLICY "Own context insert" ON public.interview_contexts FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM public.interview_events e WHERE e.id = interview_event_id AND e.interviewer_id = auth.uid()));
CREATE POLICY "Own context update" ON public.interview_contexts FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM public.interview_events e WHERE e.id = interview_event_id AND e.interviewer_id = auth.uid()));
CREATE TRIGGER interview_contexts_updated_at BEFORE UPDATE ON public.interview_contexts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.prep_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  interview_event_id uuid NOT NULL REFERENCES public.interview_events(id) ON DELETE CASCADE,
  interviewer_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'generated' CHECK (status IN ('generated','started','completed','expired')),
  scheduled_delivery_at timestamptz,
  reminder_at timestamptz,
  generated_at timestamptz NOT NULL DEFAULT now(),
  started_at timestamptz,
  completed_at timestamptz,
  estimated_minutes integer NOT NULL DEFAULT 4,
  generation_version text NOT NULL DEFAULT 'v1',
  used_fallback boolean NOT NULL DEFAULT false,
  overall_score integer,
  total_questions integer NOT NULL,
  correct_answers integer
);
CREATE INDEX prep_sessions_event_idx ON public.prep_sessions (interview_event_id);
CREATE INDEX prep_sessions_interviewer_idx ON public.prep_sessions (interviewer_id, completed_at);
GRANT SELECT ON public.prep_sessions TO authenticated;
GRANT ALL ON public.prep_sessions TO service_role;
ALTER TABLE public.prep_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own prep select" ON public.prep_sessions FOR SELECT TO authenticated USING (interviewer_id = auth.uid());

CREATE TABLE public.prep_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  prep_session_id uuid NOT NULL REFERENCES public.prep_sessions(id) ON DELETE CASCADE,
  position integer NOT NULL,
  scenario text NOT NULL,
  options jsonb NOT NULL,
  correct_index integer NOT NULL,
  explanation text NOT NULL,
  capability_area text NOT NULL CHECK (capability_area IN ('structured_evaluation','bias_mitigation','candidate_experience','decision_quality')),
  sub_skill text NOT NULL,
  interview_stage text,
  difficulty text NOT NULL DEFAULT 'standard' CHECK (difficulty IN ('foundation','standard','advanced')),
  context_source text NOT NULL DEFAULT 'ai',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (prep_session_id, position)
);
CREATE INDEX prep_questions_session_idx ON public.prep_questions (prep_session_id);
GRANT ALL ON public.prep_questions TO service_role;
ALTER TABLE public.prep_questions ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.prep_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  prep_session_id uuid NOT NULL REFERENCES public.prep_sessions(id) ON DELETE CASCADE,
  prep_question_id uuid NOT NULL UNIQUE REFERENCES public.prep_questions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  selected_index integer NOT NULL,
  is_correct boolean NOT NULL,
  answered_at timestamptz NOT NULL DEFAULT now(),
  response_time_seconds integer
);
CREATE INDEX prep_responses_session_idx ON public.prep_responses (prep_session_id);
GRANT SELECT ON public.prep_responses TO authenticated;
GRANT ALL ON public.prep_responses TO service_role;
ALTER TABLE public.prep_responses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own responses select" ON public.prep_responses FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE TABLE public.capability_evidence (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  prep_session_id uuid REFERENCES public.prep_sessions(id) ON DELETE CASCADE,
  prep_question_id uuid UNIQUE REFERENCES public.prep_questions(id) ON DELETE CASCADE,
  capability_area text NOT NULL CHECK (capability_area IN ('structured_evaluation','bias_mitigation','candidate_experience','decision_quality')),
  sub_skill text NOT NULL,
  is_correct boolean NOT NULL,
  difficulty text NOT NULL DEFAULT 'standard',
  evidence_weight numeric NOT NULL DEFAULT 1,
  recorded_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX capability_evidence_user_idx ON public.capability_evidence (user_id, capability_area, recorded_at);
GRANT SELECT ON public.capability_evidence TO authenticated;
GRANT ALL ON public.capability_evidence TO service_role;
ALTER TABLE public.capability_evidence ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own evidence select" ON public.capability_evidence FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE TABLE public.user_capability_progress (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  capability_area text NOT NULL CHECK (capability_area IN ('structured_evaluation','bias_mitigation','candidate_experience','decision_quality')),
  total_questions integer NOT NULL DEFAULT 0,
  correct_answers integer NOT NULL DEFAULT 0,
  weighted_score integer NOT NULL DEFAULT 0,
  evidence_confidence text NOT NULL DEFAULT 'insufficient',
  mastery_stage text NOT NULL DEFAULT 'building',
  last_evidence_at timestamptz,
  recent_direction text NOT NULL DEFAULT 'steady',
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, capability_area)
);
GRANT SELECT ON public.user_capability_progress TO authenticated;
GRANT ALL ON public.user_capability_progress TO service_role;
ALTER TABLE public.user_capability_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own progress select" ON public.user_capability_progress FOR SELECT TO authenticated USING (user_id = auth.uid());

ALTER TABLE public.user_achievements ADD COLUMN IF NOT EXISTS capability_area text;
ALTER TABLE public.user_achievements ADD COLUMN IF NOT EXISTS evidence_snapshot jsonb;
CREATE UNIQUE INDEX IF NOT EXISTS user_achievements_user_code_unique ON public.user_achievements (user_id, achievement_code);

INSERT INTO public.achievements (code, name, description, icon) VALUES
 ('prep_first','First preparation','Completed your first interview preparation','sparkles'),
 ('prep_5','Consistent preparer','Completed 5 interview preparations','calendar-check'),
 ('prep_10','Seasoned preparer','Completed 10 interview preparations','award'),
 ('prep_advance_3','Always ready','Prepared at least an hour ahead for 3 interviews','clock'),
 ('prep_perfect','Sharp judgement','Answered every question in a preparation correctly','target'),
 ('area_proficient','Proficient interviewer','Reached Proficient in a capability area','trending-up'),
 ('all_areas_developing','Well-rounded','Reached Developing in all four capability areas','layers')
ON CONFLICT (code) DO NOTHING;