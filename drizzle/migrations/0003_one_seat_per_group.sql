-- Free groups now carry a single seat per track. Groups that already hold more
-- members than that keep their current member count so nobody loses access.
UPDATE public.groups g
SET member_limit = GREATEST(
  1,
  (SELECT count(*) FROM public.profiles p WHERE p.group_id = g.id AND p.id <> g.owner_id)
)
WHERE g.member_limit <> GREATEST(
  1,
  (SELECT count(*) FROM public.profiles p WHERE p.group_id = g.id AND p.id <> g.owner_id)
);