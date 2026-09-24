import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Award, Medal, Star, TrendingUp } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { CapabilityGrid } from "@/components/CapabilityGrid";
import { getMyCapability, listInterviews } from "@/lib/readiness.functions";
import { getMyRanking } from "@/lib/onboarding.functions";
import { AREA_LABELS } from "@/lib/readiness/taxonomy";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { RouteError, RouteNotFound } from "@/components/RouteError";

export const Route = createFileRoute("/_authenticated/progress")({
  head: () => ({
    meta: [
      { title: "Progress · Benchmark" },
      { name: "description", content: "Your points, level, achievements, ranking and training history." },
      { property: "og:title", content: "Progress · Benchmark" },
      { property: "og:description", content: "Track your growth as an interviewer." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ProgressPage,
  errorComponent: RouteError,
  notFoundComponent: RouteNotFound,
});

function ProgressPage() {
  const capFn = useServerFn(getMyCapability);
  const rankFn = useServerFn(getMyRanking);
  const intFn = useServerFn(listInterviews);
  const cap = useQuery({ queryKey: ["capability"], queryFn: () => capFn() });
  const rank = useQuery({ queryKey: ["my-ranking"], queryFn: () => rankFn() });
  const interviews = useQuery({ queryKey: ["interviews"], queryFn: () => intFn() });

  if (cap.isLoading || !cap.data)
    return (
      <AppShell>
        <Skeleton className="h-72 w-full rounded-xl" />
      </AppShell>
    );
  const d = cap.data;
  const pct = d.level.next
    ? Math.round(((d.level.points - d.level.minPoints) / (d.level.next.minPoints - d.level.minPoints)) * 100)
    : 100;
  const history = (interviews.data ?? []).filter((i) => i.prepStatus === "completed").slice(-5).reverse();

  return (
    <AppShell>
      <div className="mx-auto max-w-5xl space-y-6">
        <section className="rounded-2xl border border-border bg-surface p-6">
          <p className="text-sm text-muted-foreground">Level {d.level.level}</p>
          <h1 className="text-3xl">{d.level.title}</h1>
          <Progress value={pct} className="mt-4 h-2" />
          <p className="mt-2 text-xs text-muted-foreground">
            {d.level.next ? `${d.level.next.minPoints - d.level.points} points to ${d.level.next.title}` : "Highest level reached"}
          </p>
        </section>

        <div className="grid gap-4 sm:grid-cols-3">
          <Stat icon={<Star className="size-4" />} label="Points" value={String(d.level.points)} />
          <Stat
            icon={<Medal className="size-4" />}
            label="Ranking"
            value={rank.data?.rank ? `#${rank.data.rank} of ${rank.data.total}` : "Complete a training to rank"}
          />
          <Stat icon={<TrendingUp className="size-4" />} label="Trainings completed" value={String(d.completedPreps)} />
        </div>

        <div>
          <h2 className="mb-3 text-sm uppercase tracking-wide text-muted-foreground">Training areas</h2>
          <CapabilityGrid progress={d.progress} />
          <p className="mt-3 text-xs text-muted-foreground">
            Strongest: {d.strongest ? AREA_LABELS[d.strongest] : "building profile"} · Focus next:{" "}
            {d.priority ? AREA_LABELS[d.priority] : "building profile"}
          </p>
        </div>

        <div>
          <h2 className="mb-3 text-sm uppercase tracking-wide text-muted-foreground">Achievements</h2>
          {d.recognition.length ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {d.recognition.map((r) => (
                <div key={r.code} className="flex items-center gap-3 rounded-xl border border-border bg-surface p-4">
                  <Award className="size-5 text-warning" />
                  <div>
                    <p className="text-sm font-medium">{r.name}</p>
                    <p className="text-xs text-muted-foreground">{r.description}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground">
              Finish your first interview training to unlock your first achievement.
            </p>
          )}
        </div>

        <div>
          <h2 className="mb-3 text-sm uppercase tracking-wide text-muted-foreground">Recent training</h2>
          {history.length ? (
            <ul className="divide-y divide-border rounded-xl border border-border bg-surface">
              {history.map((i) => (
                <li key={i.id} className="flex items-center justify-between gap-3 p-4 text-sm">
                  <span>{i.role_title || "Interview"}</span>
                  <span className="text-xs text-muted-foreground">{new Date(i.starts_at).toLocaleDateString()}</span>
                </li>
              ))}
            </ul>
          ) : (
            <div className="rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground">
              No training yet.{" "}
              <Button asChild variant="link" className="h-auto p-0">
                <Link to="/interviews/new">Add an interview</Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <p className="flex items-center gap-2 text-xs text-muted-foreground">
        {icon}
        {label}
      </p>
      <p className="mt-1 font-medium">{value}</p>
    </div>
  );
}
