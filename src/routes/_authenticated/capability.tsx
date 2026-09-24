import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Award } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { CapabilityGrid } from "@/components/CapabilityGrid";
import { getMyCapability } from "@/lib/readiness.functions";
import { AREA_LABELS } from "@/lib/readiness/taxonomy";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { RouteError, RouteNotFound } from "@/components/RouteError";

export const Route = createFileRoute("/_authenticated/capability")({
  head: () => ({
    meta: [
      { title: "My capability · Benchmark" },
      { name: "description", content: "Your interviewer capability profile across four areas." },
      { property: "og:title", content: "My capability · Benchmark" },
      { property: "og:description", content: "Track your growth as an interviewer." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: CapabilityPage,
  errorComponent: RouteError,
  notFoundComponent: RouteNotFound,
});

function CapabilityPage() {
  const fn = useServerFn(getMyCapability);
  const q = useQuery({ queryKey: ["capability"], queryFn: () => fn() });
  if (q.isLoading || !q.data)
    return (
      <AppShell>
        <Skeleton className="h-72 w-full rounded-xl" />
      </AppShell>
    );
  const d = q.data;
  const pct = d.level.next
    ? Math.round(
        ((d.level.points - d.level.minPoints) / (d.level.next.minPoints - d.level.minPoints)) * 100,
      )
    : 100;
  return (
    <AppShell>
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="rounded-2xl border border-border bg-surface p-6">
          <p className="text-sm text-muted-foreground">Level {d.level.level}</p>
          <h1 className="text-3xl">{d.level.title}</h1>
          <Progress value={pct} className="mt-4 h-2" />
          <p className="mt-2 text-xs text-muted-foreground">
            {d.level.next
              ? `Next: ${d.level.next.title} — grow across more areas and keep preparing`
              : "Highest level reached"}{" "}
            · {d.completedPreps} preparations completed
          </p>
        </div>
        <CapabilityGrid progress={d.progress} />
        <div className="grid gap-4 sm:grid-cols-2">
          <Info
            label="Strongest area"
            value={d.strongest ? AREA_LABELS[d.strongest] : "Building profile"}
          />
          <Info
            label="Priority development area"
            value={d.priority ? AREA_LABELS[d.priority] : "Building profile"}
          />
        </div>
        {d.recognition.length ? (
          <div>
            <h2 className="mb-3 text-sm uppercase tracking-wide text-muted-foreground">
              Recognition
            </h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {d.recognition.map((r) => (
                <div
                  key={r.code}
                  className="flex items-center gap-3 rounded-xl border border-border bg-surface p-4"
                >
                  <Award className="size-5 text-warning" />
                  <div>
                    <p className="text-sm font-medium">{r.name}</p>
                    <p className="text-xs text-muted-foreground">{r.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </AppShell>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 font-medium">{value}</p>
    </div>
  );
}
