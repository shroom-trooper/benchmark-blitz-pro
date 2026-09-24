import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Zap, CalendarSearch, ClipboardCheck, Target, LineChart, ShieldCheck, Compass } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { RouteError, RouteNotFound } from "@/components/RouteError";

const TITLE = "Benchmark · Interview readiness and interviewer coaching";
const DESC =
  "Benchmark detects upcoming interviews, delivers focused preparation before each one, builds capability evidence, and gives TA teams privacy-safe readiness visibility.";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESC },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
  errorComponent: RouteError,
  notFoundComponent: RouteNotFound,
});

const STEPS = [
  { icon: CalendarSearch, title: "Detect or add an interview", body: "Connect Google Calendar or add interviews manually. Benchmark finds likely interviews and asks you to confirm." },
  { icon: ClipboardCheck, title: "Confirm the context", body: "Role, stage, your responsibility and the rubric. Candidate context stays protected and expires by policy." },
  { icon: Target, title: "Focused preparation", body: "A short preparation before the interview, built from reviewed questions and validated session-specific scenarios." },
  { icon: LineChart, title: "Capability evidence", body: "Every answer adds evidence across four interviewer capabilities, with confidence shown honestly." },
  { icon: Compass, title: "Next coaching focus", body: "See which area to strengthen next, based on evidence rather than activity volume." },
  { icon: ShieldCheck, title: "Privacy-safe TA visibility", body: "TA teams see preparation coverage and team capability with sample sizes, never public rankings or candidate scores." },
];

function Landing() {
  const [signedIn, setSignedIn] = useState(false);
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSignedIn(!!data.session));
  }, []);
  const cta = signedIn ? "/home" : "/auth";

  return (
    <div className="min-h-dvh overflow-x-clip bg-void">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-4 py-6">
        <div className="flex items-center gap-2">
          <span className="grid size-8 place-items-center rounded-lg bg-primary text-primary-foreground">
            <Zap className="size-4" />
          </span>
          <span className="font-display text-lg">Benchmark</span>
        </div>
        <Button asChild variant="outline">
          <Link to={cta}>{signedIn ? "Open Benchmark" : "Sign in"}</Link>
        </Button>
      </header>

      <main className="mx-auto max-w-6xl px-4">
        <section className="py-16 sm:py-24">
          <p className="font-medium text-primary">Interview readiness for hiring teams</p>
          <h1 className="mt-4 max-w-3xl text-4xl sm:text-6xl">Walk into every interview prepared.</h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-body">
            Benchmark notices your upcoming interviews, prepares you for the specific role and stage, and shows your TA
            team where coaching will help, without ranking people or scoring candidates.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link to={cta}>{signedIn ? "Go to your next interview" : "Get started"}</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/guides/how-to-train-hiring-managers">Read the guide</Link>
            </Button>
          </div>
        </section>

        <section className="pb-24">
          <h2 className="text-2xl">How it works</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {STEPS.map((s, i) => (
              <div key={s.title} className="rounded-xl border border-border bg-surface p-5">
                <div className="flex items-center gap-3">
                  <span className="grid size-8 place-items-center rounded-lg bg-primary/15 text-primary">
                    <s.icon className="size-4" />
                  </span>
                  <span className="text-xs text-muted-foreground">Step {i + 1}</span>
                </div>
                <p className="mt-3 font-display">{s.title}</p>
                <p className="mt-1 text-sm leading-relaxed text-body">{s.body}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t border-border py-8 text-center text-xs text-muted-foreground">
        <p>Benchmark: interview readiness and interviewer coaching.</p>
        <p className="mt-2">
          Questions?{" "}
          <a href="mailto:hey@usebenchmark.app" className="underline hover:text-foreground">
            hey@usebenchmark.app
          </a>
        </p>
      </footer>
    </div>
  );
}
