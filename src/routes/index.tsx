import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Flame, Sparkles, Trophy, Zap } from "lucide-react";
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

        <section className="mb-16 grid grid-cols-1 border border-border sm:grid-cols-2 lg:grid-cols-3">
          <Cell tag="52 weeks" accent="primary" title="Structured curriculum" body="Four quarterly themes: interview fundamentals, bias mitigation, candidate experience and strategic talent leadership." className="lg:col-span-2">
            <div className="grid gap-2 sm:grid-cols-2">
              {[
                { q: "Q1", t: "Interview fundamentals", w: "1–13", pct: 100 },
                { q: "Q2", t: "Bias mitigation", w: "14–26", pct: 72 },
                { q: "Q3", t: "Candidate experience", w: "27–39", pct: 34 },
                { q: "Q4", t: "Talent leadership", w: "40–52", pct: 8 },
              ].map((row) => (
                <div key={row.q} className="border border-border p-3">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span className="font-medium text-foreground">{row.q} · {row.t}</span>
                    <span className="font-mono">wk {row.w}</span>
                  </div>
                  <div className="mt-2 h-1 overflow-hidden bg-surface-2">
                    <div className="h-full bg-primary" style={{ width: `${row.pct}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </Cell>

          <Cell tag="4 min" accent="primary" title="Micro-simulations" body="Realistic decision points with the reasoning behind the best answer, delivered the moment you respond.">
            <div className="space-y-2">
              <p className="font-mono text-xs text-muted-foreground">Q2 · STRUCTURED SCORING</p>
              <div className="border border-success/40 bg-success/10 px-3 py-2 text-sm text-foreground">
                <span className="mr-2 text-success">✓</span>Score against the rubric first
              </div>
              <div className="border border-border px-3 py-2 text-sm text-muted-foreground">
                Go with your gut read
              </div>
            </div>
          </Cell>

          <Cell tag="streaks" accent="warning" title="Habits that stick" body="Weekly streaks, XP bonuses and ten levels from Novice Interviewer to Master Bar Raiser.">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1 border border-warning/40 bg-warning/10 px-3 py-1 font-display text-lg text-warning">
                <Flame className="size-4" /> 12
              </div>
              <div className="flex gap-1">
                {[1, 1, 1, 1, 1, 0, 0].map((on, i) => (
                  <span
                    key={i}
                    className={`size-6 ${on ? "bg-warning/70" : "border border-border"}`}
                  />
                ))}
              </div>
            </div>
          </Cell>

          <Cell tag="public rank" accent="warning" title="Global leaderboard" body="Every player ranked by XP. Share your rank, challenge your peers, and see who really knows hiring." className="lg:col-span-2">
            <div className="grid gap-4 sm:grid-cols-[auto_minmax(0,1fr)] sm:items-end">
              <div className="flex items-end gap-2">
                {[
                  { n: "2", h: "h-12", c: "bg-surface-2" },
                  { n: "1", h: "h-16", c: "bg-warning/70" },
                  { n: "3", h: "h-9", c: "bg-surface-2" },
                ].map((p) => (
                  <div key={p.n} className="flex w-12 flex-col items-center gap-1">
                    <Trophy className={`size-4 ${p.n === "1" ? "text-warning" : "text-muted-foreground"}`} />
                    <div className={`w-full border border-border ${p.h} ${p.c}`} />
                    <span className="font-mono text-xs text-muted-foreground">{p.n}</span>
                  </div>
                ))}
              </div>
              <ul className="space-y-px text-sm">
                {[
                  ["Priya S.", "8,420"],
                  ["Marcus L.", "7,980"],
                  ["Ana R.", "7,310"],
                ].map(([name, xp], i) => (
                  <li
                    key={name}
                    className="flex items-center justify-between border-b border-border px-1 py-1.5"
                  >
                    <span className="text-foreground">
                      <span className="mr-2 font-mono text-muted-foreground">#{i + 1}</span>
                      {name}
                    </span>
                    <span className="font-mono text-muted-foreground">{xp} XP</span>
                  </li>
                ))}
              </ul>
            </div>
          </Cell>

          <Cell tag="analytics" accent="success" title="Group analytics" body="Create a group, invite your managers, and see participation, decision accuracy and their weakest areas.">
            <div className="flex h-20 items-end gap-2">
              {[45, 70, 55, 88, 62, 94].map((h, i) => (
                <div key={i} className="flex-1 bg-success/60" style={{ height: `${h}%` }} />
              ))}
            </div>
            <p className="mt-2 font-mono text-xs text-muted-foreground">AVG ACCURACY · LAST 6 WEEKS</p>
          </Cell>

          <Cell tag="free tier" accent="success" title="Free to start" body="Solo training is free forever. Groups include 3 managers plus you — bigger teams are coming soon.">
            <div className="flex items-center gap-2">
              {[0, 1, 2, 3].map((i) => (
                <span
                  key={i}
                  className={`grid size-8 place-items-center border text-xs ${
                    i === 3
                      ? "border-dashed border-border text-muted-foreground"
                      : "border-success/40 bg-success/15 text-success"
                  }`}
                >
                  {i === 3 ? "+" : "●"}
                </span>
              ))}
              <span className="ml-1 font-mono text-xs text-muted-foreground">3 SEATS + YOU</span>
            </div>
          </Cell>
        </section>
      </main>

      <footer className="border-t border-border py-8 text-center text-xs text-muted-foreground">
        Benchmark — continuous hiring capability training.
      </footer>
    </div>
  );
}

const accentText: Record<string, string> = {
  primary: "text-primary",
  warning: "text-warning",
  success: "text-success",
};

const accentGlow: Record<string, string> = {
  primary: "var(--primary)",
  warning: "var(--warning)",
  success: "var(--success)",
};

function Cell({
  title,
  body,
  tag,
  accent,
  className = "",
  children,
}: {
  title: string;
  body: string;
  tag: string;
  accent: "primary" | "warning" | "success";
  className?: string;
  children: React.ReactNode;
}) {
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);

  return (
    <div
      onMouseMove={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        setPos({ x: e.clientX - r.left, y: e.clientY - r.top });
      }}
      onMouseLeave={() => setPos(null)}
      className={`group relative isolate -mb-px -mr-px flex flex-col overflow-hidden rounded-none border-b border-r border-border p-8 ${className}`}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          background: pos
            ? `radial-gradient(320px circle at ${pos.x}px ${pos.y}px, color-mix(in oklab, ${accentGlow[accent]} 14%, transparent), transparent 70%)`
            : undefined,
        }}
      />
      <p className={`font-mono text-[11px] uppercase tracking-[0.18em] ${accentText[accent]}`}>
        [ {tag} ]
      </p>
      <h2 className="mt-3 text-lg">{title}</h2>
      <p className="mt-2 max-w-prose text-sm leading-relaxed text-body">{body}</p>
      <div className="mt-6">{children}</div>
    </div>
  );
}


