import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { ArrowRight, CheckCircle2, Clock, Sparkles, XCircle } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { getAssessment, submitAssessment } from "@/lib/benchmark.functions";
import { track } from "@/lib/analytics";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/_authenticated/assessment/$id")({
  head: () => ({
    meta: [
      { title: "Group assessment · Benchmark" },
      {
        name: "description",
        content:
          "Take a custom hiring assessment built by your group lead and get instant feedback on every decision.",
      },
      { property: "og:title", content: "Group assessment · Benchmark" },
      {
        property: "og:description",
        content: "A custom hiring capability test built for your team.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AssessmentPage,
});

type Result = Awaited<ReturnType<typeof submitAssessment>>;

function AssessmentPage() {
  const { id } = useParams({ from: "/_authenticated/assessment/$id" });
  const getFn = useServerFn(getAssessment);
  const submitFn = useServerFn(submitAssessment);
  const queryClient = useQueryClient();

  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [result, setResult] = useState<Result | null>(null);

  const query = useQuery({
    queryKey: ["assessment", id],
    queryFn: () => getFn({ data: { id } }),
    retry: false,
  });

  const mutation = useMutation({
    mutationFn: (finalAnswers: number[]) =>
      submitFn({ data: { id, answers: finalAnswers } }),
    onSuccess: (data) => {
      setResult(data);
      track("assessment_completed", {
        assessment_id: id,
        score: data.score,
        xp_earned: data.xpEarned,
        leveled_up: data.leveledUp,
      });
      void queryClient.invalidateQueries({ queryKey: ["me"] });
      void queryClient.invalidateQueries({ queryKey: ["member-assessments"] });
      if (data.leveledUp) toast.success(`Level up! You reached level ${data.level}.`);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (query.isLoading)
    return (
      <AppShell>
        <Skeleton className="h-72 w-full rounded-xl" />
      </AppShell>
    );

  if (query.error || !query.data)
    return (
      <AppShell>
        <div className="rounded-xl border border-border bg-surface p-8 text-center">
          <h1 className="text-xl">Assessment unavailable</h1>
          <p className="mt-2 text-sm text-body">
            {(query.error as Error)?.message ?? "This assessment is no longer available."}
          </p>
          <Button asChild className="mt-6">
            <Link to="/hub">Back to hub</Link>
          </Button>
        </div>
      </AppShell>
    );

  const data = query.data;
  const total = data.questions.length;

  if (result)
    return (
      <AppShell>
        <div className="mx-auto max-w-3xl space-y-6">
          <div className="animate-pop rounded-2xl border border-primary/40 bg-gradient-to-br from-primary/15 to-surface p-8 text-center">
            <Sparkles className="mx-auto size-8 text-primary" />
            <h1 className="mt-3 text-3xl">
              {result.correctCount}/{result.total} correct
            </h1>
            <p className="mt-1 text-body">{data.assessment.title} complete</p>
            <div className="mt-6 flex flex-wrap justify-center gap-3 text-sm">
              <Pill label={`+${result.xp.base} XP base`} />
              {result.xp.perfect ? <Pill label={`+${result.xp.perfect} perfect bonus`} /> : null}
            </div>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-6 text-sm">
              <span>Level {result.level}</span>
              <span>{result.totalXp} total XP</span>
            </div>
          </div>

          {result.results.map((r, i) => {
            const q = data.questions[i]!;
            return (
              <div key={r.index} className="rounded-xl border border-border bg-surface p-6">
                <div className="flex items-start gap-3">
                  {r.correct ? (
                    <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-success" />
                  ) : (
                    <XCircle className="mt-0.5 size-5 shrink-0 text-destructive" />
                  )}
                  <div>
                    <p className="text-body">{q.scenario}</p>
                    <p className="mt-3 text-sm">
                      <span className="text-muted-foreground">Best answer: </span>
                      {q.options[r.correctIndex]}
                    </p>
                    {!r.correct ? (
                      <p className="mt-1 text-sm">
                        <span className="text-muted-foreground">You chose: </span>
                        {q.options[r.chosen]}
                      </p>
                    ) : null}
                    {r.explanation ? (
                      <p className="mt-3 text-sm text-body">{r.explanation}</p>
                    ) : null}
                  </div>
                </div>
              </div>
            );
          })}

          <Button asChild>
            <Link to="/hub">Back to hub</Link>
          </Button>
        </div>
      </AppShell>
    );

  if (data.completed) {
    const completed = data.completed;
    return (
      <AppShell>
        <div className="mx-auto max-w-3xl space-y-6">
          <h1 className="text-2xl">{data.assessment.title}</h1>
          <div className="rounded-xl border border-success/40 bg-success/10 p-6">
            <p className="text-lg text-success">
              Completed — {completed.score}/{total} correct, {completed.xpEarned} XP
            </p>
          </div>
          {data.questions.map((q, i) => {
            const review = completed.review[i]!;
            const chosen = completed.answers[i]!;
            return (
              <div key={q.index} className="rounded-xl border border-border bg-surface p-6">
                <p className="text-sm text-muted-foreground">Scenario {i + 1}</p>
                <p className="mt-2 text-body">{q.scenario}</p>
                <ul className="mt-4 space-y-2">
                  {q.options.map((o, oi) => (
                    <li
                      key={oi}
                      className={`rounded-lg border p-3 text-sm ${
                        oi === review.correctIndex
                          ? "border-success/50 bg-success/10"
                          : oi === chosen
                            ? "border-destructive/50 bg-destructive/10"
                            : "border-border"
                      }`}
                    >
                      {o}
                    </li>
                  ))}
                </ul>
                {review.explanation ? (
                  <p className="mt-4 text-sm text-body">{review.explanation}</p>
                ) : null}
              </div>
            );
          })}
          <Button asChild variant="outline">
            <Link to="/hub">Back to hub</Link>
          </Button>
        </div>
      </AppShell>
    );
  }

  if (!total)
    return (
      <AppShell>
        <div className="rounded-xl border border-border bg-surface p-8 text-center">
          <h1 className="text-xl">Nothing to answer yet</h1>
          <p className="mt-2 text-sm text-body">
            Your group lead hasn't added any questions to this assessment.
          </p>
          <Button asChild className="mt-6">
            <Link to="/hub">Back to hub</Link>
          </Button>
        </div>
      </AppShell>
    );

  const question = data.questions[step]!;

  function next() {
    if (selected === null) return;
    const updated = [...answers, selected];
    setAnswers(updated);
    setSelected(null);
    if (updated.length === total) mutation.mutate(updated);
    else setStep(step + 1);
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-3xl space-y-6">
        <div>
          <h1 className="text-2xl">{data.assessment.title}</h1>
          <p className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="size-4" /> approx {data.assessment.estimatedMinutes} min ·{" "}
            {total} questions
          </p>
        </div>
        <Progress value={((step + 1) / total) * 100} className="h-1.5" />
        <div
          key={step}
          className="animate-rise rounded-xl border border-border bg-surface p-6 sm:p-8"
        >
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            Scenario {step + 1} of {total}
          </p>
          <p className="mt-3 text-lg text-body">{question.scenario}</p>
          <div className="mt-6 space-y-3">
            {question.options.map((o, oi) => (
              <button
                key={oi}
                type="button"
                onClick={() => setSelected(oi)}
                className={`w-full rounded-lg border p-4 text-left text-sm transition-colors ${
                  selected === oi
                    ? "border-primary bg-primary/10"
                    : "border-border hover:border-primary/50 hover:bg-surface-2"
                }`}
              >
                {o}
              </button>
            ))}
          </div>
          <Button
            className="mt-6 w-full"
            size="lg"
            disabled={selected === null || mutation.isPending}
            onClick={next}
          >
            {mutation.isPending
              ? "Scoring…"
              : step === total - 1
                ? "Submit assessment"
                : "Next scenario"}
            <ArrowRight className="size-4" />
          </Button>
        </div>
      </div>
    </AppShell>
  );
}

function Pill({ label }: { label: string }) {
  return (
    <span className="rounded-full bg-primary/15 px-3 py-1 font-medium text-primary">
      {label}
    </span>
  );
}
