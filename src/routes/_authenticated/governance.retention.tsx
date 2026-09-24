import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { RouteError, RouteNotFound } from "@/components/RouteError";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { createDeletionRequest, getRetention, processDeletionRequest, setRetention } from "@/lib/governance.functions";

export const Route = createFileRoute("/_authenticated/governance/retention")({
  component: Retention,
  errorComponent: RouteError,
  notFoundComponent: RouteNotFound,
});

const FIELDS = [
  { key: "candidate_context_days", label: "Candidate context (profile, job description, candidate name) after the interview", min: 1, max: 365 },
  { key: "attachment_text_days", label: "Extracted attachment text", min: 1, max: 90 },
  { key: "calendar_details_days", label: "Calendar event descriptions", min: 7, max: 730 },
  { key: "audit_days", label: "Audit records", min: 365, max: 2555 },
] as const;
type Policy = Record<(typeof FIELDS)[number]["key"], number>;

function Retention() {
  const fn = useServerFn(getRetention);
  const setFn = useServerFn(setRetention);
  const createFn = useServerFn(createDeletionRequest);
  const processFn = useServerFn(processDeletionRequest);
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["gov-retention"], queryFn: () => fn() });
  const [p, setP] = useState<Policy | null>(null);
  const [req, setReq] = useState({ subjectType: "interview_context" as "interview_context" | "participant_account_data", subjectId: "", reason: "" });
  useEffect(() => {
    if (q.data && !p) setP(q.data.policy as Policy);
  }, [q.data, p]);
  if (q.isLoading || !p) return <Skeleton className="h-60 w-full rounded-xl" />;
  if (q.isError || !q.data) return <p className="text-sm text-muted-foreground">You don't have access to retention settings.</p>;
  const refresh = () => qc.invalidateQueries({ queryKey: ["gov-retention"] });
  const options = req.subjectType === "interview_context" ? q.data.interviews.map((i) => ({ id: i.id, label: `${i.label} — ${i.interviewer}` })) : q.data.members.map((m) => ({ id: m.id, label: m.name }));
  return (
    <div className="space-y-8">
      <section className="space-y-3 rounded-xl border border-border bg-surface p-5">
        <h2 className="text-sm font-medium">Retention policy</h2>
        <p className="text-xs text-muted-foreground">A daily job removes data older than these limits. De-identified capability evidence and preparation history are kept, so coaching stays accurate after candidate details are gone.</p>
        {FIELDS.map((f) => (
          <label key={f.key} className="flex flex-wrap items-center justify-between gap-2 text-sm">
            <span>{f.label}</span>
            <span className="flex items-center gap-2">
              <Input type="number" min={f.min} max={f.max} className="h-8 w-24" value={p[f.key]} onChange={(e) => setP({ ...p, [f.key]: Number(e.target.value) })} />
              <span className="text-xs text-muted-foreground">days ({f.min}–{f.max})</span>
            </span>
          </label>
        ))}
        <Button
          size="sm"
          onClick={async () => {
            try {
              await setFn({ data: p });
              toast.success("Retention policy saved");
              refresh();
            } catch (e) {
              toast.error((e as Error).message);
            }
          }}
        >
          Save policy
        </Button>
      </section>

      {q.data.canDelete ? (
        <section className="space-y-3">
          <h2 className="text-sm uppercase tracking-wide text-muted-foreground">Deletion requests</h2>
          <div className="flex flex-wrap gap-2 rounded-xl border border-border bg-surface p-4">
            <select className="h-9 rounded-md border border-border bg-surface px-2 text-sm" value={req.subjectType} onChange={(e) => setReq({ ...req, subjectType: e.target.value as typeof req.subjectType, subjectId: "" })} aria-label="What to delete">
              <option value="interview_context">One interview's candidate context</option>
              <option value="participant_account_data">All candidate context for a participant</option>
            </select>
            <select className="h-9 max-w-xs rounded-md border border-border bg-surface px-2 text-sm" value={req.subjectId} onChange={(e) => setReq({ ...req, subjectId: e.target.value })} aria-label="Subject">
              <option value="">Choose…</option>
              {options.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
            </select>
            <Input className="h-9 max-w-xs" placeholder="Reason" value={req.reason} onChange={(e) => setReq({ ...req, reason: e.target.value })} />
            <Button
              size="sm"
              disabled={!req.subjectId || req.reason.trim().length < 5}
              onClick={async () => {
                try {
                  await createFn({ data: req });
                  toast.success("Deletion request created");
                  setReq({ ...req, subjectId: "", reason: "" });
                  refresh();
                } catch (e) {
                  toast.error((e as Error).message);
                }
              }}
            >
              Create request
            </Button>
          </div>
          {q.data.requests.length ? (
            <ul className="divide-y divide-border rounded-xl border border-border bg-surface text-sm">
              {q.data.requests.map((r) => {
                const res = r.result as { removed?: string[]; retained?: string[]; contexts?: number; attachments?: number };
                return (
                  <li key={r.id} className="p-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span>
                        {r.subject_type === "interview_context" ? "Interview context" : "Participant's candidate context"} · {r.status}
                        <span className="block text-xs text-muted-foreground">{r.reason} · requested by {r.requester} · {new Date(r.created_at).toLocaleDateString()}</span>
                      </span>
                      {r.status === "pending" ? (
                        <span className="flex gap-2">
                          <Button size="sm" onClick={async () => { try { await processFn({ data: { id: r.id, approve: true } }); toast.success("Deleted"); refresh(); } catch (e) { toast.error((e as Error).message); } }}>Delete now</Button>
                          <Button size="sm" variant="outline" onClick={async () => { await processFn({ data: { id: r.id, approve: false } }); refresh(); }}>Reject</Button>
                        </span>
                      ) : null}
                    </div>
                    {r.status === "completed" && res.removed ? (
                      <p className="mt-1 text-xs text-muted-foreground">
                        Removed: {res.removed.join(", ")} ({res.contexts ?? 0} contexts, {res.attachments ?? 0} attachments). Kept: {res.retained?.join(", ")}.
                      </p>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          ) : null}
        </section>
      ) : null}
    </div>
  );
}
