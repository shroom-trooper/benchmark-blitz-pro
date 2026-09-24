import { Link, createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { RouteError, RouteNotFound } from "@/components/RouteError";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { QuestionEditor } from "@/components/governance/QuestionEditor";
import { getQuestion, questionAction } from "@/lib/governance.functions";
import { REVIEW_CHECKLIST, RISK_LABELS, STATUS_LABELS, checklistComplete, isEditable, type LifecycleAction } from "@/lib/governance/validation";
import { AREA_LABELS, subSkillLabel } from "@/lib/readiness/taxonomy";

export const Route = createFileRoute("/_authenticated/governance/content/$id")({
  component: Detail,
  errorComponent: RouteError,
  notFoundComponent: RouteNotFound,
});

const ACTION_LABELS: Record<LifecycleAction, string> = {
  submit: "Submit for review",
  approve: "Approve",
  request_changes: "Request changes",
  reject: "Reject",
  publish: "Publish",
  suspend: "Suspend",
  retire: "Retire",
  revise: "Create new version",
};

function Detail() {
  const { id } = Route.useParams();
  const fn = useServerFn(getQuestion);
  const act = useServerFn(questionAction);
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["gov-question", id], queryFn: () => fn({ data: { id } }) });
  const [editing, setEditing] = useState(false);
  const [reason, setReason] = useState("");
  const [exceptionReason, setExceptionReason] = useState("");
  const [checklist, setChecklist] = useState<Record<string, boolean>>({});
  const [busy, setBusy] = useState(false);

  if (q.isLoading) return <Skeleton className="h-80 w-full rounded-xl" />;
  if (q.isError || !q.data) return <p className="text-sm text-muted-foreground">Question not found.</p>;
  const d = q.data;
  const v = d.versions[0]!;
  const perms = new Set(d.permissions);
  const status = d.definition.status;
  const isAuthor = d.definition.createdBy === d.me || v.created_by === d.me;
  const needsException = isAuthor && v.risk_level === "elevated" && d.eligibleReviewers <= 1;

  const run = async (action: LifecycleAction) => {
    setBusy(true);
    try {
      const r = await act({ data: { id, action, reason: reason || null, checklist, exceptionReason: exceptionReason || null } });
      toast.success(`${STATUS_LABELS[r.status]}${r.exception ? " (single-reviewer exception recorded)" : ""}`);
      setReason("");
      qc.invalidateQueries({ queryKey: ["gov-question", id] });
      qc.invalidateQueries({ queryKey: ["gov-questions"] });
      qc.invalidateQueries({ queryKey: ["governance-overview"] });
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const actions: { a: LifecycleAction; perm: string; show: boolean }[] = [
    { a: "submit", perm: "content.submit_review", show: status === "draft" || status === "changes_requested" },
    { a: "approve", perm: "content.approve", show: status === "in_review" },
    { a: "request_changes", perm: "content.review", show: status === "in_review" },
    { a: "reject", perm: "content.review", show: status === "in_review" },
    { a: "publish", perm: "content.publish", show: status === "approved" },
    { a: "suspend", perm: "content.suspend_scoring", show: status === "published" },
    { a: "retire", perm: "content.retire", show: ["published", "suspended", "approved"].includes(status) },
    { a: "revise", perm: "content.edit_draft", show: ["published", "suspended", "rejected", "approved"].includes(status) },
  ];
  const visible = actions.filter((x) => x.show && perms.has(x.perm as never));
  const reviewing = status === "in_review" && perms.has("content.review");

  return (
    <div className="space-y-6">
      <Link to="/governance/content" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> Content library
      </Link>
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className="rounded-full bg-surface-2 px-2.5 py-1">{STATUS_LABELS[status]}</span>
        <span className="rounded-full bg-surface-2 px-2.5 py-1">Risk: {RISK_LABELS[v.risk_level]}</span>
        <span className="rounded-full bg-surface-2 px-2.5 py-1">v{v.version_number}{v.locked ? " · locked" : ""}</span>
        <span className="text-muted-foreground">Author: {d.definition.author}</span>
      </div>
      {d.definition.statusReason ? <p className="text-sm text-muted-foreground">Reason: {d.definition.statusReason}</p> : null}

      {editing ? (
        <QuestionEditor initial={{ ...v, id }} onDone={() => { setEditing(false); q.refetch(); }} />
      ) : (
        <div className="rounded-xl border border-border bg-surface p-5">
          <p className="text-xs text-muted-foreground">{AREA_LABELS[v.capability_area as keyof typeof AREA_LABELS]} · {subSkillLabel(v.sub_skill)} · {v.difficulty}</p>
          <p className="mt-2 text-body">{v.scenario}</p>
          <ol className="mt-3 space-y-1.5 text-sm">
            {v.options.map((o, i) => (
              <li key={i} className={`rounded-lg border p-2.5 ${i === v.correct_index ? "border-success/60 bg-success/10" : "border-border"}`}>
                {i === v.correct_index ? "✓ " : ""}{o}
              </li>
            ))}
          </ol>
          <p className="mt-3 text-sm text-muted-foreground">{v.explanation}</p>
          {v.sources.length ? <p className="mt-2 text-xs text-muted-foreground">Sources: {v.sources.join("; ")}</p> : null}
          {v.validation.issues?.length ? <p className="mt-2 text-xs text-warning">Automated checks: {v.validation.issues.join(" ")}</p> : null}
          {isEditable(status) && perms.has("content.edit_draft") ? (
            <Button size="sm" variant="outline" className="mt-3" onClick={() => setEditing(true)}>Edit draft</Button>
          ) : null}
        </div>
      )}

      {reviewing ? (
        <section className="space-y-3 rounded-xl border border-border bg-surface p-5">
          <h2 className="text-sm font-medium">Review checklist</h2>
          {REVIEW_CHECKLIST.map((s) => (
            <fieldset key={s.section}>
              <legend className="text-xs uppercase tracking-wide text-muted-foreground">{s.section}</legend>
              <div className="mt-1 grid gap-1 sm:grid-cols-2">
                {s.items.map((it) => (
                  <label key={it.key} className="flex items-center gap-2 text-sm">
                    <Checkbox checked={!!checklist[it.key]} onCheckedChange={(c) => setChecklist({ ...checklist, [it.key]: c === true })} />
                    {it.label}
                  </label>
                ))}
              </div>
            </fieldset>
          ))}
          {isAuthor && v.risk_level !== "standard" ? (
            <p className="text-xs text-warning">
              {v.risk_level === "high"
                ? "You authored this high-risk question, so another reviewer must approve it."
                : needsException
                  ? "You're the only reviewer. Approving your own elevated question records a single-reviewer exception."
                  : "You authored this elevated question, so another reviewer must approve it."}
            </p>
          ) : null}
          {needsException ? (
            <Textarea value={exceptionReason} onChange={(e) => setExceptionReason(e.target.value)} placeholder="Reason for the single-reviewer exception" rows={2} />
          ) : null}
        </section>
      ) : null}

      {visible.length ? (
        <section className="space-y-2">
          <Textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Reason or feedback (required for request changes, reject, suspend and retire)" rows={2} maxLength={1000} />
          <div className="flex flex-wrap gap-2">
            {visible.map(({ a }) => (
              <Button
                key={a}
                size="sm"
                variant={a === "reject" || a === "suspend" || a === "retire" ? "outline" : "default"}
                disabled={busy || (a === "approve" && !checklistComplete(checklist))}
                onClick={() => run(a)}
              >
                {ACTION_LABELS[a]}
              </Button>
            ))}
          </div>
        </section>
      ) : null}

      <section>
        <h2 className="mb-2 text-sm uppercase tracking-wide text-muted-foreground">History</h2>
        <ul className="divide-y divide-border rounded-xl border border-border bg-surface text-sm">
          {d.reviews.map((r) => (
            <li key={r.id} className="p-3">
              <span className="font-medium">{r.reviewer}</span> {r.decision.replace("_", " ")}
              {r.exception ? " (single-reviewer exception)" : ""} · <span className="text-xs text-muted-foreground">{new Date(r.reviewedAt).toLocaleString()}</span>
              {r.feedback ? <p className="text-xs text-muted-foreground">{r.feedback}</p> : null}
            </li>
          ))}
          {d.publications.map((p) => (
            <li key={p.id} className="p-3 text-xs text-muted-foreground">
              Published {new Date(p.publishedAt).toLocaleString()}{p.unpublishedAt ? ` · unpublished ${new Date(p.unpublishedAt).toLocaleString()}` : ""}
            </li>
          ))}
          {d.versions.map((x) => (
            <li key={x.id} className="p-3 text-xs text-muted-foreground">v{x.version_number} created by {x.author} · {new Date(x.created_at).toLocaleString()}</li>
          ))}
        </ul>
      </section>
    </div>
  );
}
