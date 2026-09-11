import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { CheckCircle2, Lightbulb, Lock, Play } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { getRecruiterMe } from "@/lib/benchmark.functions";
import { levelProgressIn, quarterForWeek, quarterThemesForTrack } from "@/lib/gamification";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { RouteError, RouteNotFound } from "@/components/RouteError";

export const Route = createFileRoute("/_authenticated/recruiter/")({
  head: () => ({
    meta: [
      { title: "Recruiter training hub · Benchmark" },
      {
        name: "description",
        content:
          "Weekly recruiter simulations covering intake calibration, sourcing, engagement, assessment and closing.",
      },
      { property: "og:title", content: "Recruiter training hub · Benchmark" },
      {
        property: "og:description",
        content: "52 weeks of recruiter capability training with XP, streaks and levels.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: RecruiterHub,
  errorComponent: RouteError,
  notFoundComponent: RouteNotFound,
});

function RecruiterHub() {
  const meFn = useServerFn(getRecruiterMe);
  const query = useQuery({
    queryKey: ["recruiter-me"],
    queryFn: () => meFn({}),
    retry: false,
  });

  if (query.isLoading || !query.data) {
    return (
      <AppShell>
        <Skeleton className="h-48 w-full rounded-xl" />
      </AppShell>
    );
  }

  const me = query.data;
  const currentWeek = me.unlockedWeek;
  const completed = new Set(me.responses.map((r) => r.week_number));
  const current = me.weeks.find((w) => w.week_number === currentWeek);
  const done = completed.has(currentWeek);
  const lp = levelProgressIn("recruiter", me.progress.totalXp);
  const themes = quarterThemesForTrack("recruiter");
  const theme = themes[quarterForWeek(currentWeek)]!;
  const accuracy = me.responses.length
    ? Math.round(
        (me.responses.reduce((s, r) => s + r.score, 0) / (me.responses.length * 3)) * 100,
      )
    : 0;

  return (
    <AppShell>
      <div className="space-y-8">
        <TrackSwitch active="recruiter" />
        <section className="rounded-2xl border border-border bg-gradient-to-br from-surface to-surface-2 p-6 sm:p-8">

          <div className="flex flex-wrap items-start justify-between gap-6">
            <div className="max-w-xl">
              <Badge className="bg-primary/15 text-primary hover:bg-primary/15">
                Recruiter · Week {currentWeek} · Q{quarterForWeek(currentWeek)} {theme.name}
              </Badge>
              <h1 className="mt-3 text-3xl">{current?.topic ?? "Curriculum loading"}</h1>
              <p className="mt-2 text-sm leading-relaxed text-body">
                Three recruiting scenarios. Roughly four minutes. One week closer to Master
                Talent Partner.
              </p>
              <div className="mt-6">
                {done ? (
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-2 rounded-lg bg-success/15 px-4 py-2 text-sm font-medium text-success">
                      <CheckCircle2 className="size-4" /> Completed this week
                    </span>
                    <Button asChild variant="outline">
                      <Link
                        to="/recruiter/session/$week"
                        params={{ week: String(currentWeek) }}
                      >
                        Review answers
                      </Link>
                    </Button>
                  </div>
                ) : (
                  <Button asChild size="lg" className="animate-pop">
                    <Link to="/recruiter/session/$week" params={{ week: String(currentWeek) }}>
                      <Play className="size-4" /> Start this week's simulation
                    </Link>
                  </Button>
                )}
                {me.nextUnlockAt ? (
                  <p className="mt-3 text-xs text-muted-foreground">
                    Week {currentWeek + 1} unlocks{" "}
                    {new Date(me.nextUnlockAt).toLocaleDateString(undefined, {
                      weekday: "long",
                      day: "numeric",
                      month: "short",
                    })}
                    .
                  </p>
                ) : null}
              </div>
            </div>

            <div className="w-full max-w-xs rounded-xl border border-border bg-background/40 p-5">
              <div className="flex items-baseline justify-between">
                <span className="font-display text-2xl">Level {lp.current.level}</span>
                <span className="text-sm text-muted-foreground">
                  {me.progress.totalXp} XP
                </span>
              </div>
              <p className="text-sm text-primary">{lp.current.title}</p>
              <Progress value={lp.pct} className="mt-3 h-2" />
              <p className="mt-2 text-xs text-muted-foreground">
                {lp.next
                  ? `${lp.next.minXp - me.progress.totalXp} XP to ${lp.next.title}`
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
          <Stat label="Current streak" value={`${me.progress.currentStreak} wks`} />
          <Stat label="Longest streak" value={`${me.progress.longestStreak} wks`} />
          <Stat label="Sessions completed" value={String(me.responses.length)} />
          <Stat label="Decision accuracy" value={`${accuracy}%`} />
        </section>

        <section>
          <h2 className="text-xl">52-week recruiter curriculum</h2>
          <p className="text-sm leading-relaxed text-body">{theme.blurb}</p>
          <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {me.weeks.map((w) => {
              const isDone = completed.has(w.week_number);
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
                      to="/recruiter/session/$week"
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
