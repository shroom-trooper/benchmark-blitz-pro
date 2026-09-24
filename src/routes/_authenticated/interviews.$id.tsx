import { createFileRoute, Link, useNavigate, useParams } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { CheckCircle2, Clock, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { generatePrep, getInterview } from "@/lib/readiness.functions";
import { track } from "@/lib/analytics";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { RouteError, RouteNotFound } from "@/components/RouteError";
import { fmtWhen } from "./interviews.index";

export const Route = createFileRoute("/_authenticated/interviews/$id")({
  head: () => ({
    meta: [
      { title: "Interview preparation · Benchmark" },
      { name: "description", content: "Interview details and your tailored preparation." },
      { property: "og:title", content: "Interview preparation · Benchmark" },
      { property: "og:description", content: "Prepare for this interview in 3–5 minutes." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: InterviewDetail,
  errorComponent: RouteError,
  notFoundComponent: RouteNotFound,
});

function InterviewDetail() {
  const { id } = useParams({ from: "/_authenticated/interviews/$id" });
  const fn = useServerFn(getInterview);
  const gen = useServerFn(generatePrep);
  const nav = useNavigate();
  const q = useQuery({ queryKey: ["interview", id], queryFn: () => fn({ data: { id } }) });

  const m = useMutation({
    mutationFn: () => gen({ data: { id } }),
    onSuccess: (r) => {
      if (!r.reused) track("prep_generated", { used_fallback: r.usedFallback });
      nav({ to: "/prep/$sessionId", params: { sessionId: r.sessionId } });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (q.isLoading) return <AppShell><Skeleton className="h-64 w-full rounded-xl" /></AppShell>;
  if (q.error || !q.data) return <AppShell><p className="text-center text-muted-foreground">Interview not found.</p></AppShell>;
  const { event, context, session } = q.data;
  const completed = session?.status === "completed";

  return (
    <AppShell>
      <div className="mx-auto max-w-3xl space-y-6">
        <Link to="/interviews" className="text-sm text-muted-foreground hover:text-foreground">← All interviews</Link>
        <div>
          <p className="text-sm text-muted-foreground">{event.interview_stage}</p>
          <h1 className="text-3xl">{event.role_title}</h1>
          <p className="mt-1 flex items-center gap-2 text-sm text-muted-foreground"><Clock className="size-4" /> {fmtWhen(event.starts_at)} · with {event.candidate_display_name}</p>
        </div>

        <div className="rounded-xl border border-border bg-surface p-5">
          {completed ? (
            <div className="flex flex-wrap items-center gap-4">
              <CheckCircle2 className="size-6 text-success" />
              <div className="flex-1">
                <p className="font-medium">Preparation complete</p>
                <p className="text-sm text-muted-foreground">
                  {session!.correct_answers}/{session!.total_questions} decisions aligned with best practice · {fmtWhen(session!.completed_at!)}
                </p>
              </div>
              <Button asChild variant="outline"><Link to="/prep/$sessionId" params={{ sessionId: session!.id }}>Review</Link></Button>
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-4">
              <Sparkles className="size-6 text-primary" />
              <div className="flex-1">
                <p className="font-medium">{session ? "Preparation in progress" : "Ready to prepare"}</p>
                <p className="text-sm text-muted-foreground">4–6 scenarios built around this role and stage · about 4 minutes</p>
              </div>
              <Button onClick={() => m.mutate()} disabled={m.isPending}>
                {m.isPending ? "Preparing questions…" : session ? "Resume preparation" : "Start preparation"}
              </Button>
            </div>
          )}
        </div>

        {context ? (
          <div className="space-y-4 rounded-xl border border-border bg-surface p-5">
            <div>
              <div className="mb-1 flex justify-between text-sm"><span>Context completeness</span><span className="text-muted-foreground">{context.completeness}%</span></div>
              <Progress value={context.completeness} className="h-1.5" />
            </div>
            {context.competencies.length ? (
              <div className="flex flex-wrap gap-2">
                {context.competencies.map((c) => <span key={c} className="rounded-full bg-surface-2 px-3 py-1 text-xs">{c}</span>)}
              </div>
            ) : null}
            {context.responsibility ? <p className="text-sm"><span className="text-muted-foreground">Your focus: </span>{context.responsibility}</p> : null}
            <p className="text-xs text-muted-foreground">
              {context.hasJobDescription ? "Job description added" : "No job description"} · {context.hasCandidateProfile ? "CV notes added (private to you)" : "No CV notes"}
            </p>
          </div>
        ) : null}
      </div>
    </AppShell>
  );
}
