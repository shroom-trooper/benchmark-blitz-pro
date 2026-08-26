import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Flame, Target, Zap, CalendarClock, Sparkles } from "lucide-react";
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
    <div className="min-h-dvh bg-void">
      <header className="mx-auto flex max-w-7xl items-center justify-between px-6 py-8 sm:px-10">
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

      <main className="mx-auto max-w-7xl px-6 sm:px-10">
        <section className="py-28 sm:py-40 lg:py-48">
          <p className="text-sm font-medium tracking-wide text-primary">
            Continuous hiring capability training
          </p>
          <h1 className="mt-8 max-w-4xl text-4xl leading-[1.08] sm:text-6xl lg:text-7xl">
            Turn one-off interview training into a weekly habit.
          </h1>
          <p className="mt-8 max-w-2xl text-lg leading-relaxed text-dim">
            Three realistic hiring scenarios every week. Four minutes. Instant
            evidence-based feedback, XP, streaks and a public leaderboard. Training your
            managers? Create a group and watch their judgement improve week by week.
          </p>
          <div className="mt-12 flex flex-wrap gap-4">
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

        <section className="pb-32 sm:pb-44">
          <div className="max-w-2xl">
            <h2 className="text-3xl sm:text-4xl">There's a rep for every hiring moment.</h2>
            <p className="mt-4 text-lg leading-relaxed text-dim">
              A full year of structured practice, built to fit between meetings.
            </p>
          </div>

          <div className="mt-16 grid gap-6 sm:mt-20 sm:grid-cols-2 lg:grid-cols-3 lg:gap-8">

          <FeatureCard
            hotkey="⌘1"
            title="Structured."
            body="52 weeks, four themes — interview fundamentals, bias mitigation, candidate experience and strategic talent leadership."
            icon={
              <span className="grid size-10 place-items-center rounded-xl bg-primary/12 text-primary">
                <CalendarClock className="size-5 transition-transform duration-700 group-hover:animate-[tickspin_4s_linear_infinite]" />
              </span>
            }
          />
          <FeatureCard
            hotkey="⌘2"
            title="Realistic."
            body="Micro-simulations with real decision points and the reasoning behind the best answer, the moment you respond."
            icon={
              <span className="relative grid size-10 place-items-center rounded-xl bg-primary/12 text-primary">
                <span className="pointer-events-none absolute inset-2 rounded-full border border-primary/60 opacity-0 group-hover:animate-[radar_1.6s_ease-out_infinite] group-hover:opacity-100" />
                <span className="pointer-events-none absolute inset-2 rounded-full border border-primary/40 opacity-0 [animation-delay:0.5s] group-hover:animate-[radar_1.6s_ease-out_infinite] group-hover:opacity-100" />
                <Target className="size-5" />
              </span>
            }
          />
          <FeatureCard
            hotkey="⌘3"
            title="Habit-forming."
            body="Weekly streaks, XP bonuses and ten levels from Novice Interviewer to Master Bar Raiser."
            icon={
              <span className="grid size-10 place-items-center rounded-xl bg-warning/12 text-warning">
                <Flame className="size-5 origin-bottom group-hover:animate-[flicker_0.7s_ease-in-out_infinite] group-hover:drop-shadow-[0_0_10px_var(--warning)]" />
              </span>
            }
          />
          <FeatureCard
            hotkey="⌘4"
            title="Competitive."
            body="Every player ranked by XP. Share your rank, challenge peers, and see who really knows hiring."
            icon={
              <span className="flex size-10 items-end justify-center gap-[3px] rounded-xl bg-warning/12 pb-2.5">
                <i className="block w-[3px] origin-bottom rounded-sm bg-warning h-2 group-hover:animate-[barrise_0.8s_ease-out_infinite_alternate]" />
                <i className="block w-[3px] origin-bottom rounded-sm bg-warning h-3.5 [animation-delay:0.12s] group-hover:animate-[barrise_0.8s_ease-out_infinite_alternate]" />
                <i className="block w-[3px] origin-bottom rounded-sm bg-warning h-5 [animation-delay:0.24s] group-hover:animate-[barrise_0.8s_ease-out_infinite_alternate]" />
              </span>
            }
          />
          <FeatureCard
            hotkey="⌘5"
            title="Yours, with AI."
            body="Upload your TA principles, interview playbook or a PDF — AI drafts grounded scenario questions for your group. Or mix library themes to a target question count with a live duration estimate. Review, edit, publish."
            className="sm:col-span-2"
            icon={
              <span className="grid size-10 place-items-center rounded-xl bg-success/12 text-success">
                <Sparkles className="size-5 transition-transform duration-500 group-hover:scale-110 group-hover:animate-[zap_1.4s_ease-in-out_infinite]" />
              </span>
            }
          >
            <div className="mt-4 overflow-hidden rounded-xl border border-keycap-border bg-void/70 font-mono text-xs">
              <div className="flex items-center gap-2 border-b border-keycap-border px-3 py-2 text-dim">
                <Sparkles className="size-3.5 text-success" />
                <span>Generate assessment from…</span>
                <kbd className="ml-auto rounded-md px-1.5 py-0.5 text-[10px] text-dim keycap-badge">⏎</kbd>
              </div>
              <div className="space-y-1 px-3 py-2 text-dim">
                <div className="text-heading">ta-principles-2026.pdf</div>
                <div>Structured interviewing playbook</div>
                <div>Library mix · 12 questions · ~9 min</div>
              </div>
            </div>
          </FeatureCard>
          <FeatureCard
            hotkey="⌘6"
            title="Free."
            body="Solo training is free forever. Groups include 3 managers plus you."
            icon={
              <span className="grid size-10 place-items-center rounded-xl bg-success/12 text-success">
                <Zap className="size-5 group-hover:animate-[zap_1s_ease-in-out_infinite]" />
              </span>
            }
          />
          </div>
        </section>
      </main>

      <footer className="mx-auto max-w-7xl border-t border-border px-6 py-12 text-center text-xs text-muted-foreground sm:px-10">
        Benchmark — continuous hiring capability training.
      </footer>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  body,
  hotkey,
  className,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
  hotkey: string;
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <div
      className={`group relative rounded-2xl border border-keycap-border p-6 keycard transition-all duration-300 hover:-translate-y-0.5 hover:scale-[1.02] hover:border-primary/40 hover:shadow-[0_0_0_1px_color-mix(in_oklab,var(--primary)_25%,transparent),0_18px_40px_-18px_oklch(0_0_0/90%)] ${className ?? ""}`}
    >
      <kbd className="absolute right-4 top-4 rounded-md px-2 py-1 font-mono text-[11px] leading-none text-dim keycap-badge transition-colors group-hover:text-heading">
        {hotkey}
      </kbd>
      {icon}
      <h2 className="mt-4 text-lg">{title}</h2>
      <p className="mt-1.5 text-sm leading-relaxed text-dim">{body}</p>
      {children}
    </div>
  );
}

