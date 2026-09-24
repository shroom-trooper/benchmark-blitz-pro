CREATE TYPE public.org_role AS ENUM ('participant','ta_admin','content_reviewer','organization_admin');

CREATE TABLE public.organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  created_by uuid NOT NULL,
  single_reviewer_exception boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX organizations_created_by_uq ON public.organizations(created_by);

CREATE TABLE public.organization_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  role public.org_role NOT NULL,
  granted_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, user_id, role)
);
CREATE INDEX organization_roles_user_idx ON public.organization_roles(user_id);

ALTER TABLE public.groups ADD COLUMN organization_id uuid REFERENCES public.organizations(id);

-- Backfill: one organization per group owner.
INSERT INTO public.organizations (name, created_by)
SELECT COALESCE(NULLIF(p.display_name,''), NULLIF(p.full_name,''), split_part(p.email,'@',1)) || '''s organization', g.owner_id
FROM (SELECT DISTINCT owner_id FROM public.groups) g
JOIN public.profiles p ON p.id = g.owner_id
ON CONFLICT DO NOTHING;
UPDATE public.groups g SET organization_id = o.id FROM public.organizations o WHERE o.created_by = g.owner_id AND g.organization_id IS NULL;
INSERT INTO public.organization_roles (organization_id, user_id, role)
SELECT id, created_by, 'organization_admin' FROM public.organizations ON CONFLICT DO NOTHING;
INSERT INTO public.organization_roles (organization_id, user_id, role)
SELECT g.organization_id, p.id, 'participant' FROM public.profiles p JOIN public.groups g ON g.id = p.group_id
WHERE g.organization_id IS NOT NULL AND p.id <> g.owner_id ON CONFLICT DO NOTHING;

-- Permission helpers
CREATE OR REPLACE FUNCTION public.org_role_permissions(_role public.org_role)
RETURNS text[] LANGUAGE sql IMMUTABLE SET search_path = public AS $$
  SELECT CASE _role
    WHEN 'participant' THEN ARRAY['interviews.read_own','preparation.complete_own','preparation.read_own','capability.read_own','questions.flag']
    WHEN 'ta_admin' THEN ARRAY['interviews.read_team','interviews.manage_team','preparation.read_team_status','capability.read_team','capability.export_team','members.read','members.manage','content.create','content.edit_draft','content.submit_review','content.read','integrations.view_health','exports.create','question_flags.read']
    WHEN 'content_reviewer' THEN ARRAY['content.read','content.review','content.approve','content.publish','content.retire','content.suspend_scoring','question_flags.read','question_flags.resolve']
    WHEN 'organization_admin' THEN ARRAY['roles.assign','principles.manage','integrations.manage','retention.manage','deletion.execute','audit.read','organization.manage',
      'interviews.read_team','interviews.manage_team','preparation.read_team_status','capability.read_team','capability.export_team','members.read','members.manage','content.create','content.edit_draft','content.submit_review','content.read','integrations.view_health','exports.create',
      'content.review','content.approve','content.publish','content.retire','content.suspend_scoring','question_flags.read','question_flags.resolve']
  END
$$;

CREATE OR REPLACE FUNCTION public.has_org_permission(_user uuid, _org uuid, _perm text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.organization_roles r
    WHERE r.user_id = _user AND r.organization_id = _org AND _perm = ANY(public.org_role_permissions(r.role)))
$$;
CREATE OR REPLACE FUNCTION public.is_org_member(_user uuid, _org uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.organization_roles WHERE user_id = _user AND organization_id = _org)
$$;
REVOKE ALL ON FUNCTION public.has_org_permission(uuid,uuid,text) FROM public, anon;
REVOKE ALL ON FUNCTION public.is_org_member(uuid,uuid) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.has_org_permission(uuid,uuid,text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_org_member(uuid,uuid) TO authenticated, service_role;

GRANT SELECT ON public.organizations TO authenticated; GRANT ALL ON public.organizations TO service_role;
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members read their organization" ON public.organizations FOR SELECT TO authenticated USING (public.is_org_member(auth.uid(), id));

GRANT SELECT ON public.organization_roles TO authenticated; GRANT ALL ON public.organization_roles TO service_role;
ALTER TABLE public.organization_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read own roles" ON public.organization_roles FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Role admins read org roles" ON public.organization_roles FOR SELECT TO authenticated USING (public.has_org_permission(auth.uid(), organization_id, 'members.read'));

-- Company principles (versioned)
CREATE TABLE public.company_principles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  principle_key uuid NOT NULL DEFAULT gen_random_uuid(),
  version_number integer NOT NULL DEFAULT 1,
  title text NOT NULL,
  body text NOT NULL,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','superseded','retired')),
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (principle_key, version_number)
);
GRANT SELECT ON public.company_principles TO authenticated; GRANT ALL ON public.company_principles TO service_role;
ALTER TABLE public.company_principles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Org members read principles" ON public.company_principles FOR SELECT TO authenticated USING (public.is_org_member(auth.uid(), organization_id));

-- Question governance
CREATE TABLE public.question_definitions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE,
  lineage_question_id uuid REFERENCES public.question_definitions(id),
  content_scope text NOT NULL DEFAULT 'organization' CHECK (content_scope IN ('organization','core','adaptation')),
  current_status text NOT NULL DEFAULT 'draft' CHECK (current_status IN ('draft','in_review','changes_requested','approved','published','suspended','retired','rejected')),
  status_reason text,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX question_definitions_org_idx ON public.question_definitions(organization_id, current_status);

CREATE TABLE public.question_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question_definition_id uuid NOT NULL REFERENCES public.question_definitions(id) ON DELETE CASCADE,
  version_number integer NOT NULL,
  scenario text NOT NULL,
  options jsonb NOT NULL,
  correct_index integer NOT NULL,
  explanation text NOT NULL,
  capability_area text NOT NULL,
  sub_skill text NOT NULL,
  difficulty text NOT NULL DEFAULT 'standard',
  interview_stages jsonb NOT NULL DEFAULT '[]'::jsonb,
  role_families jsonb NOT NULL DEFAULT '[]'::jsonb,
  source_references jsonb NOT NULL DEFAULT '[]'::jsonb,
  risk_level text NOT NULL DEFAULT 'standard' CHECK (risk_level IN ('standard','elevated','high')),
  generated_by_ai boolean NOT NULL DEFAULT false,
  generation_version text,
  provenance jsonb NOT NULL DEFAULT '{}'::jsonb,
  validation jsonb NOT NULL DEFAULT '{}'::jsonb,
  locked boolean NOT NULL DEFAULT false,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (question_definition_id, version_number)
);

CREATE OR REPLACE FUNCTION public.prevent_locked_version_edit() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF OLD.locked AND (NEW.scenario, NEW.options, NEW.correct_index, NEW.explanation, NEW.capability_area, NEW.sub_skill, NEW.difficulty, NEW.risk_level)
     IS DISTINCT FROM (OLD.scenario, OLD.options, OLD.correct_index, OLD.explanation, OLD.capability_area, OLD.sub_skill, OLD.difficulty, OLD.risk_level) THEN
    RAISE EXCEPTION 'Locked question versions are immutable; create a new version';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER question_versions_immutable BEFORE UPDATE ON public.question_versions FOR EACH ROW EXECUTE FUNCTION public.prevent_locked_version_edit();

CREATE TABLE public.question_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question_version_id uuid NOT NULL REFERENCES public.question_versions(id) ON DELETE CASCADE,
  reviewer_id uuid NOT NULL,
  decision text NOT NULL CHECK (decision IN ('approved','changes_requested','rejected')),
  review_checklist jsonb NOT NULL DEFAULT '{}'::jsonb,
  feedback text,
  single_reviewer_exception boolean NOT NULL DEFAULT false,
  exception_reason text,
  reviewed_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.question_publications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question_version_id uuid NOT NULL REFERENCES public.question_versions(id) ON DELETE CASCADE,
  scope text NOT NULL DEFAULT 'organization',
  published_by uuid NOT NULL,
  published_at timestamptz NOT NULL DEFAULT now(),
  unpublished_at timestamptz
);
CREATE TABLE public.question_flags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE,
  prep_question_id uuid REFERENCES public.prep_questions(id) ON DELETE SET NULL,
  question_version_id uuid REFERENCES public.question_versions(id) ON DELETE SET NULL,
  reporter_id uuid NOT NULL,
  reason text NOT NULL CHECK (reason IN ('unclear','incorrect','biased','inappropriate','other')),
  comment text,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open','under_review','dismissed','confirmed_invalid','fixed')),
  resolution_note text,
  resolved_by uuid,
  resolved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (prep_question_id, reporter_id)
);
CREATE INDEX question_flags_org_idx ON public.question_flags(organization_id, status);

CREATE TABLE public.evidence_invalidations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE,
  prep_question_id uuid REFERENCES public.prep_questions(id) ON DELETE SET NULL,
  question_version_id uuid REFERENCES public.question_versions(id) ON DELETE SET NULL,
  flag_id uuid REFERENCES public.question_flags(id) ON DELETE SET NULL,
  reason text NOT NULL,
  affected_evidence integer NOT NULL DEFAULT 0,
  invalidated_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  reversed_at timestamptz,
  reversed_by uuid
);

ALTER TABLE public.prep_questions ADD COLUMN question_version_id uuid REFERENCES public.question_versions(id) ON DELETE SET NULL;
ALTER TABLE public.prep_questions ADD COLUMN provenance jsonb NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE public.capability_evidence ADD COLUMN invalidated_at timestamptz;
ALTER TABLE public.capability_evidence ADD COLUMN invalidation_id uuid REFERENCES public.evidence_invalidations(id) ON DELETE SET NULL;
CREATE INDEX capability_evidence_valid_idx ON public.capability_evidence(user_id) WHERE invalidated_at IS NULL;

-- Retention & deletion
CREATE TABLE public.retention_policies (
  organization_id uuid PRIMARY KEY REFERENCES public.organizations(id) ON DELETE CASCADE,
  candidate_context_days integer NOT NULL DEFAULT 30 CHECK (candidate_context_days BETWEEN 1 AND 365),
  attachment_text_days integer NOT NULL DEFAULT 7 CHECK (attachment_text_days BETWEEN 1 AND 90),
  calendar_details_days integer NOT NULL DEFAULT 90 CHECK (calendar_details_days BETWEEN 7 AND 730),
  audit_days integer NOT NULL DEFAULT 730 CHECK (audit_days BETWEEN 365 AND 2555),
  updated_by uuid,
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.deletion_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  requested_by uuid NOT NULL,
  subject_type text NOT NULL CHECK (subject_type IN ('interview_context','participant_account_data')),
  subject_id uuid NOT NULL,
  reason text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','completed','rejected')),
  result jsonb NOT NULL DEFAULT '{}'::jsonb,
  processed_by uuid,
  processed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Audit (append-only)
CREATE TABLE public.audit_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES public.organizations(id) ON DELETE SET NULL,
  actor_id uuid,
  action text NOT NULL,
  target_type text NOT NULL,
  target_id text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX audit_events_org_idx ON public.audit_events(organization_id, created_at DESC);
CREATE OR REPLACE FUNCTION public.audit_append_only() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN RAISE EXCEPTION 'Audit events are append-only'; END $$;
CREATE TRIGGER audit_events_no_update BEFORE UPDATE ON public.audit_events FOR EACH ROW EXECUTE FUNCTION public.audit_append_only();

CREATE TABLE public.support_access_grants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  support_user_id uuid NOT NULL,
  reason text NOT NULL,
  scope text NOT NULL DEFAULT 'technical_status' CHECK (scope IN ('technical_status')),
  approved_by uuid NOT NULL,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  revoked_at timestamptz
);

-- Grants + RLS: governance tables are read through server functions; browser read only where scoped.
GRANT SELECT ON public.question_definitions, public.question_versions, public.question_reviews, public.question_publications TO authenticated;
GRANT ALL ON public.question_definitions, public.question_versions, public.question_reviews, public.question_publications, public.question_flags,
  public.evidence_invalidations, public.retention_policies, public.deletion_requests, public.audit_events, public.support_access_grants TO service_role;
GRANT SELECT ON public.question_flags TO authenticated;
ALTER TABLE public.question_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.question_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.question_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.question_publications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.question_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evidence_invalidations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.retention_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deletion_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_access_grants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Content readers read definitions" ON public.question_definitions FOR SELECT TO authenticated
  USING (organization_id IS NOT NULL AND public.has_org_permission(auth.uid(), organization_id, 'content.read'));
CREATE POLICY "Content readers read versions" ON public.question_versions FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.question_definitions d WHERE d.id = question_definition_id AND d.organization_id IS NOT NULL AND public.has_org_permission(auth.uid(), d.organization_id, 'content.read')));
CREATE POLICY "Content readers read reviews" ON public.question_reviews FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.question_versions v JOIN public.question_definitions d ON d.id = v.question_definition_id WHERE v.id = question_version_id AND public.has_org_permission(auth.uid(), d.organization_id, 'content.read')));
CREATE POLICY "Content readers read publications" ON public.question_publications FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.question_versions v JOIN public.question_definitions d ON d.id = v.question_definition_id WHERE v.id = question_version_id AND public.has_org_permission(auth.uid(), d.organization_id, 'content.read')));
CREATE POLICY "Reporters read own flags" ON public.question_flags FOR SELECT TO authenticated USING (reporter_id = auth.uid());
CREATE POLICY "Flag readers read org flags" ON public.question_flags FOR SELECT TO authenticated
  USING (organization_id IS NOT NULL AND public.has_org_permission(auth.uid(), organization_id, 'question_flags.read'));