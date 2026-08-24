
CREATE TYPE public.app_role AS ENUM ('ta_admin','hiring_manager');

CREATE TABLE public.departments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.departments TO authenticated;
GRANT ALL ON public.departments TO service_role;
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  full_name text,
  department_id uuid REFERENCES public.departments(id) ON DELETE SET NULL,
  level int NOT NULL DEFAULT 1,
  total_xp int NOT NULL DEFAULT 0,
  current_streak int NOT NULL DEFAULT 0,
  longest_streak int NOT NULL DEFAULT 0,
  last_completed_week int,
  last_completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE TABLE public.curriculum_weeks (
  week_number int PRIMARY KEY,
  quarter int NOT NULL,
  topic text NOT NULL,
  fact text NOT NULL,
  status text NOT NULL DEFAULT 'locked',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.curriculum_weeks TO authenticated;
GRANT ALL ON public.curriculum_weeks TO service_role;
ALTER TABLE public.curriculum_weeks ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.question_overrides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  week_number int NOT NULL REFERENCES public.curriculum_weeks(week_number) ON DELETE CASCADE,
  question_index int NOT NULL,
  scenario text NOT NULL,
  options jsonb NOT NULL,
  correct_index int NOT NULL,
  explanation text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (week_number, question_index)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.question_overrides TO authenticated;
GRANT ALL ON public.question_overrides TO service_role;
ALTER TABLE public.question_overrides ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  week_number int NOT NULL REFERENCES public.curriculum_weeks(week_number) ON DELETE CASCADE,
  answers jsonb NOT NULL,
  score int NOT NULL,
  xp_earned int NOT NULL,
  streak_bonus int NOT NULL DEFAULT 0,
  completed_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, week_number)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.responses TO authenticated;
GRANT ALL ON public.responses TO service_role;
ALTER TABLE public.responses ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  department_id uuid REFERENCES public.departments(id) ON DELETE SET NULL,
  token text NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(16),'hex'),
  status text NOT NULL DEFAULT 'pending',
  invited_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.invites TO authenticated;
GRANT ALL ON public.invites TO service_role;
ALTER TABLE public.invites ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.achievements (
  code text PRIMARY KEY,
  name text NOT NULL,
  description text NOT NULL,
  icon text NOT NULL
);
GRANT SELECT ON public.achievements TO authenticated;
GRANT ALL ON public.achievements TO service_role;
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.user_achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_code text NOT NULL REFERENCES public.achievements(code) ON DELETE CASCADE,
  earned_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, achievement_code)
);
GRANT SELECT, INSERT ON public.user_achievements TO authenticated;
GRANT ALL ON public.user_achievements TO service_role;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.org_settings (
  id int PRIMARY KEY DEFAULT 1,
  company_name text NOT NULL DEFAULT 'Your Organisation',
  release_day text NOT NULL DEFAULT 'monday',
  release_time text NOT NULL DEFAULT '08:00',
  current_week int NOT NULL DEFAULT 1,
  setup_complete boolean NOT NULL DEFAULT false,
  CONSTRAINT org_settings_singleton CHECK (id = 1)
);
GRANT SELECT, INSERT, UPDATE ON public.org_settings TO authenticated;
GRANT ALL ON public.org_settings TO service_role;
ALTER TABLE public.org_settings ENABLE ROW LEVEL SECURITY;
INSERT INTO public.org_settings (id) VALUES (1);

-- Policies
CREATE POLICY "departments readable" ON public.departments FOR SELECT TO authenticated USING (true);
CREATE POLICY "departments admin write" ON public.departments FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'ta_admin')) WITH CHECK (public.has_role(auth.uid(),'ta_admin'));

CREATE POLICY "profiles readable" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "profiles insert own" ON public.profiles FOR INSERT TO authenticated WITH CHECK (id = auth.uid());
CREATE POLICY "profiles update own" ON public.profiles FOR UPDATE TO authenticated
  USING (id = auth.uid() OR public.has_role(auth.uid(),'ta_admin'))
  WITH CHECK (id = auth.uid() OR public.has_role(auth.uid(),'ta_admin'));

CREATE POLICY "roles select own or admin" ON public.user_roles FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(),'ta_admin'));

CREATE POLICY "weeks readable" ON public.curriculum_weeks FOR SELECT TO authenticated USING (true);
CREATE POLICY "weeks admin write" ON public.curriculum_weeks FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'ta_admin')) WITH CHECK (public.has_role(auth.uid(),'ta_admin'));

CREATE POLICY "overrides readable" ON public.question_overrides FOR SELECT TO authenticated USING (true);
CREATE POLICY "overrides admin write" ON public.question_overrides FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'ta_admin')) WITH CHECK (public.has_role(auth.uid(),'ta_admin'));

CREATE POLICY "responses own" ON public.responses FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(),'ta_admin'));
CREATE POLICY "responses insert own" ON public.responses FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE POLICY "invites admin" ON public.invites FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'ta_admin')) WITH CHECK (public.has_role(auth.uid(),'ta_admin'));

CREATE POLICY "achievements readable" ON public.achievements FOR SELECT TO authenticated USING (true);

CREATE POLICY "user achievements visible" ON public.user_achievements FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(),'ta_admin'));
CREATE POLICY "user achievements insert own" ON public.user_achievements FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE POLICY "org settings readable" ON public.org_settings FOR SELECT TO authenticated USING (true);
CREATE POLICY "org settings admin update" ON public.org_settings FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(),'ta_admin')) WITH CHECK (public.has_role(auth.uid(),'ta_admin'));

-- New user handling: first ever user becomes TA admin, everyone else a hiring manager
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  is_first boolean;
BEGIN
  SELECT NOT EXISTS (SELECT 1 FROM public.profiles) INTO is_first;
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email,'@',1)))
  ON CONFLICT (id) DO NOTHING;
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, CASE WHEN is_first THEN 'ta_admin'::public.app_role ELSE 'hiring_manager'::public.app_role END)
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

INSERT INTO public.achievements (code, name, description, icon) VALUES
  ('first_session','First Rep','Completed your first weekly simulation','Sparkles'),
  ('flawless','Flawless Panel','Scored 3/3 in a weekly simulation','Target'),
  ('streak_4','Momentum','Four-week completion streak','Flame'),
  ('streak_12','Quarter Committed','Twelve-week completion streak','Trophy'),
  ('bias_slayer','Bias Slayer','Completed five bias mitigation weeks','ShieldCheck'),
  ('experience_champion','Experience Champion','Completed five candidate experience weeks','Heart'),
  ('bar_raiser','Bar Raiser','Reached level 8','Crown');
