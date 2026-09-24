import { Link, Outlet, createFileRoute, useMatches } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AREA_LABELS } from "@/lib/readiness/taxonomy";
import { Empty, fmtDate, useDashboard } from "@/components/readiness/ui";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { RouteError, RouteNotFound } from "@/components/RouteError";

export const Route = createFileRoute("/_authenticated/readiness/people")({
  component: PeopleLayout,
  errorComponent: RouteError,
  notFoundComponent: RouteNotFound,
});

function PeopleLayout() {
  const matches = useMatches();
  return matches.some((m) => m.routeId === "/_authenticated/readiness/people/$userId") ? <Outlet /> : <People />;
}

const PAGE = 25;

function People() {
  const { data } = useDashboard();
  const [q, setQ] = useState("");
  const [page, setPage] = useState(0);
  const rows = useMemo(() => {
    if (!data || data.empty) return [];
    const now = Date.now();
    // Default action-priority sort: upcoming needing action → stale prep → insufficient evidence → development areas.
    const rank = (p: (typeof data.people)[number]) => [
      p.upcomingNeedsAction > 0 ? 0 : 1,
      !p.lastPrepAt || now - new Date(p.lastPrepAt).getTime() > 30 * 86_400_000 ? 0 : 1,
      p.building ? 0 : 1,
      p.development.some((d) => d.status === "active" || d.status === "emerging") ? 0 : 1,
    ];
    return data.people
      .filter((p) => p.name.toLowerCase().includes(q.toLowerCase()))
      .sort((a, b) => {
        const ra = rank(a);
        const rb = rank(b);
        for (let i = 0; i < ra.length; i++) if (ra[i] !== rb[i]) return ra[i]! - rb[i]!;
        return a.name.localeCompare(b.name);
      });
  }, [data, q]);
  if (!data || data.empty) return null;
  const shown = rows.slice(page * PAGE, page * PAGE + PAGE);
  return (
    <div className="space-y-4">
      <Input placeholder="Search people" value={q} onChange={(e) => { setQ(e.target.value); setPage(0); }} className="h-9 w-60" aria-label="Search people" />
      <p className="text-xs text-muted-foreground">Sorted by who needs action first: upcoming interviews without preparation, stale preparation, insufficient evidence, then development areas.</p>
      {shown.length ? (
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead className="bg-surface-2 text-left text-xs text-muted-foreground">
              <tr>
                {["Name", "Upcoming", "Last preparation", "Coverage", "Four areas", "Strongest", "Priority area", "Level", "Recognition", "Evidence"].map((h) => (
                  <th key={h} className="p-3 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {shown.map((p) => (
                <tr key={p.id} className="border-t border-border">
                  <td className="p-3">
                    <Link to="/readiness/people/$userId" params={{ userId: p.id }} className="font-medium hover:underline">{p.name}</Link>
                  </td>
                  <td className="p-3">{p.upcoming}{p.upcomingNeedsAction ? <span className="block text-xs text-warning">{p.upcomingNeedsAction} need prep</span> : null}</td>
                  <td className="p-3 whitespace-nowrap">{fmtDate(p.lastPrepAt)}<span className="block text-xs text-muted-foreground">{p.completedPreps} completed</span></td>
                  <td className="p-3 whitespace-nowrap">{p.coverage.pct === null ? "—" : `${p.coverage.pct}%`}<span className="block text-xs text-muted-foreground">{p.coverage.numerator} of {p.coverage.denominator} eligible</span></td>
                  <td className="p-3">{p.fourArea ? "✓ Yes" : "Not yet"}</td>
                  <td className="p-3 text-xs">{p.strongest ? AREA_LABELS[p.strongest] : "Building profile"}</td>
                  <td className="p-3 text-xs">{p.priority ? AREA_LABELS[p.priority] : p.building ? "Building profile" : "—"}</td>
                  <td className="p-3 text-xs">L{p.level.level} · {p.level.title}</td>
                  <td className="p-3 text-xs">{p.recognition ?? "—"}</td>
                  <td className="p-3 text-xs">{p.currentEvidence ? "Current" : p.lastEvidenceAt ? "Stale" : "None"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <Empty>No people match this search.</Empty>
      )}
      {rows.length > PAGE ? (
        <div className="flex justify-end gap-2">
          <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(page - 1)}>Previous</Button>
          <Button variant="outline" size="sm" disabled={(page + 1) * PAGE >= rows.length} onClick={() => setPage(page + 1)}>Next</Button>
        </div>
      ) : null}
    </div>
  );
}
