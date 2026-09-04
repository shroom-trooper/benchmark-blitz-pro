import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { ArrowRight, CheckCircle2, Sparkles, XCircle } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { getElectiveLesson, submitElective } from "@/lib/benchmark.functions";
import { track } from "@/lib/analytics";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/_authenticated/electives/$module/$lesson")({
  head: () => ({
    meta: [
      { title: "Elective lesson · Benchmark" },
      {
        name: "description",
        content:
          "Three specialist hiring scenarios with instant evidence-based feedback and XP rewards.",
      },
      { property: "og:title", content: "Elective lesson · Benchmark" },
      {
        property: "og:description",
        content: "Specialist interview practice with instant feedback and XP.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ElectiveLessonPage,
});

type SubmitResult = Awaited<ReturnType<typeof submitElective>>;

function ElectiveLessonPage() {
  const { module, lesson } = useParams({
    from: "/_authenticated/electives/$module/$lesson",
  });
  const loadFn = useServerFn(getElectiveLesson);
  const submitFn = useServerFn(submitElective);
  const queryClient = useQueryClient();

  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [result, setResult] = useState<SubmitResult | null>(null);

  const query = useQuery({
    queryKey: ["elective", module, lesson],
    queryFn: () => loadFn({ data: { moduleSlug: module, lessonSlug: lesson } }),
    retry: false,
  });

  const mutation = useMutation({
    mutationFn: (finalAnswers: number[]) =>
      submitFn({
        data: { moduleSlug: module, lessonSlug: lesson, answers: finalAnswers },
      }),
    onSuccess: (data) => {
      setResult(data);
      track("elective_completed", {
        module,
        lesson,
        score: data.correctCount,
        xp_earned: data.xp.total,
        leveled_up: data.leveledUp,
      });
      queryClient.invalidateQueries({ queryKey: ["me"] });
      queryClient.invalidateQueries({ queryKey: ["electives"] });
      queryClient.invalidateQueries({ queryKey: ["elective", module, lesson] });
      if (data.leveledUp) toast.success(`Level up! You reached level ${data.level}.`);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (query.isLoading) {
    return (
      <AppShell>
        <Skeleton className="h-72 w-full rounded-xl" />
      </AppShell>
    );
  }

  if (query.error) {
    return (
      <AppShell>
        <div className="rounded-xl border border-border bg-surface p-8 text-center">
          <h1 className="text-xl">Lesson unavailable</h1>
          <p className="mt-2 text-sm text-body">{query.error.message}</p>
          <Button asChild className="mt-6">
            <Link to="/electives">Back to electives</Link>
          </Button>
        </div>
      </AppShell>
    );
  }

  const data = query.data!;

  if (result) {
    return (
      <AppShell>
        <div className="mx-auto max-w-3xl space-y-6">
          <div className="animate-pop rounded-2xl border border-primary/40 bg-gradient-to-br from-primary/15 to-surface p-8 text-center">
            <Sparkles className="mx-auto size-8 text-primary" />
            <h1 className="mt-3 text-3xl">
              {result.correctCount}/{result.total} correct
            </h1>
            <p className="mt-1 text-body">
              {data.module.title} · {data.lesson.title}
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-6 text-sm">
              <span className="rounded-full bg-primary/15 px-3 py-1 font-medium text-primary">
                +{result.xp.total} XP
              </span>
              <span>Level {result.level}</span>
              <span>{result.totalXp} total XP</span>
            </div>
          </div>

          {result.results.map((r, i) => {
            const q = data.questions[i]!;
            return (
              <div
                key={r.index}
                className="rounded-xl border border-border bg-surface p-6"
              >
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
                    <p className="mt-3 text-sm text-body">{r.explanation}</p>
                  </div>
                </div>
              </div>
            );
          })}

          <div className="flex gap-3">
            <Button asChild>
              <Link to="/electives">More electives</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/hub">Back to hub</Link>
            </Button>
          </div>
        </div>
      </AppShell>
    );
  }

  if (data.completed) {
    const completed = data.completed;
    return (
      <AppShell>
        <div className="mx-auto max-w-3xl space-y-6">
          <LessonHeader module={data.module.title} title={data.lesson.title} focus={data.lesson.focus} />
          <div className="rounded-xl border border-success/40 bg-success/10 p-6">
            <p className="font-display text-lg text-success">
              Completed — {completed.score}/{data.questions.length} correct,{" "}
              {completed.xpEarned} XP
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
                <p className="mt-4 text-sm text-body">{review.explanation}</p>
              </div>
            );
          })}
          <Button asChild variant="outline">
            <Link to="/electives">Back to electives</Link>
          </Button>
        </div>
      </AppShell>
    );
  }

  const question = data.questions[step]!;

  function next() {
    if (selected === null) return;
    const updated = [...answers, selected];
    setAnswers(updated);
    setSelected(null);
    if (updated.length === data.questions.length) mutation.mutate(updated);
    else setStep(step + 1);
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-3xl space-y-6">
        <LessonHeader
          module={data.module.title}
          title={data.lesson.title}
          focus={data.lesson.focus}
        />
        <Progress value={((step + 1) / data.questions.length) * 100} className="h-1.5" />
        <div
          key={step}
          className="animate-rise rounded-xl border border-border bg-surface p-6 sm:p-8"
        >
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            Scenario {step + 1} of {data.questions.length}
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
              : step === data.questions.length - 1
                ? "Submit lesson"
                : "Next scenario"}
            <ArrowRight className="size-4" />
          </Button>
        </div>
      </div>
    </AppShell>
  );
}

function LessonHeader({
  module,
  title,
  focus,
}: {
  module: string;
  title: string;
  focus: string;
}) {
  return (
    <div>
      <Badge className="bg-primary/15 text-primary hover:bg-primary/15">
        Elective · {module}
      </Badge>
      <h1 className="mt-3 text-2xl">{title}</h1>
      <p className="mt-2 text-body">{focus}</p>
    </div>
  );
}
