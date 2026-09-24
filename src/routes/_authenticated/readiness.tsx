import { Link, Outlet, createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { Download } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { AppShell } from "@/components/AppShell";
import { LoadingSplash } from "@/components/LoadingSplash";
import { RouteError, RouteNotFound } from "@/components/RouteError";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { exportReadiness } from "@/lib/readiness-dashboard.functions";
import { track } from "@/lib/analytics";
import { downloadCsv, rangeFor, useDashboard, useRange, type RangeKey } from "@/components/readiness/ui";

const search = z.object({ range: z.enum(["30d", "90d", "180d"]).optional() });

export const Route = createFileRoute("/_authenticated/readiness")({
  validateSearch: (s) => search.parse(s),
  head: () => ({
    meta: [
      { title: "Interviewer readiness · Benchmark" },
      { name: "description", content: "Preparation coverage, capability evidence and coaching actions for your interviewers." },
      { property: "og:title", content: "Interviewer readiness · Benchmark" },
      { property: "og:description", content: "A decision-support dashboard for interviewer readiness." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ReadinessLayout,
  errorComponent: RouteError,
  notFoundComponent: RouteNotFound,
});

const TABS = [
  { to: "/readiness", label: "Overview", exact: true },
  { to: "/readiness/interviews", label: "Interviews" },
  { to: "/readiness/capability", label: "Capability" },
  { to: "/readiness/people", label: "People" },
  { to: "/readiness/program", label: "Program health" },
] as const;

function ReadinessLayout() {
  const q = useDashboard();
  const range = useRange();
  const navigate = useNavigate();
  const exportFn = useServerFn(exportReadiness);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    track("ta_dashboard_opened");
  }, []);

  if (q.isLoading) return <LoadingSplash />;
  if (q.isError)
    return (
      <AppShell>
        <p className="text-sm text-muted-foreground">Could not load readiness data. Please refresh.</p>
      </AppShell>
    );
  if (!q.data)
    return (
      <AppShell>
        <div className="mx-auto max-w-xl rounded-xl border border-border bg-surface p-6 text-center">
          <h1 className="text-xl">Interviewer readiness</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            This dashboard is available to owners of an interviewer group. Create one from the group console.
          </p>
          <Button asChild className="mt-4">
            <Link to="/admin">Open group console</Link>
          </Button>
        </div>
      </AppShell>
    );

  const doExport = async (type: "interview_operations" | "team_capability" | "individual_capability") => {
    setBusy(true);
    try {
      const r = await exportFn({ data: { type, ...rangeFor(range) } });
      if (!r.rows) toast.info("Nothing to export for this period yet.");
      else downloadCsv(r.filename, r.csv);
      track("readiness_export_created", { type, rows: r.rows });
    } catch {
      toast.error("Export failed. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <AppShell>
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-sm text-muted-foreground">{q.data.group.name}</p>
            <h1 className="text-3xl">Interviewer readiness</h1>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Select
              value={range}
              onValueChange={(v) => {
                navigate({ to: ".", search: { range: v as RangeKey } });
                track("readiness_filter_applied", { filter: "range", value: v });
              }}
            >
              <SelectTrigger className="w-52" aria-label="Reporting period">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="30d">Last 30 days + next 30</SelectItem>
                <SelectItem value="90d">Last 90 days + next 30</SelectItem>
                <SelectItem value="180d">Last 180 days + next 30</SelectItem>
              </SelectContent>
            </Select>
            <Select disabled={busy} value="" onValueChange={(v) => doExport(v as "interview_operations")}>
              <SelectTrigger className="w-40" aria-label="Export CSV">
                <Download className="size-4" />
                <span>Export CSV</span>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="interview_operations">Interview preparation</SelectItem>
                <SelectItem value="team_capability">Team capability</SelectItem>
                <SelectItem value="individual_capability">Individual capability</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <nav className="flex gap-1 overflow-x-auto border-b border-border" aria-label="Readiness sections">
          {TABS.map((t) => (
            <Link
              key={t.to}
              to={t.to}
              search={{ range }}
              activeOptions={{ exact: "exact" in t, includeSearch: false }}
              className="whitespace-nowrap border-b-2 border-transparent px-3 py-2 text-sm text-muted-foreground hover:text-foreground"
              activeProps={{ className: "!border-primary !text-foreground" }}
            >
              {t.label}
            </Link>
          ))}
        </nav>
        {q.data.empty ? (
          <p className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            Invite interviewers to your group to start seeing preparation and capability readiness here.
          </p>
        ) : (
          <Outlet />
        )}
      </div>
    </AppShell>
  );
}
