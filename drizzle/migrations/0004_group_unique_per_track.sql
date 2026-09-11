-- A lead may own one group per track (interviewer + recruiter), not one overall.
DROP INDEX IF EXISTS public.groups_owner_unique;
CREATE UNIQUE INDEX IF NOT EXISTS groups_owner_track_unique
  ON public.groups(owner_id, track);