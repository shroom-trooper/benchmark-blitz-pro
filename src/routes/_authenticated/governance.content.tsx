import { Link, Outlet, createFileRoute, useMatches } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Plus, Sparkles } from "lucide-react";
import { RouteError, RouteNotFound } from "@/components/RouteError";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { QuestionEditor } from "@/components/governance/QuestionEditor";
import { listQuestions } from "@/lib/governance.functions";
import { QUESTION_STATUSES, RISK_LABELS, STATUS_LABELS, type QuestionStatus } from "@/lib/governance/validation";
import { AREA_LABELS, subSkillLabel } from "@/lib/readiness/taxonomy";

export const Route = createFileRoute("/_authenticated/governance/content")({
  component: ContentLayout,
  errorComponent: RouteError,
  notFoundComponent: RouteNotFound,
});

function ContentLayout() {
  const matches = useMatches();
  return matches.some((m) => m.routeId === "/_authenticated/governance/content/$id") ? <Outlet /> : <QuestionList />;
}

export function QuestionList({ fixedStatus }: { fixedStatus?: QuestionStatus }) {
  const fn = useServerFn(listQuestions);
  const [status, setStatus] = useState<QuestionStatus | "">(fixedStatus ?? "");
  const [creating, setCreating] = useState(false);
  const q = useQuery({ queryKey: ["gov-questions", status], queryFn: () => fn({ data: status ? { status } : {} }) });
  if (q.isLoading) return <Skeleton className="h-60 w-full rounded-xl" />;
  if (q.isError || !q.data) return <p className="text-sm text-muted-foreground">You don't have access to the content library.</p>;
  const canCreate = q.data.permissions.includes("content.create");
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        {fixedStatus ? (
          <p className="text-sm text-muted-foreground">Questions submitted for review. Authors can't approve their own elevated or high-risk questions.</p>
        ) : (
          <select className="h-9 rounded-md border border-border bg-surface px-2 text-sm" value={status} onChange={(e) => setStatus(e.target.value as QuestionStatus)} aria-label="Status">
            <option value="">All statuses</option>
            {QUESTION_STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
          </select>
        )}
        {canCreate && !fixedStatus ? (
          <Button size="sm" onClick={() => setCreating((v) => !v)}>
            <Plus className="size-4" /> New draft question
          </Button>
        ) : null}
      </div>
      {creating ? <QuestionEditor onDone={() => { setCreating(false); q.refetch(); }} /> : null}
      {q.data.questions.length ? (
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead className="bg-surface-2 text-left text-xs text-muted-foreground">
              <tr>
                {["Question", "Capability", "Status", "Risk", "Version", "Author"].map((h) => <th key={h} className="p-3">{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {q.data.questions.map((x) => (
                <tr key={x.id} className="border-t border-border">
                  <td className="p-3">
                    <Link to="/governance/content/$id" params={{ id: x.id }} className="hover:underline">{x.scenario || "Untitled"}</Link>
                    {x.ai ? <span className="ml-1 inline-flex items-center gap-0.5 text-xs text-muted-foreground"><Sparkles className="size-3" /> AI</span> : null}
                  </td>
                  <td className="p-3 text-xs">{AREA_LABELS[x.area as keyof typeof AREA_LABELS] ?? x.area}<span className="block text-muted-foreground">{subSkillLabel(x.subSkill)}</span></td>
                  <td className="p-3 text-xs">{STATUS_LABELS[x.status]}</td>
                  <td className="p-3 text-xs">{RISK_LABELS[x.risk]}</td>
                  <td className="p-3 text-xs">v{x.version}</td>
                  <td className="p-3 text-xs">{x.author}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
          {fixedStatus ? "Nothing is waiting for review." : "No questions yet. Draft a question to start your organization's reviewed library."}
        </p>
      )}
    </div>
  );
}
