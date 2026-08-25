CREATE TABLE public.assessments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  source text NOT NULL DEFAULT 'manual',
  target_questions integer NOT NULL DEFAULT 5,
  estimated_minutes integer NOT NULL DEFAULT 5,
  status text NOT NULL DEFAULT 'draft',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.assessments TO authenticated;
GRANT ALL ON public.assessments TO service_role;
ALTER TABLE public.assessments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "assessments owner all" ON public.assessments FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.groups g WHERE g.id = assessments.group_id AND g.owner_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.groups g WHERE g.id = assessments.group_id AND g.owner_id = auth.uid()));

CREATE POLICY "assessments members read published" ON public.assessments FOR SELECT TO authenticated
  USING (status = 'published' AND public.is_group_member(group_id, auth.uid()));

CREATE TRIGGER assessments_updated_at BEFORE UPDATE ON public.assessments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.assessment_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id uuid NOT NULL REFERENCES public.assessments(id) ON DELETE CASCADE,
  position integer NOT NULL,
  scenario text NOT NULL,
  options jsonb NOT NULL,
  correct_index integer NOT NULL,
  explanation text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (assessment_id, position)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.assessment_questions TO authenticated;
GRANT ALL ON public.assessment_questions TO service_role;
ALTER TABLE public.assessment_questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "assessment questions owner all" ON public.assessment_questions FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.assessments a JOIN public.groups g ON g.id = a.group_id
                 WHERE a.id = assessment_questions.assessment_id AND g.owner_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.assessments a JOIN public.groups g ON g.id = a.group_id
                 WHERE a.id = assessment_questions.assessment_id AND g.owner_id = auth.uid()));

CREATE POLICY "assessment questions members read" ON public.assessment_questions FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.assessments a
                 WHERE a.id = assessment_questions.assessment_id
                   AND a.status = 'published'
                   AND public.is_group_member(a.group_id, auth.uid())));

CREATE TRIGGER assessment_questions_updated_at BEFORE UPDATE ON public.assessment_questions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.assessment_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id uuid NOT NULL REFERENCES public.assessments(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  answers jsonb NOT NULL,
  score integer NOT NULL,
  xp_earned integer NOT NULL DEFAULT 0,
  completed_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (assessment_id, user_id)
);

GRANT SELECT, INSERT ON public.assessment_responses TO authenticated;
GRANT ALL ON public.assessment_responses TO service_role;
ALTER TABLE public.assessment_responses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "assessment responses insert own" ON public.assessment_responses FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid()
    AND EXISTS (SELECT 1 FROM public.assessments a
                WHERE a.id = assessment_responses.assessment_id
                  AND a.status = 'published'
                  AND public.is_group_member(a.group_id, auth.uid())));

CREATE POLICY "assessment responses read own or owner" ON public.assessment_responses FOR SELECT TO authenticated
  USING (user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.assessments a JOIN public.groups g ON g.id = a.group_id
               WHERE a.id = assessment_responses.assessment_id AND g.owner_id = auth.uid()));