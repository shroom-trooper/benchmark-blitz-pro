import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Flame, Trophy, Target, Zap, BarChart3, CalendarClock } from "lucide-react";
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

        <section className="grid gap-4 pb-16 sm:grid-cols-2 lg:grid-cols-3">
          <Feature
            icon={<CalendarClock className="size-5 text-primary" />}
            title="52-week curriculum"
            body="Four quarterly themes: interview fundamentals, bias mitigation, candidate experience and strategic talent leadership."
          />
          <Feature
            icon={<Target className="size-5 text-primary" />}
            title="Micro-simulations"
            body="Realistic decision points with the reasoning behind the best answer, delivered the moment you respond."
          />
          <Feature
            icon={<Flame className="size-5 text-warning" />}
            title="Streaks that stick"
            body="Weekly streaks, XP bonuses and ten levels from Novice Interviewer to Master Bar Raiser."
          />
          <Feature
            icon={<Trophy className="size-5 text-warning" />}
            title="Public leaderboard"
            body="Every player ranked by XP. Share your rank, challenge your peers, and see who really knows hiring."
          />
          <Feature
            icon={<BarChart3 className="size-5 text-success" />}
            title="Group analytics"
            body="Create a group, invite your managers, and see participation, decision accuracy and their weakest areas."
          />
          <Feature
            icon={<Zap className="size-5 text-success" />}
            title="Free to start"
            body="Solo training is free forever. Groups include 3 managers plus you — bigger teams are coming soon."
          />
        </section>
      </main>

      <footer className="border-t border-border py-8 text-center text-xs text-muted-foreground">
        Benchmark — continuous hiring capability training.
      </footer>
    </div>
  );
}

function Feature({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-surface p-6">
      {icon}
      <h2 className="mt-3 font-display text-lg">{title}</h2>
      <p className="mt-2 text-sm leading-relaxed text-body">{body}</p>
    </div>
  );
}
