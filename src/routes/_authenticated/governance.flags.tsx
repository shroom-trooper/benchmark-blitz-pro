import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { RouteError, RouteNotFound } from "@/components/RouteError";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { listFlags, listInvalidations, resolveFlag, reverseInvalidation } from "@/lib/governance.functions";
import { FLAG_REASON_LABELS, type FlagReason } from "@/lib/governance/validation";
import { AREA_LABELS, subSkillLabel } from "@/lib/readiness/taxonomy";

export const Route = createFileRoute("/_authenticated/governance/flags")({
  component: Flags,
  errorComponent: RouteError,
  notFoundComponent: RouteNotFound,
});

const STATUS: Record<string, string> = {
  open: "Open",
  under_review: "Under review",
  dismissed: "Dismissed",
  confirmed_invalid: "Confirmed invalid",
  fixed: "Fixed",
};

function Flags() {
  const fn = useServerFn(listFlags);
  const invFn = useServerFn(listInvalidations);
  const resolve = useServerFn(resolveFlag);
  const reverse = useServerFn(reverseInvalidation);
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["gov-flags"], queryFn: () => fn() });
  const inv = useQuery({ queryKey: ["gov-invalidations"], queryFn: () => invFn() });
  const [notes, setNotes] = useState<Record<string, string>>({});
  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["gov-flags"] });
    qc.invalidateQueries({ queryKey: ["gov-invalidations"] });
    qc.invalidateQueries({ queryKey: ["governance-overview"] });
    qc.invalidateQueries({ queryKey: ["readiness-dashboard"] });
  };
  if (q.isLoading) return <Skeleton className="h-60 w-full rounded-xl" />;
  if (q.isError || !q.data) return <p className="text-sm text-muted-foreground">You don't have access to question flags.</p>;
  const act = async (id: string, decision: "under_review" | "dismissed" | "confirmed_invalid" | "fixed") => {
    try {
      const r = await resolve({ data: { id, decision, note: notes[id] ?? "" } });
      toast.success(decision === "confirmed_invalid" ? `Question invalidated — ${r.affected} answers excluded from scoring` : "Flag updated");
      refresh();
    } catch (e) {
      toast.error((e as Error).message);
    }
  };
  return (
    <div className="space-y-8">
      <p className="text-xs text-muted-foreground">
        While a flag is open, that question can't create a development area on its own. Confirming it invalid removes its answers from scores (they are kept and can be restored). Nobody can edit scores directly.
      </p>
      {q.data.flags.length ? (
        <div className="space-y-3">
          {q.data.flags.map((f) => (
            <div key={f.id} className="rounded-xl border border-border bg-surface p-4">
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="rounded-full bg-surface-2 px-2 py-0.5">{FLAG_REASON_LABELS[f.reason as FlagReason]}</span>
                <span className="rounded-full bg-surface-2 px-2 py-0.5">{STATUS[f.status]}</span>
                <span className="text-muted-foreground">by {f.reporter} · {new Date(f.createdAt).toLocaleDateString()}</span>
              </div>
              {f.question ? (
                <div className="mt-2 text-sm">
                  <p className="text-xs text-muted-foreground">{AREA_LABELS[f.question.capability_area as keyof typeof AREA_LABELS]} · {subSkillLabel(f.question.sub_skill)}</p>
                  <p className="mt-1">{f.question.scenario}</p>
                  <ol className="mt-2 space-y-1 text-xs">
                    {(f.question.options as string[]).map((o, i) => <li key={i} className={i === f.question!.correct_index ? "text-success" : "text-muted-foreground"}>{i === f.question!.correct_index ? "✓ " : "• "}{o}</li>)}
                  </ol>
                </div>
              ) : null}
              {f.comment ? <p className="mt-2 text-xs italic text-muted-foreground">“{f.comment}”</p> : null}
              {f.resolutionNote ? <p className="mt-2 text-xs text-muted-foreground">Resolution: {f.resolutionNote}</p> : null}
              {q.data.canResolve && (f.status === "open" || f.status === "under_review") ? (
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <Input className="h-8 max-w-sm" placeholder="Resolution note" value={notes[f.id] ?? ""} onChange={(e) => setNotes({ ...notes, [f.id]: e.target.value })} />
                  {f.status === "open" ? <Button size="sm" variant="outline" onClick={() => act(f.id, "under_review")}>Mark under review</Button> : null}
                  <Button size="sm" variant="outline" onClick={() => act(f.id, "dismissed")}>Dismiss</Button>
                  <Button size="sm" variant="outline" onClick={() => act(f.id, "fixed")}>Fixed</Button>
                  <Button size="sm" onClick={() => act(f.id, "confirmed_invalid")}>Confirm invalid</Button>
                </div>
              ) : null}
            </div>
          ))}
        </div>
      ) : (
        <p className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">No flagged questions.</p>
      )}

      <section>
        <h2 className="mb-2 text-sm uppercase tracking-wide text-muted-foreground">Evidence corrections</h2>
        {inv.data?.items.length ? (
          <ul className="divide-y divide-border rounded-xl border border-border bg-surface text-sm">
            {inv.data.items.map((i) => (
              <li key={i.id} className="flex flex-wrap items-center justify-between gap-2 p-3">
                <span>
                  {i.affected_evidence} answers excluded · {i.reason}
                  <span className="block text-xs text-muted-foreground">{new Date(i.created_at).toLocaleString()}{i.reversed_at ? ` · restored ${new Date(i.reversed_at).toLocaleString()}` : ""}</span>
                </span>
                {inv.data.canReverse && !i.reversed_at ? (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={async () => {
                      const reason = window.prompt("Why restore these answers?") ?? "";
                      try {
                        await reverse({ data: { id: i.id, reason } });
                        toast.success("Answers restored to scoring");
                        refresh();
                      } catch (e) {
                        toast.error((e as Error).message);
                      }
                    }}
                  >
                    Restore
                  </Button>
                ) : null}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">No evidence has been corrected.</p>
        )}
      </section>
    </div>
  );
}
