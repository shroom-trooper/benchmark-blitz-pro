ALTER TABLE public.curriculum_weeks ADD COLUMN IF NOT EXISTS focus text NOT NULL DEFAULT '';

CREATE TABLE public.group_electives (
  group_id uuid NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  module_slug text NOT NULL,
  enabled_by uuid REFERENCES auth.users(id),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  PRIMARY KEY (group_id, module_slug)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.group_electives TO authenticated;
GRANT ALL ON public.group_electives TO service_role;

ALTER TABLE public.group_electives ENABLE ROW LEVEL SECURITY;

CREATE POLICY "group electives readable by members"
ON public.group_electives FOR SELECT TO authenticated
USING (public.is_group_member(group_id, auth.uid()));

CREATE POLICY "group electives managed by owner"
ON public.group_electives FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM public.groups g WHERE g.id = group_electives.group_id AND g.owner_id = auth.uid()))
WITH CHECK (EXISTS (SELECT 1 FROM public.groups g WHERE g.id = group_electives.group_id AND g.owner_id = auth.uid()));

CREATE TABLE public.elective_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  module_slug text NOT NULL,
  lesson_slug text NOT NULL,
  answers jsonb NOT NULL,
  score integer NOT NULL,
  xp_earned integer NOT NULL DEFAULT 0,
  completed_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (user_id, lesson_slug)
);

GRANT SELECT, INSERT ON public.elective_responses TO authenticated;
GRANT ALL ON public.elective_responses TO service_role;

ALTER TABLE public.elective_responses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "elective responses insert own"
ON public.elective_responses FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "elective responses read own or group owner"
ON public.elective_responses FOR SELECT TO authenticated
USING (
  user_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.profiles p
    JOIN public.groups g ON g.id = p.group_id
    WHERE p.id = elective_responses.user_id AND g.owner_id = auth.uid()
  )
);

CREATE INDEX idx_elective_responses_user ON public.elective_responses(user_id);
CREATE INDEX idx_elective_responses_module ON public.elective_responses(module_slug);