import { Link, Outlet, createFileRoute, useMatches } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { AREA_LABELS, CAPABILITY_AREAS, type CapabilityArea } from "@/lib/readiness/taxonomy";
import { STAGES, STAGE_LABELS, type Stage } from "@/lib/readiness/scoring";
import { hasCurrentEvidence } from "@/lib/readiness/metrics";
import { CapabilityCell, Empty, useDashboard } from "@/components/readiness/ui";
import { track } from "@/lib/analytics";
import { RouteError, RouteNotFound } from "@/components/RouteError";

export const Route = createFileRoute("/_authenticated/readiness/capability")({
  component: CapabilityLayout,
  errorComponent: RouteError,
  notFoundComponent: RouteNotFound,
});

const SORTS = {
  priority: "Priority development area",
  lowest: "Lowest reliable score",
  stale: "Stale evidence",
  decline: "Recent decline",
  coverage: "Insufficient coverage",
  improved: "Most improved",
} as const;
const sel = "h-9 rounded-md border border-border bg-surface px-2 text-sm";

function CapabilityLayout() {
  const matches = useMatches();
  const isDetail = matches.some((m) => m.routeId === "/_authenticated/readiness/capability/$area");
  return isDetail ? <Outlet /> : <Heatmap />;
}

function Heatmap() {
  const { data } = useDashboard();
  const [sort, setSort] = useState<keyof typeof SORTS>("priority");
  const [area, setArea] = useState<CapabilityArea | "">("");
  const [stage, setStage] = useState<Stage | "">("");
  const [conf, setConf] = useState("");
  useEffect(() => {
    track("capability_heatmap_opened");
  }, []);
  const rows = useMemo(() => {
    if (!data || data.empty) return [];
    const now = Date.now();
    const cols = area ? [area] : CAPABILITY_AREAS;
    const pick = (p: (typeof data.people)[number]) => p.progress.filter((x) => cols.includes(x.capability_area));
    const filtered = data.people.filter((p) =>
      pick(p).some((x) => (!stage || x.mastery_stage === stage) && (!conf || x.evidence_confidence === conf)),
    );
    const reliableMin = (p: (typeof data.people)[number]) =>
      Math.min(...pick(p).filter((x) => x.evidence_confidence !== "low").map((x) => x.weighted_score), 101);
    const key: Record<keyof typeof SORTS, (p: (typeof data.people)[number]) => number> = {
      priority: (p) => (p.development.some((d) => d.status === "active") ? 0 : p.development.some((d) => d.status === "emerging") ? 1 : 2),
      lowest: reliableMin,
      stale: (p) => (hasCurrentEvidence(p.lastEvidenceAt, now) ? 1 : 0),
      decline: (p) => -pick(p).filter((x) => x.recent_direction === "declining").length,
      coverage: (p) => pick(p).reduce((s, x) => s + x.total_questions, 0),
      improved: (p) => -pick(p).filter((x) => x.recent_direction === "improving").length,
    };
    return [...filtered].sort((a, b) => key[sort](a) - key[sort](b) || a.name.localeCompare(b.name));
  }, [data, sort, area, stage, conf]);
  if (!data || data.empty) return null;
  const cols = area ? [area] : CAPABILITY_AREAS;
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <select className={sel} value={sort} onChange={(e) => setSort(e.target.value as keyof typeof SORTS)} aria-label="Sort">
          {Object.entries(SORTS).map(([k, v]) => <option key={k} value={k}>Sort: {v}</option>)}
        </select>
        <select className={sel} value={area} onChange={(e) => setArea(e.target.value as CapabilityArea)} aria-label="Capability area">
          <option value="">All capability areas</option>
          {CAPABILITY_AREAS.map((a) => <option key={a} value={a}>{AREA_LABELS[a]}</option>)}
        </select>
        <select className={sel} value={stage} onChange={(e) => setStage(e.target.value as Stage)} aria-label="Mastery stage">
          <option value="">All stages</option>
          {STAGES.map((s) => <option key={s} value={s}>{STAGE_LABELS[s]}</option>)}
        </select>
        <select className={sel} value={conf} onChange={(e) => setConf(e.target.value)} aria-label="Evidence confidence">
          <option value="">All confidence</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>
      </div>
      <p className="text-xs text-muted-foreground">
        Each cell shows stage, score, answers, confidence (○ low ◐ medium ● high) and direction. People with fewer than 8 answers in an area show “Building profile” instead of a score.
      </p>
      {rows.length ? (
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-sm">
            <caption className="sr-only">Team capability heatmap</caption>
            <thead className="bg-surface-2 text-left text-xs text-muted-foreground">
              <tr>
                <th className="p-3">Interviewer</th>
                {cols.map((a) => (
                  <th key={a} className="p-3 min-w-44">
                    <Link to="/readiness/capability/$area" params={{ area: a }} className="underline-offset-2 hover:underline">
                      {AREA_LABELS[a]}
                    </Link>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((p) => (
                <tr key={p.id} className="border-t border-border align-top">
                  <td className="p-3">
                    <Link to="/readiness/people/$userId" params={{ userId: p.id }} className="font-medium hover:underline">
                      {p.name}
                    </Link>
                  </td>
                  {cols.map((a) => (
                    <td key={a} className="p-2">
                      <CapabilityCell p={p.progress.find((x) => x.capability_area === a)!} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <Empty>No interviewers match these filters.</Empty>
      )}
    </div>
  );
}
