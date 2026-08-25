import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Flame, Trophy, Zap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Benchmark · Continuous hiring capability training" },
      {
        name: "description",
        content:
          "Benchmark turns hiring training into a weekly habit: three-question micro-simulations, XP, streaks and leaderboards, plus org-wide capability analytics for TA teams.",
      },
      { property: "og:title", content: "Benchmark · Continuous hiring capability training" },
      {
        property: "og:description",
        content:
          "Weekly hiring micro-simulations for managers, with gamified progress and TA analytics.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

function Landing() {
  const [signedIn, setSignedIn] = useState(false);
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSignedIn(!!data.session));
  }, []);

  return (
    <div className="min-h-dvh bg-background">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-4 py-6">
        <div className="flex items-center gap-2">
          <span className="grid size-8 place-items-center rounded-lg bg-primary text-primary-foreground">
            <Zap className="size-4" />
          </span>
          <span className="font-display text-lg">Benchmark</span>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild variant="ghost">
            <Link to="/leaderboard">Leaderboard</Link>
          </Button>
          <Button asChild variant="outline">
            <Link to={signedIn ? "/hub" : "/auth"}>{signedIn ? "Open hub" : "Sign in"}</Link>
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4">
        <section className="py-16 sm:py-24">
          <p className="font-medium text-primary">Continuous hiring capability training</p>
          <h1 className="mt-4 max-w-3xl text-4xl sm:text-6xl">
            Turn one-off interview training into a weekly habit.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-body">
            Three realistic hiring scenarios every week. Four minutes. Instant
            evidence-based feedback, XP, streaks and a public leaderboard. Training your
            managers? Create a group and watch their judgement improve week by week.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link to={signedIn ? "/hub" : "/auth"}>
                {signedIn ? "Go to your hub" : "Take this week's test"}
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/leaderboard">See the leaderboard</Link>
            </Button>
          </div>
        </section>

        <section className="grid auto-rows-[minmax(0,auto)] gap-4 pb-16 sm:grid-cols-2 lg:grid-cols-3">
          <Card className="lg:col-span-2" accent="primary" title="52-week curriculum" body="Four quarterly themes: interview fundamentals, bias mitigation, candidate experience and strategic talent leadership.">
            <div className="grid gap-2 sm:grid-cols-2">
              {[
                { q: "Q1", t: "Interview fundamentals", w: "1–13", pct: 100 },
                { q: "Q2", t: "Bias mitigation", w: "14–26", pct: 72 },
                { q: "Q3", t: "Candidate experience", w: "27–39", pct: 34 },
                { q: "Q4", t: "Talent leadership", w: "40–52", pct: 8 },
              ].map((row) => (
                <div key={row.q} className="rounded-lg border border-border bg-surface-2/60 p-3">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span className="font-medium text-foreground">{row.q} · {row.t}</span>
                    <span>wk {row.w}</span>
                  </div>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface">
                    <div className="h-full rounded-full bg-primary" style={{ width: `${row.pct}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card accent="primary" title="Micro-simulations" body="Realistic decision points with the reasoning behind the best answer, delivered the moment you respond.">
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">Q2 · Structured scoring</p>
              <div className="rounded-lg border border-success/40 bg-success/10 px-3 py-2 text-sm text-foreground">
                <span className="mr-2 text-success">✓</span>Score against the rubric first
              </div>
              <div className="rounded-lg border border-border bg-surface-2/60 px-3 py-2 text-sm text-muted-foreground">
                Go with your gut read
              </div>
            </div>
          </Card>

          <Card accent="warning" title="Streaks that stick" body="Weekly streaks, XP bonuses and ten levels from Novice Interviewer to Master Bar Raiser.">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1 rounded-full bg-warning/15 px-3 py-1 font-display text-lg text-warning">
                <Flame className="size-4" /> 12
              </div>
              <div className="flex gap-1">
                {[1, 1, 1, 1, 1, 0, 0].map((on, i) => (
                  <span
                    key={i}
                    className={`size-6 rounded-md ${on ? "bg-warning/70" : "bg-surface-2 border border-border"}`}
                  />
                ))}
              </div>
            </div>
          </Card>

          <Card className="lg:col-span-2" accent="warning" title="Public leaderboard" body="Every player ranked by XP. Share your rank, challenge your peers, and see who really knows hiring.">
            <div className="grid gap-4 sm:grid-cols-[auto_minmax(0,1fr)] sm:items-end">
              <div className="flex items-end gap-2">
                {[
                  { n: "2", h: "h-12", c: "bg-surface-2" },
                  { n: "1", h: "h-16", c: "bg-warning/70" },
                  { n: "3", h: "h-9", c: "bg-surface-2" },
                ].map((p) => (
                  <div key={p.n} className="flex w-12 flex-col items-center gap-1">
                    <Trophy className={`size-4 ${p.n === "1" ? "text-warning" : "text-muted-foreground"}`} />
                    <div className={`w-full rounded-t-md border border-border ${p.h} ${p.c}`} />
                    <span className="text-xs text-muted-foreground">{p.n}</span>
                  </div>
                ))}
              </div>
              <ul className="space-y-1.5 text-sm">
                {[
                  ["Priya S.", "8,420"],
                  ["Marcus L.", "7,980"],
                  ["Ana R.", "7,310"],
                ].map(([name, xp], i) => (
                  <li
                    key={name}
                    className="flex items-center justify-between rounded-lg border border-border bg-surface-2/60 px-3 py-1.5"
                  >
                    <span className="text-foreground">
                      <span className="mr-2 text-muted-foreground">#{i + 1}</span>
                      {name}
                    </span>
                    <span className="text-muted-foreground">{xp} XP</span>
                  </li>
                ))}
              </ul>
            </div>
          </Card>

          <Card accent="success" title="Group analytics" body="Create a group, invite your managers, and see participation, decision accuracy and their weakest areas.">
            <div className="flex h-20 items-end gap-2">
              {[45, 70, 55, 88, 62, 94].map((h, i) => (
                <div key={i} className="flex-1 rounded-t-sm bg-success/60" style={{ height: `${h}%` }} />
              ))}
            </div>
            <p className="mt-2 text-xs text-muted-foreground">Avg accuracy · last 6 weeks</p>
          </Card>

          <Card accent="success" title="Free to start" body="Solo training is free forever. Groups include 3 managers plus you — bigger teams are coming soon.">
            <div className="flex items-center gap-2">
              {[0, 1, 2, 3].map((i) => (
                <span
                  key={i}
                  className={`grid size-8 place-items-center rounded-full border text-xs ${
                    i === 3
                      ? "border-dashed border-border text-muted-foreground"
                      : "border-success/40 bg-success/15 text-success"
                  }`}
                >
                  {i === 3 ? "+" : "●"}
                </span>
              ))}
              <span className="ml-1 text-xs text-muted-foreground">3 seats + you</span>
            </div>
          </Card>
        </section>
      </main>

      <footer className="border-t border-border py-8 text-center text-xs text-muted-foreground">
        Benchmark — continuous hiring capability training.
      </footer>
    </div>
  );
}

const accentTop: Record<string, string> = {
  primary: "before:bg-gradient-to-r before:from-transparent before:via-primary/40 before:to-transparent",
  warning: "before:bg-gradient-to-r before:from-transparent before:via-warning/40 before:to-transparent",
  success: "before:bg-gradient-to-r before:from-transparent before:via-success/40 before:to-transparent",
};

function Card({
  title,
  body,
  accent,
  className = "",
  children,
}: {
  title: string;
  body: string;
  accent: "primary" | "warning" | "success";
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`relative flex flex-col overflow-hidden rounded-xl border border-border bg-surface p-6 before:absolute before:inset-x-0 before:top-0 before:h-px before:content-[''] ${accentTop[accent]} ${className}`}
    >
      <h2 className="font-display text-lg">{title}</h2>
      <p className="mt-2 text-sm leading-relaxed text-body">{body}</p>
      <div className="mt-5">{children}</div>
    </div>
  );
}

