import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { INTERVIEW_STATUSES, INTERVIEW_STATUS_LABELS, type InterviewStatus } from "@/lib/readiness/metrics";
import { AREA_LABELS } from "@/lib/readiness/taxonomy";
import { Empty, fmtDate, useDashboard } from "@/components/readiness/ui";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { track } from "@/lib/analytics";
import { RouteError, RouteNotFound } from "@/components/RouteError";

export const Route = createFileRoute("/_authenticated/readiness/interviews")({
  component: Interviews,
  errorComponent: RouteError,
  notFoundComponent: RouteNotFound,
});

const PAGE = 25;
const sel = "h-9 rounded-md border border-border bg-surface px-2 text-sm";

function Interviews() {
  const { data } = useDashboard();
  const [f, setF] = useState({ q: "", stage: "", status: "", source: "", context: "", delivery: "" });
  const [page, setPage] = useState(0);
  const rows = useMemo(() => {
    if (!data || data.empty) return [];
    return data.interviews.filter(
      (r) =>
        (!f.q || r.interviewer.toLowerCase().includes(f.q.toLowerCase())) &&
        (!f.stage || r.stage === f.stage) &&
        (!f.status || r.status === f.status) &&
        (!f.source || r.source === f.source) &&
        (!f.context || r.contextStatus === f.context) &&
        (!f.delivery || r.deliveryStatus === f.delivery),
    );
  }, [data, f]);
  if (!data || data.empty) return null;
  const set = (k: keyof typeof f) => (v: string) => {
    setF({ ...f, [k]: v });
    setPage(0);
    track("readiness_filter_applied", { filter: k });
  };
  const stages = [...new Set(data.interviews.map((r) => r.stage))];
  const deliveries = [...new Set(data.interviews.map((r) => r.deliveryStatus))];
  const shown = rows.slice(page * PAGE, page * PAGE + PAGE);
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <Input placeholder="Search interviewer" value={f.q} onChange={(e) => set("q")(e.target.value)} className="h-9 w-48" aria-label="Search interviewer" />
        <select className={sel} value={f.stage} onChange={(e) => set("stage")(e.target.value)} aria-label="Interview stage">
          <option value="">All stages</option>
          {stages.map((s) => <option key={s}>{s}</option>)}
        </select>
        <select className={sel} value={f.status} onChange={(e) => set("status")(e.target.value)} aria-label="Preparation status">
          <option value="">All statuses</option>
          {INTERVIEW_STATUSES.map((s) => <option key={s} value={s}>{INTERVIEW_STATUS_LABELS[s]}</option>)}
        </select>
        <select className={sel} value={f.context} onChange={(e) => set("context")(e.target.value)} aria-label="Context status">
          <option value="">All context</option>
          {["Sufficient", "Limited", "Missing"].map((s) => <option key={s}>{s}</option>)}
        </select>
        <select className={sel} value={f.delivery} onChange={(e) => set("delivery")(e.target.value)} aria-label="Delivery status">
          <option value="">All delivery</option>
          {deliveries.map((s) => <option key={s}>{s}</option>)}
        </select>
        <select className={sel} value={f.source} onChange={(e) => set("source")(e.target.value)} aria-label="Source">
          <option value="">All sources</option>
          {["Manual", "Google Calendar", "ATS"].map((s) => <option key={s}>{s}</option>)}
        </select>
      </div>
      <p className="text-xs text-muted-foreground">
        {rows.length} interviews · {rows.filter((r) => r.eligible).length} eligible. Cancelled interviews and interviews added less than 2 hours before they start are shown but never counted as missed preparation.
      </p>
      {shown.length ? (
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead className="bg-surface-2 text-left text-xs text-muted-foreground">
              <tr>
                {["When", "Interviewer", "Role · stage", "Context", "Preparation", "Delivery", "Completed", "Duration", "Areas practised"].map((h) => (
                  <th key={h} className="p-3 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {shown.map((r) => (
                <tr key={r.id} className="border-t border-border">
                  <td className="p-3 whitespace-nowrap">{fmtDate(r.startsAt, true)}<span className="block text-xs text-muted-foreground">{r.source}</span></td>
                  <td className="p-3">{r.interviewer}</td>
                  <td className="p-3">{r.role}<span className="block text-xs text-muted-foreground">{r.stage}</span></td>
                  <td className="p-3">{r.contextStatus}</td>
                  <td className="p-3"><StatusPill s={r.status} />{!r.eligible && r.status !== "cancelled" ? <span className="block text-xs text-muted-foreground">Not eligible</span> : null}</td>
                  <td className="p-3 text-xs">{r.deliveryStatus.replace(/_/g, " ")}</td>
                  <td className="p-3 whitespace-nowrap text-xs">{r.completedAt ? `${fmtDate(r.completedAt, true)}${r.onTime ? " · before start" : " · late"}` : "—"}</td>
                  <td className="p-3 text-xs">{r.durationMinutes === null ? "~4 min est." : `${r.durationMinutes} min`}</td>
                  <td className="p-3 text-xs">{r.areasPracticed.map((a) => AREA_LABELS[a]).join(", ") || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <Empty>No interviews match these filters.</Empty>
      )}
      {rows.length > PAGE ? (
        <div className="flex items-center justify-end gap-2 text-sm">
          <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(page - 1)}>Previous</Button>
          <span className="text-muted-foreground">Page {page + 1} of {Math.ceil(rows.length / PAGE)}</span>
          <Button variant="outline" size="sm" disabled={(page + 1) * PAGE >= rows.length} onClick={() => setPage(page + 1)}>Next</Button>
        </div>
      ) : null}
    </div>
  );
}

function StatusPill({ s }: { s: InterviewStatus }) {
  const good = s === "completed_on_time";
  const bad = s === "not_completed" || s === "generation_failed" || s === "delivery_failed";
  const icon = good ? "✓" : bad ? "!" : s === "cancelled" ? "–" : "•";
  const cls = good ? "bg-success/15 text-success" : bad ? "bg-warning/15 text-warning" : "bg-surface-2 text-muted-foreground";
  return <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs ${cls}`}><span aria-hidden>{icon}</span>{INTERVIEW_STATUS_LABELS[s]}</span>;
}
