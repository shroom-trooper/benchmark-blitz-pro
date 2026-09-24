import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { RouteError, RouteNotFound } from "@/components/RouteError";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { listAudit } from "@/lib/governance.functions";

export const Route = createFileRoute("/_authenticated/governance/audit")({
  component: Audit,
  errorComponent: RouteError,
  notFoundComponent: RouteNotFound,
});

const FILTERS = [
  ["", "All events"],
  ["role", "Roles"],
  ["content", "Content"],
  ["flag", "Flags"],
  ["evidence", "Evidence"],
  ["principle", "Principles"],
  ["retention", "Retention"],
  ["deletion", "Deletion"],
] as const;

function Audit() {
  const fn = useServerFn(listAudit);
  const [action, setAction] = useState("");
  const [before, setBefore] = useState<string | null>(null);
  const q = useQuery({ queryKey: ["gov-audit", action, before], queryFn: () => fn({ data: { action: action || null, before } }) });
  if (q.isLoading) return <Skeleton className="h-60 w-full rounded-xl" />;
  if (q.isError || !q.data) return <p className="text-sm text-muted-foreground">You don't have access to the audit log.</p>;
  const events = q.data.events;
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <select className="h-9 rounded-md border border-border bg-surface px-2 text-sm" value={action} onChange={(e) => { setAction(e.target.value); setBefore(null); }} aria-label="Event type">
          {FILTERS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
        <p className="text-xs text-muted-foreground">Read-only. Records can't be edited or deleted and never contain candidate or email content.</p>
      </div>
      {events.length ? (
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead className="bg-surface-2 text-left text-xs text-muted-foreground">
              <tr>{["When", "Who", "Action", "Target", "Details"].map((h) => <th key={h} className="p-3">{h}</th>)}</tr>
            </thead>
            <tbody>
              {events.map((e) => (
                <tr key={e.id} className="border-t border-border align-top">
                  <td className="p-3 whitespace-nowrap text-xs">{new Date(e.created_at).toLocaleString()}</td>
                  <td className="p-3 text-xs">{e.actor}</td>
                  <td className="p-3 text-xs font-medium">{e.action}</td>
                  <td className="p-3 text-xs">{e.target_type}</td>
                  <td className="p-3 text-xs text-muted-foreground">
                    {Object.entries((e.metadata ?? {}) as Record<string, unknown>).map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(", ") : String(v)}`).join(" · ")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">No audit events yet.</p>
      )}
      {events.length === 100 ? (
        <Button size="sm" variant="outline" onClick={() => setBefore(events.at(-1)!.created_at)}>Older events</Button>
      ) : null}
    </div>
  );
}
