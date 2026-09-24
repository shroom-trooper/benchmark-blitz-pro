import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useRef, useState } from "react";
import { ArrowRight, CheckCircle2, XCircle, Award } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { CapabilityGrid } from "@/components/CapabilityGrid";
import { FlagQuestion } from "@/components/FlagQuestion";
import { completePrep, getPrepSession, submitPrepAnswer } from "@/lib/readiness.functions";
import { AREA_LABELS, subSkillLabel } from "@/lib/readiness/taxonomy";
import { STAGE_LABELS } from "@/lib/readiness/scoring";
import { track } from "@/lib/analytics";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { RouteError, RouteNotFound } from "@/components/RouteError";

export const Route = createFileRoute("/_authenticated/prep/$sessionId")({
  head: () => ({
    meta: [
      { title: "Preparation session · Benchmark" },
      { name: "description", content: "Short scenario practice for your upcoming interview." },
      { property: "og:title", content: "Preparation session · Benchmark" },
      { property: "og:description", content: "Scenario practice with instant feedback." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: PrepPage,
  errorComponent: RouteError,
  notFoundComponent: RouteNotFound,
});

type Done = Awaited<ReturnType<typeof completePrep>>;
type Answer = {
  isCorrect: boolean;
  correctIndex: number;
  explanation: string;
  selectedIndex: number;
};

function PrepPage() {
  const { sessionId } = useParams({ from: "/_authenticated/prep/$sessionId" });
  const getFn = useServerFn(getPrepSession);
  const answerFn = useServerFn(submitPrepAnswer);
  const completeFn = useServerFn(completePrep);
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: ["prep", sessionId],
    queryFn: () => getFn({ data: { id: sessionId } }),
    refetchOnWindowFocus: false,
  });

  const [idx, setIdx] = useState<number | null>(null);
  const [selected, setSelected] = useState<number | null>(null);
  const [local, setLocal] = useState<Record<string, Answer>>({});
  const [done, setDone] = useState<Done | null>(null);
  const shownAt = useRef(Date.now());
  const startedTracked = useRef(false);

  const questions = q.data?.questions ?? [];
  const answerOf = (i: number) => {
    const qq = questions[i];
    return qq ? (local[qq.id] ?? qq.answer ?? null) : null;
  };

  useEffect(() => {
    if (q.data && idx === null) {
      const first = q.data.questions.findIndex((x) => !x.answer);
      setIdx(first === -1 ? q.data.questions.length - 1 : first);
    }
  }, [q.data, idx]);

  const answer = useMutation({
    mutationFn: (v: { questionId: string; selectedIndex: number }) =>
      answerFn({
        data: {
          sessionId,
          ...v,
          responseTimeSeconds: Math.round((Date.now() - shownAt.current) / 1000),
        },
      }),
    onSuccess: (r, v) => {
      setLocal((s) => ({ ...s, [v.questionId]: { ...r, selectedIndex: v.selectedIndex } }));
      const qq = questions.find((x) => x.id === v.questionId);
      track("prep_question_answered", {
        correct: r.isCorrect,
        capability_area: qq?.capabilityArea,
        difficulty: qq?.difficulty,
      });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const complete = useMutation({
    mutationFn: () => completeFn({ data: { id: sessionId } }),
    onSuccess: (r) => {
      setDone(r);
      track("prep_completed", { correct: r.correct, total: r.total });
      r.recognition.forEach((x) => track("recognition_earned", { code: x.code }));
      r.stageChanges.forEach((c) => track("capability_stage_changed", c));
      qc.invalidateQueries({ queryKey: ["interviews"] });
      qc.invalidateQueries({ queryKey: ["interview"] });
      qc.invalidateQueries({ queryKey: ["capability"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (q.isLoading || idx === null)
    return (
      <AppShell>
        <Skeleton className="h-72 w-full rounded-xl" />
      </AppShell>
    );
  if (q.error || !q.data)
    return (
      <AppShell>
        <p className="text-center text-muted-foreground">Preparation not found.</p>
      </AppShell>
    );

  const { session, interview } = q.data;
  if (done) return <Completion done={done} interviewId={interview?.id} />;

  if (session.status === "completed") {
    return (
      <AppShell>
        <div className="mx-auto max-w-3xl space-y-4">
          <h1 className="text-2xl">Preparation review · {interview?.role_title}</h1>
          {questions.map((qq) => (
            <QuestionCard key={qq.id} q={qq} answer={qq.answer} />
          ))}
          {interview ? (
            <Button asChild variant="outline">
              <Link to="/interviews/$id" params={{ id: interview.id }}>
                Back to interview
              </Link>
            </Button>
          ) : null}
        </div>
      </AppShell>
    );
  }

  const current = questions[idx]!;
  const ans = answerOf(idx);
  const isLast = idx === questions.length - 1;
  if (!startedTracked.current) {
    startedTracked.current = true;
    track("prep_started", { total: questions.length, used_fallback: session.usedFallback });
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-3xl space-y-5">
        <div>
          <p className="text-sm text-muted-foreground">
            Preparing for {interview?.role_title} · {interview?.interview_stage}
          </p>
          <Progress
            value={((idx + (ans ? 1 : 0)) / questions.length) * 100}
            className="mt-3 h-1.5"
          />
        </div>
        <QuestionCard
          key={current.id}
          q={current}
          answer={ans}
          selected={selected}
          onSelect={ans ? undefined : setSelected}
          header={`Scenario ${idx + 1} of ${questions.length}`}
        />
        {!ans ? (
          <Button
            className="w-full"
            size="lg"
            disabled={selected === null || answer.isPending}
            onClick={() => answer.mutate({ questionId: current.id, selectedIndex: selected! })}
          >
            {answer.isPending ? "Checking…" : "Confirm answer"}
          </Button>
        ) : isLast ? (
          <Button
            className="w-full"
            size="lg"
            disabled={complete.isPending}
            onClick={() => complete.mutate()}
          >
            {complete.isPending ? "Saving…" : "Finish preparation"}
          </Button>
        ) : (
          <Button
            className="w-full"
            size="lg"
            onClick={() => {
              setIdx(idx + 1);
              setSelected(null);
              shownAt.current = Date.now();
            }}
          >
            Next scenario <ArrowRight className="size-4" />
          </Button>
        )}
      </div>
    </AppShell>
  );
}

function QuestionCard({
  q,
  answer,
  selected = null,
  onSelect,
  header,
}: {
  q: {
    id?: string;
    scenario: string;
    options: string[];
    capabilityArea: keyof typeof AREA_LABELS;
    subSkill: string;
  };
  answer:
    | Answer
    | { selectedIndex: number; isCorrect: boolean; correctIndex: number; explanation: string }
    | null;
  selected?: number | null;
  onSelect?: ((i: number) => void) | undefined;
  header?: string | undefined;
}) {
  return (
    <div className="animate-rise rounded-xl border border-border bg-surface p-6">
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
        <span className="uppercase tracking-wide">{header}</span>
        <span className="rounded-full bg-surface-2 px-2.5 py-0.5">
          {AREA_LABELS[q.capabilityArea]} · {subSkillLabel(q.subSkill)}
        </span>
      </div>
      <p className="mt-3 text-lg text-body">{q.scenario}</p>
      <div className="mt-5 space-y-2">
        {q.options.map((o, i) => {
          const cls = answer
            ? i === answer.correctIndex
              ? "border-success/60 bg-success/10"
              : i === answer.selectedIndex
                ? "border-destructive/60 bg-destructive/10"
                : "border-border opacity-70"
            : selected === i
              ? "border-primary bg-primary/10"
              : "border-border hover:border-primary/50 hover:bg-surface-2";
          return (
            <button
              key={i}
              type="button"
              disabled={!onSelect}
              onClick={() => onSelect?.(i)}
              className={`w-full rounded-lg border p-4 text-left text-sm transition-colors ${cls}`}
            >
              {o}
            </button>
          );
        })}
      </div>
      {answer ? (
        <div className="mt-4 flex gap-3 rounded-lg bg-surface-2 p-4 text-sm">
          {answer.isCorrect ? (
            <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" />
          ) : (
            <XCircle className="mt-0.5 size-4 shrink-0 text-destructive" />
          )}
          <p className="text-body">{answer.explanation}</p>
        </div>
      ) : null}
      {answer && q.id ? <FlagQuestion prepQuestionId={q.id} /> : null}
    </div>
  );
}

function Completion({ done, interviewId }: { done: Done; interviewId?: string | undefined }) {
  return (
    <AppShell>
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="animate-rise rounded-2xl border border-border bg-surface p-8 text-center">
          <CheckCircle2 className="mx-auto size-8 text-success" />
          <h1 className="mt-3 text-2xl">You're prepared</h1>
          <p className="mt-1 text-body">
            {done.correct} of {done.total} interviewer decisions aligned with best practice.
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            This reflects your interviewing approach — not anything about the candidate.
          </p>
          <p className="mt-4 text-sm">
            Level {done.level.level} · {done.level.title}
          </p>
        </div>
        {done.stageChanges.length ? (
          <div className="rounded-xl border border-primary/30 bg-primary/10 p-4 text-sm">
            {done.stageChanges.map((c) => (
              <p key={c.area}>
                {AREA_LABELS[c.area]}: {STAGE_LABELS[c.from]} →{" "}
                <strong>{STAGE_LABELS[c.to]}</strong>
              </p>
            ))}
          </div>
        ) : null}
        {done.recognition.length ? (
          <div className="space-y-2">
            {done.recognition.map((r) => (
              <div
                key={r.code}
                className="flex items-center gap-3 rounded-xl border border-warning/30 bg-warning/10 p-4"
              >
                <Award className="size-5 text-warning" />
                <div>
                  <p className="text-sm font-medium">{r.name}</p>
                  <p className="text-xs text-muted-foreground">{r.description}</p>
                </div>
              </div>
            ))}
          </div>
        ) : null}
        <CapabilityGrid progress={done.progress} compact />
        <div className="flex flex-wrap gap-3">
          {interviewId ? (
            <Button asChild>
              <Link to="/interviews/$id" params={{ id: interviewId }}>
                Back to interview
              </Link>
            </Button>
          ) : null}
          <Button asChild variant="outline">
            <Link to="/capability">My capability</Link>
          </Button>
        </div>
      </div>
    </AppShell>
  );
}
