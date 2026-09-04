import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { CheckCircle2, Layers, Target } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { getElectives } from "@/lib/benchmark.functions";
import { CATEGORY_META, type ElectiveCategory } from "@/lib/electives/types";
import { CATEGORY_ORDER } from "@/lib/electives";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/_authenticated/electives")({
  head: () => ({
    meta: [
      { title: "Elective tracks · Benchmark" },
      {
        name: "description",
        content:
          "Domain-specific interview tracks, manager playbooks and compliance guardrails that layer on top of the 52-week core curriculum.",
      },
      { property: "og:title", content: "Elective tracks · Benchmark" },
      {
        property: "og:description",
        content:
          "Pick a specialist track — engineering, GTM, executive, playbooks or compliance — and build depth beyond the weekly habit.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ElectivesPage,
});

function ElectivesPage() {
  const fn = useServerFn(getElectives);
  const query = useQuery({ queryKey: ["electives"], queryFn: () => fn() });

  if (query.isLoading) {
    return (
      <AppShell>
        <Skeleton className="h-96 w-full rounded-xl" />
      </AppShell>
    );
  }

  const data = query.data!;
  const grouped = CATEGORY_ORDER.map((category) => ({
    category,
    modules: data.modules.filter((m) => m.category === category),
  })).filter((g) => g.modules.length);

  return (
    <AppShell>
      <div className="mx-auto max-w-5xl space-y-10">
        <header>
          <Badge className="bg-primary/15 text-primary hover:bg-primary/15">
            Elective library
          </Badge>
          <h1 className="mt-3 text-2xl">Go deeper than the weekly habit</h1>
          <p className="mt-2 max-w-2xl text-body">
            Specialist tracks that layer on top of your 52-week core pathway. Each lesson
            is three scenarios and earns XP without affecting your weekly streak.
          </p>
          {data.curated ? (
            <p className="mt-2 text-sm text-muted-foreground">
              Your group lead has selected the tracks below for your team.
            </p>
          ) : null}
        </header>

        {grouped.map(({ category, modules }) => {
          const meta = CATEGORY_META[category as ElectiveCategory];
          return (
            <section key={category} className="space-y-4">
              <div>
                <h2 className="text-lg">{meta.label}</h2>
                <p className="text-sm text-body">{meta.blurb}</p>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                {modules.map((m) => (
                  <article
                    key={m.slug}
                    className="rounded-xl border border-border bg-surface p-6"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="text-base">{m.title}</h3>
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {m.completed}/{m.total}
                      </span>
                    </div>
                    <p className="mt-1 text-xs uppercase tracking-wide text-muted-foreground">
                      {m.audience}
                    </p>
                    <p className="mt-3 text-sm text-body">{m.summary}</p>
                    <Progress
                      value={(m.completed / m.total) * 100}
                      className="mt-4 h-1.5"
                    />
                    <ul className="mt-4 space-y-2">
                      {m.lessons.map((l) => (
                        <li key={l.slug}>
                          <Link
                            to="/electives/$module/$lesson"
                            params={{ module: m.slug, lesson: l.slug }}
                            className="flex items-start gap-2 rounded-lg border border-border p-3 text-sm transition-colors hover:border-primary/50 hover:bg-surface-2"
                          >
                            {l.completed ? (
                              <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" />
                            ) : (
                              <Target className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                            )}
                            <span>
                              {l.title}
                              <span className="block text-xs text-muted-foreground">
                                {l.focus}
                              </span>
                            </span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                    <p className="mt-4 flex items-start gap-2 text-xs text-muted-foreground">
                      <Layers className="mt-0.5 size-3.5 shrink-0" />
                      Artifact: {m.artifact}
                    </p>
                  </article>
                ))}
              </div>
            </section>
          );
        })}

        <Button asChild variant="outline">
          <Link to="/hub">Back to hub</Link>
        </Button>
      </div>
    </AppShell>
  );
}
