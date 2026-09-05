import { useCallback, useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import {
  CheckCircle2,
  Flame,
  Timer,
  Trophy,
  X,
  XCircle,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { track } from "@/lib/analytics";
import { SPRINT_SECONDS_PER_QUESTION } from "@/lib/gamification";
import {
  answerSprint as answerSprintFn,
  getSprintStats,
  startSprint as startSprintFn,
} from "@/lib/benchmark.functions";

type SprintQuestion = {
  index: number;
  scenario: string;
  options: string[];
  source: string;
};

type Sprint = {
  sessionId: string;
  difficulty: string;
  multiplier: number;
  dailyStreak: number;
  questions: SprintQuestion[];
};

type Summary = {
  score: number;
  total: number;
  base: number;
  perfect: number;
  streakBonus: number;
  multiplier: number;
  xpEarned: number;
  totalXp: number;
  level: number;
  leveledUp: boolean;
  dailyStreak: number;
};

type Feedback = {
  correct: boolean;
  correctIndex: number;
  explanation: string;
};

export function useSprintStats() {
  const fn = useServerFn(getSprintStats);
  return useQuery({ queryKey: ["sprint-stats"], queryFn: () => fn() });
}

/** Dashboard widget: launches the arcade-style Quick Drill overlay. */
export function QuickDrillCard() {
  const { data: stats } = useSprintStats();
  const [open, setOpen] = useState(false);

  return (
    <>
      <section className="flex h-full flex-col justify-between rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/12 to-surface p-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="grid size-9 place-items-center rounded-lg bg-primary/20 text-primary">
              <Zap className="size-5" />
            </span>
            <div>
              <h2 className="text-lg leading-tight">Quick Drill</h2>
              <p className="text-xs text-muted-foreground">
                3–5 random scenarios · 45s each
              </p>
            </div>
          </div>
          <p className="mt-3 text-sm leading-relaxed text-body">
            A fast sprint pulled at random from everything you have unlocked. Every
            correct call adds XP to your rank.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Badge className="bg-surface-2 text-body hover:bg-surface-2">
              +20 XP per correct
            </Badge>
            <Badge className="bg-surface-2 text-body hover:bg-surface-2">
              +10 perfect bonus
            </Badge>
            {stats && stats.multiplier > 1 ? (
              <Badge className="bg-warning/20 text-warning hover:bg-warning/20">
                {stats.multiplier}× streak boost
              </Badge>
            ) : null}
          </div>
        </div>

        <div className="mt-5">
          <Button size="lg" className="w-full" onClick={() => setOpen(true)}>
            <Zap className="size-4" /> Start a sprint
          </Button>
          <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs text-muted-foreground">
            <div>
              <p className="font-display text-base text-foreground">
                {stats?.totalSprints ?? 0}
              </p>
              Sprints
            </div>
            <div>
              <p className="font-display text-base text-foreground">
                {stats?.dailyStreak ?? 0}d
              </p>
              Daily streak
            </div>
            <div>
              <p className="font-display text-base text-foreground">
                {stats?.accuracy ?? 0}%
              </p>
              Accuracy
            </div>
          </div>
        </div>
      </section>

      {open ? <SprintOverlay onClose={() => setOpen(false)} /> : null}
    </>
  );
}

/** Nudge shown once the weekly simulation is done. */
export function SprintBanner() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <section className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-primary/30 bg-primary/10 p-5">
        <div className="flex items-start gap-3">
          <Zap className="mt-0.5 size-5 shrink-0 text-primary" />
          <p className="text-sm text-body">
            <span className="font-semibold text-foreground">
              Want to boost your readiness score?
            </span>{" "}
            Take a 3-minute Quick Sprint.
          </p>
        </div>
        <Button onClick={() => setOpen(true)}>Start sprint</Button>
      </section>
      {open ? <SprintOverlay onClose={() => setOpen(false)} /> : null}
    </>
  );
}

