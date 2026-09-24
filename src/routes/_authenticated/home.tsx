import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Award, CalendarClock, CalendarPlus, CheckCircle2, Compass, Plus } from "lucide-react";
import { AppShell, useAccess } from "@/components/AppShell";
import { CapabilityGrid } from "@/components/CapabilityGrid";
import { getMyCapability, listInterviews } from "@/lib/readiness.functions";
import { listDetectedEvents } from "@/lib/calendar.functions";
import { landingFor } from "@/lib/authz/navigation";
import { getOnboarding } from "@/lib/onboarding.functions";
import { AREA_LABELS } from "@/lib/readiness/taxonomy";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { RouteError, RouteNotFound } from "@/components/RouteError";

export const Route = createFileRoute("/_authenticated/home")({
  head: () => ({
    meta: [
      { title: "Home · Benchmark" },
      { name: "description", content: "Your next interview, preparation status and coaching focus." },
      { property: "og:title", content: "Home · Benchmark" },
      { property: "og:description", content: "Prepare for your next interview with Benchmark." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: HomePage,
  errorComponent: RouteError,
  notFoundComponent: RouteNotFound,
});

const PREP_LABEL = { not_started: "Not prepared", in_progress: "Preparation in progress", completed: "Prepared" } as const;

function fmt(d: string) {
  return new Date(d).toLocaleString(undefined, { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

function HomePage() {
  const navigate = useNavigate();
  const access = useAccess();
  const interviewsFn = useServerFn(listInterviews);
  const capFn = useServerFn(getMyCapability);
  const detectedFn = useServerFn(listDetectedEvents);
  const interviews = useQuery({ queryKey: ["interviews"], queryFn: () => interviewsFn() });
  const cap = useQuery({ queryKey: ["capability"], queryFn: () => capFn() });
  const detected = useQuery({ queryKey: ["detected-events"], queryFn: () => detectedFn(), retry: false });

  const onboardingFn = useServerFn(getOnboarding);
  const onboarding = useQuery({ queryKey: ["onboarding"], queryFn: () => onboardingFn() });
  const perms = access.data?.permissions;
  useEffect(() => {
    if (onboarding.data && !onboarding.data.completed) {
      navigate({ to: "/onboarding", replace: true });
      return;
    }
    // Staff land on their operational screen once per session; "My training" links back here.
    if (perms && perms.length && typeof window !== "undefined" && !sessionStorage.getItem("bm-landed")) {
      sessionStorage.setItem("bm-landed", "1");
      const to = landingFor(perms);
      if (to !== "/home") navigate({ to, replace: true });
    }
  }, [perms, navigate, onboarding.data]);

  if (interviews.isLoading || cap.isLoading) {
    return (
      <AppShell>
        <div className="space-y-4">
          <Skeleton className="h-48 w-full rounded-2xl" />
          <Skeleton className="h-32 w-full rounded-2xl" />
        </div>
      </AppShell>
    );
  }

  const now = Date.now();
  const upcoming = (interviews.data ?? []).filter((i) => i.status !== "cancelled" && new Date(i.starts_at).getTime() >= now);
  const next = upcoming[0];
  const recent = (interviews.data ?? []).filter((i) => i.prepStatus === "completed").slice(-3).reverse();
  const pending = (detected.data ?? []).filter((e) => !e.interviewId);
  const c = cap.data;

  return (
    <AppShell>
      <div className="mx-auto max-w-5xl space-y-6">
        <section className="rounded-2xl border border-border bg-gradient-to-br from-surface to-surface-2 p-6 sm:p-8">
          <p className="text-sm text-muted-foreground">Next interview</p>
          {next ? (
            <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
              <div>
                <h1 className="text-3xl">{next.role_title || "Interview"}</h1>
                <p className="mt-1 text-sm text-body">
                  {fmt(next.starts_at)}
                  {next.interview_stage ? ` · ${next.interview_stage.replace(/_/g, " ")}` : ""}
                </p>
                <Badge className="mt-3" variant={next.prepStatus === "completed" ? "secondary" : "outline"}>
                  {PREP_LABEL[next.prepStatus]}
                </Badge>
              </div>
              <Button asChild size="lg">
                <Link to="/interviews/$id" params={{ id: next.id }}>
                  {next.prepStatus === "completed" ? "Review preparation" : "Prepare now"}
                </Link>
              </Button>
            </div>
          ) : (
            <div className="mt-2">
              <h1 className="text-3xl">No upcoming interviews</h1>
              <p className="mt-2 max-w-xl text-sm text-body">
                Add an interview, or connect your calendar so Benchmark can find them for you and schedule preparation beforehand.
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                <Button asChild>
                  <Link to="/interviews/new"><Plus className="size-4" /> Add your first interview</Link>
                </Button>
                <Button asChild variant="outline">
                  <Link to="/settings/calendar"><CalendarPlus className="size-4" /> Connect your calendar</Link>
                </Button>
              </div>
            </div>
          )}
        </section>

        {pending.length ? (
          <section className="rounded-xl border border-warning/30 bg-warning/10 p-5">
            <p className="text-sm font-semibold text-warning">Found in your calendar · needs confirmation</p>
            <ul className="mt-3 space-y-2">
              {pending.slice(0, 3).map((e) => (
                <li key={e.id} className="flex items-center justify-between gap-3 text-sm">
                  <span className="truncate">{e.role || e.subject || "Possible interview"} · {fmt(e.startsAt)}</span>
                  <Button asChild size="sm" variant="outline">
                    <Link to="/interviews/confirm/$eventId" params={{ eventId: e.id }}>Confirm</Link>
                  </Button>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <div className="grid gap-4 md:grid-cols-2">
          <section className="rounded-xl border border-border bg-surface p-5">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CalendarClock className="size-4" /> Preparation timing
            </div>
            <p className="mt-2 text-sm text-body">
              {upcoming.length
                ? `${upcoming.filter((i) => i.prepStatus !== "completed").length} of ${upcoming.length} upcoming interviews still need preparation. Benchmark reminds you before each one.`
                : "Preparation is scheduled automatically before each confirmed interview."}
            </p>
          </section>
          <section className="rounded-xl border border-border bg-surface p-5">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Compass className="size-4" /> Recommended coaching focus
            </div>
            <p className="mt-2 font-medium">
              {c?.priority ? AREA_LABELS[c.priority] : "Building your profile"}
            </p>
            <p className="mt-1 text-sm text-body">
              {c?.priority
                ? "Your evidence suggests this area would benefit most from focused preparation."
                : "Complete a few preparations to reveal where coaching will help most."}
            </p>
          </section>
        </div>

        {c ? (
          <section>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-xl">Capability snapshot</h2>
              <Link to="/capability" className="text-sm text-primary hover:underline">View details</Link>
            </div>
            <CapabilityGrid progress={c.progress} />
          </section>
        ) : null}

        <div className="grid gap-4 md:grid-cols-2">
          <section className="rounded-xl border border-border bg-surface p-5">
            <h2 className="text-sm uppercase tracking-wide text-muted-foreground">Recent preparation</h2>
            {recent.length ? (
              <ul className="mt-3 space-y-2 text-sm">
                {recent.map((r) => (
                  <li key={r.id} className="flex items-center gap-2">
                    <CheckCircle2 className="size-4 text-success" />
                    <Link to="/interviews/$id" params={{ id: r.id }} className="truncate hover:underline">
                      {r.role_title || "Interview"}
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-sm text-body">No completed preparations yet.</p>
            )}
          </section>
          <section className="rounded-xl border border-border bg-surface p-5">
            <h2 className="text-sm uppercase tracking-wide text-muted-foreground">Recognition</h2>
            {c?.recognition.length ? (
              <ul className="mt-3 space-y-2 text-sm">
                {c.recognition.slice(0, 4).map((r) => (
                  <li key={r.code} className="flex items-center gap-2">
                    <Award className="size-4 text-warning" /> {r.name}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-sm text-body">Recognition reflects preparation and capability growth, not activity volume.</p>
            )}
          </section>
        </div>
      </div>
    </AppShell>
  );
}
