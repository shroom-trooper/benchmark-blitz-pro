import { createFileRoute, Link, useNavigate, useParams } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { FileText } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { RouteError, RouteNotFound } from "@/components/RouteError";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { COMMON_COMPETENCIES } from "@/lib/readiness/taxonomy";
import { confirmDetectedInterview, dismissDetectedEvent, getCalendarEventForConfirm } from "@/lib/calendar.functions";
import { track } from "@/lib/analytics";
import { fmtWhen } from "./interviews.index";

export const Route = createFileRoute("/_authenticated/interviews/confirm/$eventId")({
  head: () => ({
    meta: [
      { title: "Confirm interview · Benchmark" },
      { name: "description", content: "Confirm or correct an interview found in your calendar." },
      { property: "og:title", content: "Confirm interview · Benchmark" },
      { property: "og:description", content: "Confirm an interview from your calendar." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ConfirmInterview,
  errorComponent: RouteError,
  notFoundComponent: RouteNotFound,
});

const KIND_LABEL: Record<string, string> = {
  cv: "CV",
  job_description: "Job description",
  scorecard: "Scorecard",
  interview_guide: "Interview guide",
  other: "Document",
};

function ConfirmInterview() {
  const { eventId } = useParams({ from: "/_authenticated/interviews/confirm/$eventId" });
  const getFn = useServerFn(getCalendarEventForConfirm);
  const confirmFn = useServerFn(confirmDetectedInterview);
  const dismissFn = useServerFn(dismissDetectedEvent);
  const nav = useNavigate();
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["cal-event", eventId], queryFn: () => getFn({ data: { id: eventId } }) });
  const [role, setRole] = useState("");
  const [candidate, setCandidate] = useState("");
  const [stage, setStage] = useState("");
  const [comps, setComps] = useState<string[]>([]);
  const [resp, setResp] = useState("");
  const [approved, setApproved] = useState<string[]>([]);

  useEffect(() => {
    if (!q.data) return;
    setRole(q.data.detected.role ?? q.data.event.subject ?? "");
    setCandidate(q.data.detected.candidate ?? "");
    setStage(q.data.detected.stage ?? "Interview");
  }, [q.data]);

  const confirm = useMutation({
    mutationFn: () =>
      confirmFn({
        data: {
          calendarEventId: eventId,
          roleTitle: role,
          candidateDisplayName: candidate,
          stage,
          competencies: comps,
          responsibility: resp || null,
          approvedAttachmentIds: approved,
        },
      }),
    onSuccess: (r) => {
      track("interview_confirmed", { source: "calendar", attachments: r.attachmentsUsed });
      for (const id of approved) {
        const kind = q.data?.attachments.find((a) => a.id === id)?.kind ?? "other";
        track("attachment_approved", { type: kind });
      }
      toast.success("Interview confirmed");
      qc.invalidateQueries();
      nav({ to: "/interviews/$id", params: { id: r.interviewId } });
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const dismiss = useMutation({
    mutationFn: () => dismissFn({ data: { id: eventId } }),
    onSuccess: () => {
      toast.success("Marked as not an interview");
      qc.invalidateQueries();
      nav({ to: "/interviews" });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (q.isLoading)
    return (
      <AppShell>
        <Skeleton className="mx-auto h-96 max-w-3xl rounded-xl" />
      </AppShell>
    );
  if (!q.data)
    return (
      <AppShell>
        <p className="text-center text-muted-foreground">Calendar event not found.</p>
      </AppShell>
    );
  const { event, attachments } = q.data;
  const valid = role.trim().length >= 2 && candidate.trim().length >= 1 && stage.trim().length >= 2;

  return (
    <AppShell>
      <div className="mx-auto max-w-3xl space-y-6">
        <Link to="/interviews" className="text-sm text-muted-foreground hover:text-foreground">
          ← All interviews
        </Link>
        <div>
          <p className="text-sm text-muted-foreground">From your Outlook calendar</p>
          <h1 className="text-3xl">Is this an interview?</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {event.subject ?? "Untitled event"} · {fmtWhen(event.startsAt)}
          </p>
        </div>

        <div className="space-y-4 rounded-xl border border-border bg-surface p-5">
          <p className="text-sm text-muted-foreground">We filled in what we could. Correct anything that's wrong.</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="role">Role</Label>
              <Input id="role" value={role} onChange={(e) => setRole(e.target.value)} maxLength={160} />
            </div>
            <div>
              <Label htmlFor="cand">Candidate (display name)</Label>
              <Input id="cand" value={candidate} onChange={(e) => setCandidate(e.target.value)} maxLength={120} />
            </div>
            <div>
              <Label htmlFor="stage">Stage</Label>
              <Input id="stage" value={stage} onChange={(e) => setStage(e.target.value)} maxLength={80} />
            </div>
            <div>
              <Label htmlFor="resp">Your focus (optional)</Label>
              <Input id="resp" value={resp} onChange={(e) => setResp(e.target.value)} maxLength={1000} />
            </div>
          </div>
          <div>
            <Label>Competencies</Label>
            <div className="mt-2 flex flex-wrap gap-2">
              {COMMON_COMPETENCIES.map((c) => {
                const on = comps.includes(c);
                return (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setComps(on ? comps.filter((x) => x !== c) : [...comps, c])}
                    className={`rounded-full border px-3 py-1 text-xs ${on ? "border-primary bg-primary/15 text-foreground" : "border-border text-muted-foreground"}`}
                  >
                    {c}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="space-y-3 rounded-xl border border-border bg-surface p-5">
          <p className="font-medium">Documents attached to this invite</p>
          {attachments.length === 0 ? (
            <p className="text-sm text-muted-foreground">No attachments on this invitation.</p>
          ) : (
            <ul className="space-y-2">
              {attachments.map((a) => (
                <li key={a.id} className="flex items-center gap-3 text-sm">
                  <Checkbox
                    id={a.id}
                    disabled={!a.supported}
                    checked={approved.includes(a.id)}
                    onCheckedChange={(v) => setApproved(v ? [...approved, a.id] : approved.filter((x) => x !== a.id))}
                  />
                  <FileText className="size-4 text-muted-foreground" />
                  <label htmlFor={a.id} className="min-w-0 flex-1 truncate">
                    {a.filename}
                  </label>
                  <span className="text-xs text-muted-foreground">
                    {a.supported ? KIND_LABEL[a.kind ?? "other"] : "Not supported (PDF, Word or text up to 5 MB)"}
                  </span>
                </li>
              ))}
            </ul>
          )}
          <p className="text-xs text-muted-foreground">
            Only ticked files are read, and only to tailor your preparation. Their text stays private to you and is
            deleted 7 days after the interview.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Button onClick={() => confirm.mutate()} disabled={!valid || confirm.isPending || event.cancelled}>
            {confirm.isPending ? "Saving…" : "Confirm interview"}
          </Button>
          <Button variant="ghost" onClick={() => dismiss.mutate()} disabled={dismiss.isPending}>
            Not an interview
          </Button>
        </div>
      </div>
    </AppShell>
  );
}
