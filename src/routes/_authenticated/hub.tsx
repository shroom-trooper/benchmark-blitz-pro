import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
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
import { levelProgress, QUARTER_THEMES, quarterForWeek } from "@/lib/gamification";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
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
              <h1 className="mt-3 font-display text-3xl font-semibold tracking-tight">
                {current?.topic ?? "Curriculum loading"}
              </h1>
              <p className="mt-2 text-sm text-muted-foreground">
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
                <span className="font-display text-2xl font-semibold">
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
              <p className="mt-1 text-sm text-foreground/90">{current.fact}</p>
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

        <section>
          <h2 className="font-display text-xl font-semibold">Achievements</h2>
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
                  <p className="mt-2 text-sm font-semibold">{a.name}</p>
                  <p className="text-xs text-muted-foreground">{a.description}</p>
                </div>
              );
            })}
          </div>
        </section>

        <section>
          <h2 className="font-display text-xl font-semibold">52-week curriculum</h2>
          <p className="text-sm text-muted-foreground">{theme.blurb}</p>
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
      <p className="mt-1 font-display text-2xl font-semibold">{value}</p>
    </div>
  );
}