function SprintOverlay({ onClose }: { onClose: () => void }) {
  const queryClient = useQueryClient();
  const start = useServerFn(startSprintFn);
  const answer = useServerFn(answerSprintFn);

  const [sprint, setSprint] = useState<Sprint | null>(null);
  const [index, setIndex] = useState(0);
  const [chosen, setChosen] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [seconds, setSeconds] = useState(SPRINT_SECONDS_PER_QUESTION);
  const locked = useRef(false);

  const startMutation = useMutation({
    mutationFn: () => start(),
    onSuccess: (data) => {
      setSprint(data as Sprint);
      setSeconds(SPRINT_SECONDS_PER_QUESTION);
      track("sprint_started", { difficulty: (data as Sprint).difficulty });
    },
    onError: (e: Error) => {
      toast.error(e.message);
      onClose();
    },
  });

  useEffect(() => {
    startMutation.mutate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const submit = useCallback(
    async (choice: number | null) => {
      if (!sprint || locked.current) return;
      locked.current = true;
      setChosen(choice);
      try {
        const res = await answer({
          data: { sessionId: sprint.sessionId, index, choice },
        });
        setFeedback({
          correct: res.correct,
          correctIndex: res.correctIndex,
          explanation: res.explanation,
        });
        if (res.finished && res.summary) {
          const s = res.summary as Summary;
          setSummary(s);
          track("sprint_completed", {
            score: s.score,
            total: s.total,
            xp: s.xpEarned,
            daily_streak: s.dailyStreak,
            levelled_up: s.leveledUp,
          });
          void queryClient.invalidateQueries();
        }
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Something went wrong.");
        locked.current = false;
      }
    },
    [answer, index, queryClient, sprint],
  );

  // 45-second arcade clock; running out counts as a miss.
  useEffect(() => {
    if (!sprint || feedback || summary) return;
    if (seconds <= 0) {
      void submit(null);
      return;
    }
    const t = setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [seconds, sprint, feedback, summary, submit]);

  function next() {
    setFeedback(null);
    setChosen(null);
    setIndex((i) => i + 1);
    setSeconds(SPRINT_SECONDS_PER_QUESTION);
    locked.current = false;
  }

  const question = sprint?.questions[index];

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/80 p-4 backdrop-blur-sm">
      <div className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-border bg-surface p-6 sm:p-8">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close sprint"
          className="absolute right-4 top-4 rounded-md p-1 text-muted-foreground transition-colors hover:text-foreground"
        >
          <X className="size-5" />
        </button>

        {!sprint ? (
          <p className="py-10 text-center text-sm text-muted-foreground">
            Shuffling your question deck…
          </p>
        ) : summary && !feedback ? (
          <SprintResult summary={summary} onClose={onClose} />
        ) : question ? (
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <Badge className="bg-primary/15 text-primary hover:bg-primary/15">
                Sprint · {sprint.difficulty}
              </Badge>
              <Badge className="bg-surface-2 text-body hover:bg-surface-2">
                {question.source}
              </Badge>
              <span
                className={`ml-auto flex items-center gap-1.5 font-display text-sm ${
                  seconds <= 10 ? "text-destructive" : "text-muted-foreground"
                }`}
              >
                <Timer className="size-4" /> {seconds}s
              </span>
            </div>

            <Progress
              value={((index + (feedback ? 1 : 0)) / sprint.questions.length) * 100}
              className="mt-4 h-1.5"
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Question {index + 1} of {sprint.questions.length}
            </p>

            <h2 className="mt-4 text-xl leading-snug">{question.scenario}</h2>

            <div className="mt-5 space-y-2">
              {question.options.map((opt, i) => {
                const isChosen = chosen === i;
                const isRight = feedback && feedback.correctIndex === i;
                const isWrong = feedback && isChosen && !feedback.correct;
                return (
                  <button
                    key={i}
                    type="button"
                    disabled={Boolean(feedback)}
                    onClick={() => void submit(i)}
                    className={`flex w-full items-start gap-3 rounded-xl border p-4 text-left text-sm transition-colors ${
                      isRight
                        ? "border-success/50 bg-success/10"
                        : isWrong
                          ? "border-destructive/50 bg-destructive/10"
                          : isChosen
                            ? "border-primary/50 bg-primary/10"
                            : "border-border bg-background/40 hover:border-primary/40 hover:bg-primary/5"
                    }`}
                  >
                    <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-md bg-surface-2 text-[11px] font-semibold">
                      {String.fromCharCode(65 + i)}
                    </span>
                    <span className="text-body">{opt}</span>
                  </button>
                );
              })}
            </div>

            {feedback ? (
              <div
                className={`mt-5 rounded-xl border p-4 ${
                  feedback.correct
                    ? "border-success/40 bg-success/10"
                    : "border-warning/40 bg-warning/10"
                }`}
              >
                <p
                  className={`flex items-center gap-2 text-sm font-semibold ${
                    feedback.correct ? "text-success" : "text-warning"
                  }`}
                >
                  {feedback.correct ? (
                    <CheckCircle2 className="size-4" />
                  ) : (
                    <XCircle className="size-4" />
                  )}
                  {feedback.correct
                    ? "High-signal call"
                    : chosen === null
                      ? "Time up — counted as a miss"
                      : "Low-signal call"}
                </p>
                <p className="mt-1.5 text-sm leading-relaxed text-body">
                  {feedback.explanation}
                </p>
                <Button className="mt-4" onClick={next}>
                  {index + 1 === sprint.questions.length ? "See results" : "Next scenario"}
                </Button>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function SprintResult({ summary, onClose }: { summary: Summary; onClose: () => void }) {
  return (
    <div className="py-4 text-center">
      <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-primary/20 text-primary">
        <Trophy className="size-7" />
      </span>
      <h2 className="mt-4 text-2xl">
        {summary.score} / {summary.total} correct
      </h2>
      <p className="mt-1 text-sm text-body">
        {summary.score === summary.total
          ? "Flawless sprint — perfect-score bonus applied."
          : "Every rep sharpens your signal reading."}
      </p>

      <div className="mx-auto mt-6 max-w-sm space-y-2 rounded-xl border border-border bg-background/40 p-4 text-left text-sm">
        <Row label="Base XP" value={`+${summary.base}`} />
        {summary.perfect ? <Row label="Perfect bonus" value={`+${summary.perfect}`} /> : null}
        {summary.streakBonus ? (
          <Row
            label={`Streak multiplier (${summary.multiplier}×)`}
            value={`+${summary.streakBonus}`}
          />
        ) : null}
        <div className="flex justify-between border-t border-border pt-2 font-display">
          <span>Total earned</span>
          <span className="text-primary">+{summary.xpEarned} XP</span>
        </div>
      </div>

      <div className="mt-5 flex items-center justify-center gap-2 text-sm text-warning">
        <Flame className="size-4" /> {summary.dailyStreak}-day practice streak
      </div>
      {summary.leveledUp ? (
        <p className="mt-2 text-sm text-success">You reached level {summary.level}!</p>
      ) : null}

      <Button className="mt-6" onClick={onClose}>
        Back to hub
      </Button>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-body">
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}
