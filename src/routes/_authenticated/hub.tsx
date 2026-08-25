import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import {
  Flame,
  Lock,
  CheckCircle2,
  Play,
  Sparkles,
  Target,
  Trophy,
  ShieldCheck,
  Heart,
  Crown,
  Lightbulb,
  type LucideIcon,
} from "lucide-react";
import { AppShell, useMe } from "@/components/AppShell";
import { supabase } from "@/integrations/supabase/client";
import {
  acceptInvite,
  createGroup,
  updateDisplayName,
} from "@/lib/benchmark.functions";
import { levelProgress, QUARTER_THEMES, quarterForWeek } from "@/lib/gamification";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/_authenticated/hub")({
  head: () => ({
    meta: [
      { title: "Your training hub · Benchmark" },
      {
        name: "description",
        content:
          "Complete this week's three-question hiring simulation, track your streak, XP and level, and review your curriculum progress.",
      },
      { property: "og:title", content: "Your training hub · Benchmark" },
      {
        property: "og:description",
        content: "Weekly hiring micro-simulations, XP, streaks and levels.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Hub,
});

const ICONS: Record<string, LucideIcon> = {
  Sparkles,
  Target,
  Flame,
  Trophy,
  ShieldCheck,
  Heart,
  Crown,
};

function Hub() {
  const { data: me, isLoading } = useMe();
  const weeksQuery = useQuery({
    queryKey: ["weeks"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("curriculum_weeks")
        .select("*")
        .order("week_number");
      if (error) throw error;
      return data;
    },
  });

  if (isLoading || !me) {
    return (
      <AppShell>
        <Skeleton className="h-48 w-full rounded-xl" />
      </AppShell>
    );
  }

  const currentWeek = me.settings?.current_week ?? 1;
  const completedWeeks = new Set(me.responses.map((r) => r.week_number));
  const weeks = weeksQuery.data ?? [];
  const current = weeks.find((w) => w.week_number === currentWeek);
  const done = completedWeeks.has(currentWeek);
  const lp = levelProgress(me.profile?.total_xp ?? 0);
  const theme = QUARTER_THEMES[quarterForWeek(currentWeek)]!;
  const accuracy = me.responses.length
    ? Math.round(
        (me.responses.reduce((s, r) => s + r.score, 0) / (me.responses.length * 3)) * 100,
      )
    : 0;
  const earned = new Set(me.earned.map((e) => e.achievement_code));

  return (
    <AppShell>
      <div className="space-y-8">
        <section className="rounded-2xl border border-border bg-gradient-to-br from-surface to-surface-2 p-6 sm:p-8">
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div className="max-w-xl">
              <Badge className="bg-primary/15 text-primary hover:bg-primary/15">
                Week {currentWeek} · Q{quarterForWeek(currentWeek)} {theme.name}
              </Badge>
              <h1 className="mt-3 text-3xl">{current?.topic ?? "Curriculum loading"}</h1>
              <p className="mt-2 text-sm leading-relaxed text-body">
                Three scenarios. Roughly four minutes. One week closer to Master Bar
                Raiser.
              </p>
              <div className="mt-6">
                {done ? (
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-2 rounded-lg bg-success/15 px-4 py-2 text-sm font-medium text-success">
                      <CheckCircle2 className="size-4" /> Completed this week
                    </span>
                    <Button asChild variant="outline">
                      <Link to="/session/$week" params={{ week: String(currentWeek) }}>
                        Review answers
                      </Link>
                    </Button>
                  </div>
                ) : (
                  <Button asChild size="lg" className="animate-pop">
                    <Link to="/session/$week" params={{ week: String(currentWeek) }}>
                      <Play className="size-4" /> Start this week's simulation
                    </Link>
                  </Button>
                )}
              </div>
            </div>

            <div className="w-full max-w-xs rounded-xl border border-border bg-background/40 p-5">
              <div className="flex items-baseline justify-between">
                <span className="font-display text-2xl">
                  Level {lp.current.level}
                </span>
                <span className="text-sm text-muted-foreground">
                  {me.profile?.total_xp ?? 0} XP
                </span>
              </div>
              <p className="text-sm text-primary">{lp.current.title}</p>
              <Progress value={lp.pct} className="mt-3 h-2" />
              <p className="mt-2 text-xs text-muted-foreground">
                {lp.next
                  ? `${lp.next.minXp - (me.profile?.total_xp ?? 0)} XP to ${lp.next.title}`
                  : "Maximum level reached"}
              </p>
            </div>
          </div>
        </section>

        {current ? (
          <section className="flex gap-4 rounded-xl border border-warning/30 bg-warning/10 p-5">
            <Lightbulb className="mt-0.5 size-5 shrink-0 text-warning" />
            <div>
              <p className="text-sm font-semibold text-warning">Did you know?</p>
              <p className="mt-1 text-sm text-body">{current.fact}</p>
            </div>
          </section>
        ) : null}

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Stat label="Current streak" value={`${me.profile?.current_streak ?? 0} wks`} />
          <Stat label="Longest streak" value={`${me.profile?.longest_streak ?? 0} wks`} />
          <Stat label="Sessions completed" value={String(me.responses.length)} />
          <Stat label="Decision accuracy" value={`${accuracy}%`} />
        </section>

        <GroupPanel
          group={me.group}
          ownsGroup={me.ownsGroup}
          pendingInvites={me.pendingInvites}
          displayName={me.profile?.display_name ?? ""}
        />

        <GroupAssessments />



        <section>
          <h2 className="text-xl">Achievements</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {me.achievements.map((a) => {
              const Icon = ICONS[a.icon] ?? Sparkles;
              const has = earned.has(a.code);
              return (
                <div
                  key={a.code}
                  className={`rounded-xl border p-4 transition-colors ${
                    has
                      ? "border-primary/40 bg-primary/10"
                      : "border-border bg-surface opacity-60"
                  }`}
                >
                  <Icon className={`size-5 ${has ? "text-primary" : "text-muted-foreground"}`} />
                  <p className="mt-2 font-display text-sm">{a.name}</p>
                  <p className="text-xs text-body">{a.description}</p>
                </div>
              );
            })}
          </div>
        </section>

        <section>
          <h2 className="text-xl">52-week curriculum</h2>
          <p className="text-sm leading-relaxed text-body">{theme.blurb}</p>
          <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {weeks.map((w) => {
              const isDone = completedWeeks.has(w.week_number);
              const locked = w.week_number > currentWeek;
              return (
                <div
                  key={w.week_number}
                  className={`flex items-start gap-3 rounded-lg border border-border p-3 text-sm ${
                    locked ? "opacity-50" : "bg-surface"
                  }`}
                >
                  <span
                    className={`mt-0.5 grid size-6 shrink-0 place-items-center rounded-md text-xs font-semibold ${
                      isDone
                        ? "bg-success/20 text-success"
                        : locked
                          ? "bg-muted text-muted-foreground"
                          : "bg-primary/20 text-primary"
                    }`}
                  >
                    {isDone ? (
                      <CheckCircle2 className="size-3.5" />
                    ) : locked ? (
                      <Lock className="size-3" />
                    ) : (
                      w.week_number
                    )}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate font-medium">{w.topic}</p>
                    <p className="text-xs text-muted-foreground">
                      Week {w.week_number}
                      {locked ? " · Locked" : isDone ? " · Complete" : " · Available"}
                    </p>
                  </div>
                  {!locked ? (
                    <Link
                      to="/session/$week"
                      params={{ week: String(w.week_number) }}
                      className="ml-auto text-xs font-medium text-primary hover:underline"
                    >
                      {isDone ? "Review" : "Start"}
                    </Link>
                  ) : null}
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </AppShell>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-5">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 font-display text-2xl">{value}</p>
    </div>
  );
}

function GroupPanel({
  group,
  ownsGroup,
  pendingInvites,
  displayName,
}: {
  group: { id: string; name: string } | null;
  ownsGroup: boolean;
  pendingInvites: { id: string; groupName: string }[];
  displayName: string;
}) {
  const qc = useQueryClient();
  const createFn = useServerFn(createGroup);
  const acceptFn = useServerFn(acceptInvite);
  const nameFn = useServerFn(updateDisplayName);
  const [groupName, setGroupName] = useState("");
  const [name, setName] = useState(displayName);

  const create = useMutation({
    mutationFn: () => createFn({ data: { name: groupName.trim() } }),
    onSuccess: async () => {
      await qc.invalidateQueries();
      toast.success("Group created — invite your managers");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const accept = useMutation({
    mutationFn: (inviteId: string) => acceptFn({ data: { inviteId } }),
    onSuccess: async () => {
      await qc.invalidateQueries();
      toast.success("You've joined the group");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const saveName = useMutation({
    mutationFn: () => nameFn({ data: { name: name.trim() } }),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["me"] });
      toast.success("Display name updated");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <section className="grid gap-4 lg:grid-cols-2">
      <div className="rounded-xl border border-border bg-surface p-6">
        <h2 className="text-lg">Your group</h2>
        {group ? (
          <>
            <p className="mt-2 text-sm leading-relaxed text-body">
              You're {ownsGroup ? "the admin of" : "a member of"}{" "}
              <span className="font-medium text-foreground">{group.name}</span>.
            </p>
            <div className="mt-4 flex gap-2">
              {ownsGroup ? (
                <Button asChild size="sm">
                  <Link to="/admin">Open group console</Link>
                </Button>
              ) : null}
              <Button asChild size="sm" variant="outline">
                <Link to="/leaderboard">Group leaderboard</Link>
              </Button>
            </div>
          </>
        ) : pendingInvites.length ? (
          <div className="mt-3 space-y-2">
            <p className="text-sm text-body">You've been invited to join:</p>
            {pendingInvites.map((i) => (
              <div key={i.id} className="flex items-center gap-3 text-sm">
                <span className="font-medium">{i.groupName}</span>
                <Button
                  size="sm"
                  className="ml-auto"
                  onClick={() => accept.mutate(i.id)}
                  disabled={accept.isPending}
                >
                  Join
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <>
            <p className="mt-2 text-sm leading-relaxed text-body">
              Training your managers? Create a group and invite up to 3 of them — you'll see
              their progress and a private group board.
            </p>
            <div className="mt-4 flex gap-2">
              <Input
                placeholder="Acme hiring managers"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
              />
              <Button
                onClick={() => create.mutate()}
                disabled={groupName.trim().length < 2 || create.isPending}
              >
                Create group
              </Button>
            </div>
          </>
        )}
      </div>

      <div className="rounded-xl border border-border bg-surface p-6">
        <h2 className="text-lg">Public profile</h2>
        <p className="mt-2 text-sm text-body">
          This name appears on the global leaderboard.
        </p>
        <div className="mt-4 flex gap-2">
          <Input value={name} onChange={(e) => setName(e.target.value)} aria-label="Display name" />
          <Button
            variant="outline"
            onClick={() => saveName.mutate()}
            disabled={name.trim().length < 2 || saveName.isPending}
          >
            Save
          </Button>
        </div>
      </div>
    </section>
  );
}
