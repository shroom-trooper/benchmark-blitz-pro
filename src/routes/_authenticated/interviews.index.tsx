import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { CalendarPlus, ChevronRight } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { listInterviews } from "@/lib/readiness.functions";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PrepStatusBadge } from "@/components/CapabilityGrid";
import { RouteError, RouteNotFound } from "@/components/RouteError";

export const Route = createFileRoute("/_authenticated/interviews/")({
  head: () => ({
    meta: [
      { title: "Upcoming interviews · Benchmark" },
      { name: "description", content: "Your upcoming interviews and preparation status." },
      { property: "og:title", content: "Upcoming interviews · Benchmark" },
      { property: "og:description", content: "Prepare for every interview you run." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: InterviewsPage,
  errorComponent: RouteError,
  notFoundComponent: RouteNotFound,
});

export function fmtWhen(iso: string) {
  return new Date(iso).toLocaleString(undefined, { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

function InterviewsPage() {
  const fn = useServerFn(listInterviews);
  const q = useQuery({ queryKey: ["interviews"], queryFn: () => fn() });
  const now = Date.now();
  const upcoming = (q.data ?? []).filter((i) => new Date(i.starts_at).getTime() >= now - 3_600_000);
  const past = (q.data ?? []).filter((i) => new Date(i.starts_at).getTime() < now - 3_600_000).reverse();

  return (
    <AppShell>
      <div className="mx-auto max-w-3xl space-y-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl">Upcoming interviews</h1>
            <p className="mt-1 text-sm text-muted-foreground">A short, focused preparation before every interview you run.</p>
          </div>
          <Button asChild>
            <Link to="/interviews/new"><CalendarPlus className="size-4" /> Add interview</Link>
          </Button>
        </div>

        {q.isLoading ? (
          <Skeleton className="h-40 w-full rounded-xl" />
        ) : upcoming.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-10 text-center">
            <p className="font-display text-lg">No upcoming interviews</p>
            <p className="mt-1 text-sm text-muted-foreground">Add your next interview to get a 3–5 minute preparation tailored to it.</p>
          </div>
        ) : (
          <List items={upcoming} />
        )}

        {past.length ? (
          <div>
            <h2 className="mb-3 text-sm uppercase tracking-wide text-muted-foreground">Past</h2>
            <List items={past} />
          </div>
        ) : null}
      </div>
    </AppShell>
  );
}

function List({ items }: { items: Awaited<ReturnType<typeof listInterviews>> }) {
  return (
    <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-surface">
      {items.map((i) => (
        <li key={i.id}>
          <Link to="/interviews/$id" params={{ id: i.id }} className="flex items-center gap-4 p-4 hover:bg-surface-2">
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium">{i.role_title} · {i.interview_stage}</p>
              <p className="truncate text-sm text-muted-foreground">{fmtWhen(i.starts_at)} · {i.candidate_display_name}</p>
            </div>
            <PrepStatusBadge status={i.prepStatus} />
            <ChevronRight className="size-4 text-muted-foreground" />
          </Link>
        </li>
      ))}
    </ul>
  );
}
