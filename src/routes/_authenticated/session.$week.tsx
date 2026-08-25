import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import {
  ArrowRight,
  CheckCircle2,
  Flame,
  Lightbulb,
  Sparkles,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { getWeek, submitWeek } from "@/lib/benchmark.functions";
import { QUARTER_THEMES, quarterForWeek } from "@/lib/gamification";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/_authenticated/session/$week")({
  head: () => ({
    meta: [
      { title: "Weekly simulation · Benchmark" },
      {
        name: "description",
        content:
          "Work through three realistic hiring scenarios and get instant, evidence-based feedback on every decision.",
      },
      { property: "og:title", content: "Weekly simulation · Benchmark" },
      {
        property: "og:description",
        content: "Three hiring scenarios, instant feedback, XP and streak rewards.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SessionPage,
});

type SubmitResult = Awaited<ReturnType<typeof submitWeek>>;

function SessionPage() {
  const { week } = useParams({ from: "/_authenticated/session/$week" });
  const weekNumber = Number(week);
  const getWeekFn = useServerFn(getWeek);
  const submitFn = useServerFn(submitWeek);
  const queryClient = useQueryClient();

  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [result, setResult] = useState<SubmitResult | null>(null);

  const query = useQuery({
    queryKey: ["week", weekNumber],
    queryFn: () => getWeekFn({ data: { week: weekNumber } }),
    retry: false,
  });

  const mutation = useMutation({
    mutationFn: (finalAnswers: number[]) =>
      submitFn({ data: { week: weekNumber, answers: finalAnswers } }),
    onSuccess: (data) => {
      setResult(data);
      queryClient.invalidateQueries({ queryKey: ["me"] });
      queryClient.invalidateQueries({ queryKey: ["week", weekNumber] });
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
          <h1 className="text-xl">Session unavailable</h1>
          <p className="mt-2 text-sm text-body">{query.error.message}</p>
          <Button asChild className="mt-6">
            <Link to="/hub">Back to hub</Link>
          </Button>
        </div>
      </AppShell>
    );
  }

  const data = query.data!;
  const theme = QUARTER_THEMES[quarterForWeek(weekNumber)]!;

  if (result) return <ResultView weekNumber={weekNumber} result={result} data={data} />;

  if (data.completed) {
    return (
      <AppShell>
        <div className="mx-auto max-w-3xl space-y-6">
          <Header week={weekNumber} topic={data.week.topic} theme={theme.name} />
          <div className="rounded-xl border border-success/40 bg-success/10 p-6">
            <p className="font-display text-lg text-success">
              Completed — {data.completed.score}/3 correct, {data.completed.xpEarned} XP
            </p>
          </div>
          {data.questions.map((q, i) => {
            const review = data.completed!.review[i]!;
            const chosen = data.completed!.answers[i]!;
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
            <Link to="/hub">Back to hub</Link>
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
        <Header week={weekNumber} topic={data.week.topic} theme={theme.name} />
        <Progress
          value={((step + 1) / data.questions.length) * 100}
          className="h-1.5"
        />
        <div key={step} className="animate-rise rounded-xl border border-border bg-surface p-6 sm:p-8">
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
                ? "Submit simulation"
                : "Next scenario"}
            <ArrowRight className="size-4" />
          </Button>
        </div>
      </div>
    </AppShell>
  );
}

function Header({
  week,
  topic,
  theme,
}: {
  week: number;
  topic: string;
  theme: string;
}) {
  return (
    <div>
      <Badge className="bg-primary/15 text-primary hover:bg-primary/15">
        Week {week} · {theme}
      </Badge>
      <h1 className="mt-3 text-2xl">{topic}</h1>
    </div>
  );
}

function ResultView({
  weekNumber,
  result,
  data,
}: {
  weekNumber: number;
  result: SubmitResult;
  data: Awaited<ReturnType<typeof getWeek>>;
}) {
  return (
    <AppShell>
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="animate-pop rounded-2xl border border-primary/40 bg-gradient-to-br from-primary/15 to-surface p-8 text-center">
          <Sparkles className="mx-auto size-8 text-primary" />
          <h1 className="mt-3 text-3xl">
            {result.correctCount}/3 correct
          </h1>
          <p className="mt-1 text-body">Week {weekNumber} complete</p>
          <div className="mt-6 flex flex-wrap justify-center gap-3 text-sm">
            <Pill label={`+${result.xp.base} XP base`} />
            {result.xp.perfect ? <Pill label={`+${result.xp.perfect} perfect bonus`} /> : null}
            {result.xp.streakBonus ? (
              <Pill label={`+${result.xp.streakBonus} streak bonus`} />
            ) : null}
          </div>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-6 text-sm">
            <span className="flex items-center gap-2 text-warning">
              <Flame className="size-4" /> {result.streak} week streak
            </span>
            <span>Level {result.level}</span>
            <span>{result.totalXp} total XP</span>
          </div>
          {result.newAchievements.length ? (
            <p className="mt-4 text-sm text-success">
              Unlocked: {result.newAchievements.join(", ")}
            </p>
          ) : null}
        </div>

        <div className="flex gap-4 rounded-xl border border-warning/30 bg-warning/10 p-5">
          <Lightbulb className="mt-0.5 size-5 shrink-0 text-warning" />
          <div>
            <p className="text-sm font-semibold text-warning">Did you know?</p>
            <p className="mt-1 text-sm text-body">{data.week.fact}</p>
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
                  <p className="mt-3 text-sm text-body">{r.explanation}</p>
                </div>
              </div>
            </div>
          );
        })}

        <div className="flex gap-3">
          <Button asChild>
            <Link to="/hub">Back to hub</Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/leaderboard">See leaderboard</Link>
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
