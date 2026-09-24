import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { RouteError, RouteNotFound } from "@/components/RouteError";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { listPrinciples, retirePrinciple, savePrinciple } from "@/lib/governance.functions";

export const Route = createFileRoute("/_authenticated/governance/principles")({
  component: Principles,
  errorComponent: RouteError,
  notFoundComponent: RouteNotFound,
});

function Principles() {
  const fn = useServerFn(listPrinciples);
  const save = useServerFn(savePrinciple);
  const retire = useServerFn(retirePrinciple);
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["gov-principles"], queryFn: () => fn() });
  const [edit, setEdit] = useState<{ key: string | null; title: string; body: string } | null>(null);
  if (q.isLoading) return <Skeleton className="h-60 w-full rounded-xl" />;
  if (!q.data) return null;
  const active = q.data.principles.filter((p) => p.status === "active");
  const history = q.data.principles.filter((p) => p.status !== "active");
  const submit = async () => {
    if (!edit) return;
    try {
      await save({ data: { principleKey: edit.key, title: edit.title, body: edit.body } });
      toast.success(edit.key ? "New version saved" : "Principle added");
      setEdit(null);
      qc.invalidateQueries({ queryKey: ["gov-principles"] });
    } catch (e) {
      toast.error((e as Error).message);
    }
  };
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">Company interviewing principles that questions and explanations can cite. Editing creates a new version; older versions stay in history.</p>
        {q.data.canManage && !edit ? <Button size="sm" onClick={() => setEdit({ key: null, title: "", body: "" })}>Add principle</Button> : null}
      </div>
      {edit ? (
        <div className="space-y-2 rounded-xl border border-border bg-surface p-4">
          <Input value={edit.title} onChange={(e) => setEdit({ ...edit, title: e.target.value })} placeholder="Title" maxLength={120} />
          <Textarea value={edit.body} onChange={(e) => setEdit({ ...edit, body: e.target.value })} placeholder="What interviewers should do and why" rows={3} maxLength={2000} />
          <div className="flex gap-2">
            <Button size="sm" onClick={submit}>Save</Button>
            <Button size="sm" variant="ghost" onClick={() => setEdit(null)}>Cancel</Button>
          </div>
        </div>
      ) : null}
      {active.length ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {active.map((p) => (
            <div key={p.id} className="rounded-xl border border-border bg-surface p-4">
              <p className="text-sm font-medium">{p.title} <span className="text-xs text-muted-foreground">v{p.version_number}</span></p>
              <p className="mt-1 text-sm text-muted-foreground">{p.body}</p>
              {q.data.canManage ? (
                <div className="mt-3 flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => setEdit({ key: p.principle_key, title: p.title, body: p.body })}>Revise</Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={async () => {
                      const reason = window.prompt("Why retire this principle?") ?? "";
                      try {
                        await retire({ data: { id: p.id, reason } });
                        qc.invalidateQueries({ queryKey: ["gov-principles"] });
                      } catch (e) {
                        toast.error((e as Error).message);
                      }
                    }}
                  >
                    Retire
                  </Button>
                </div>
              ) : null}
            </div>
          ))}
        </div>
      ) : (
        <p className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">No principles yet.</p>
      )}
      {history.length ? (
        <details className="text-sm">
          <summary className="cursor-pointer text-muted-foreground">Version history ({history.length})</summary>
          <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
            {history.map((p) => <li key={p.id}>{p.title} v{p.version_number} · {p.status} · {new Date(p.created_at).toLocaleDateString()}</li>)}
          </ul>
        </details>
      ) : null}
    </div>
  );
}
