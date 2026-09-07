import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  LineChart,
  Repeat2,
  Target,
  Users,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { RouteError, RouteNotFound } from "@/components/RouteError";

const SITE = "https://usebenchmark.app";

export const Route = createFileRoute("/guides/how-to-train-hiring-managers")({
  head: () => ({
    meta: [
      { title: "How to Train Hiring Managers: A Practical Guide · Benchmark" },
      {
        name: "description",
        content:
          "Why one-off interview training fades within weeks — and how continuous, simulation-based practice builds lasting hiring judgement in your managers.",
      },
      { property: "og:title", content: "How to Train Hiring Managers: A Practical Guide" },
      {
        property: "og:description",
        content:
          "A practical playbook for Talent Acquisition teams: replace one-off interview workshops with weekly micro-simulations that actually change hiring decisions.",
      },
      { property: "og:type", content: "article" },
      { property: "og:url", content: `${SITE}/guides/how-to-train-hiring-managers` },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "How to Train Hiring Managers: A Practical Guide" },
      {
        name: "twitter:description",
        content:
          "Why one-off interview training fades — and how continuous micro-simulations build lasting hiring judgement.",
      },
    ],
    links: [{ rel: "canonical", href: `${SITE}/guides/how-to-train-hiring-managers` }],
  }),
  component: GuidePage,
  errorComponent: RouteError,
  notFoundComponent: RouteNotFound,
});

const ONE_OFF_PROBLEMS = [
  {
    title: "The forgetting curve wins",
    body: "Managers leave a workshop energised, then don't interview for three weeks. Without spaced practice, most of what they learned is gone before their next debrief.",
  },
  {
    title: "No feedback loop on real decisions",
    body: "A slide deck can't tell a manager that their 'culture fit' question was low-signal. Skills only improve when choices get immediate, evidence-based feedback.",
  },
  {
    title: "Zero visibility for TA",
    body: "After the session ends, Talent Acquisition has no idea who is applying the training, who is drifting back to gut feel, or which capability areas are weakest across the org.",
  },
  {
    title: "One size fits no one",
    body: "A first-time interviewer and a fifteen-year hiring veteran sit through the same content. Neither gets practice at the edge of their own judgement.",
  },
];

const CONTINUOUS_PRINCIPLES = [
  {
    icon: Repeat2,
    title: "Make it weekly, make it tiny",
    body: "Three realistic scenarios a week beats a three-hour workshop a year. Four minutes of focused decision-making keeps interview craft warm without competing with the day job.",
  },
  {
    icon: Target,
    title: "Train decisions, not theory",
    body: "Put managers inside ambiguous candidate answers and make them choose what to probe next. High-signal probing and evaluation choices are a muscle — they grow with reps.",
  },
  {
    icon: CalendarClock,
    title: "Anchor it to a habit",
    body: "Streaks, XP and levels turn training from a calendar invite people decline into a routine they protect. Consistency is what compounds into better hiring calls.",
  },
  {
    icon: LineChart,
    title: "Measure capability, not attendance",
    body: "Track decision accuracy over time, by topic — structured interviewing, bias awareness, candidate evaluation. That's the signal TA needs to coach the right people on the right gaps.",
  },
];

const STEPS = [
  {
    step: "01",
    title: "Baseline your managers",
    body: "Before training anyone, measure current judgement. A short diagnostic simulation shows you who struggles with structure, who over-indexes on rapport, and where the whole org is weakest.",
  },
  {
    step: "02",
    title: "Set the weekly cadence",
    body: "Release one short module per week. Predictable rhythm matters more than volume — managers should know that every Monday brings a fresh set of scenarios.",
  },
  {
    step: "03",
    title: "Give instant, specific feedback",
    body: "Every answer should come back immediately with the 'why': why that probing question surfaces signal, why that evaluation shortcut is risky. Feedback is the training.",
  },
  {
    step: "04",
    title: "Review capability analytics monthly",
    body: "Sit down with the accuracy data: who's improving, who's gone quiet, which topics the org keeps getting wrong. Use it to target coaching instead of re-running generic workshops.",
  },
  {
    step: "05",
    title: "Adapt with custom scenarios",
    body: "Generic interview questions only go so far. Turn your own interview guides, scorecards and policy documents into custom assessments so practice matches how your company actually hires.",
  },
];

function GuidePage() {
  return (
    <div className="min-h-dvh overflow-x-clip bg-void">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-4 py-6">
        <Link to="/" className="flex items-center gap-2">
          <span className="grid size-8 place-items-center rounded-lg bg-primary text-primary-foreground">
            <Zap className="size-4" />
          </span>
          <span className="font-display text-lg">Benchmark</span>
        </Link>
        <div className="flex items-center gap-2">
          <Button asChild variant="ghost">
            <Link to="/leaderboard">Leaderboard</Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/auth">Start free</Link>
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 pb-24">
        <article>
          <p className="font-medium text-primary">Guide · Talent Acquisition</p>
          <h1 className="mt-4 text-4xl sm:text-5xl">
            How to train hiring managers (so the training actually sticks)
          </h1>
          <p className="mt-6 text-lg leading-relaxed text-body">
            Most interview training fails for a simple reason: it's an event, not a
            practice. This guide covers why one-off workshops fade, what continuous
            simulation-based training looks like, and a five-step playbook Talent
            Acquisition teams can run to build real hiring judgement across their
            manager population.
          </p>

          <section className="mt-14">
            <h2 className="text-2xl sm:text-3xl">Why one-off interview training doesn't work</h2>
            <p className="mt-4 leading-relaxed text-body">
              The annual interview workshop is the default answer to inconsistent
              hiring — and it reliably disappoints. Four problems show up every time:
            </p>
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {ONE_OFF_PROBLEMS.map((p) => (
                <div
                  key={p.title}
                  className="rounded-2xl border border-border bg-surface/60 p-5 backdrop-blur"
                >
                  <h3 className="font-display text-base">{p.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-body">{p.body}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="mt-16">
            <h2 className="text-2xl sm:text-3xl">The shift: from events to continuous practice</h2>
            <p className="mt-4 leading-relaxed text-body">
              Hiring judgement is a skill, and skills respond to the same rules as
              any other: short, frequent reps with immediate feedback beat long,
              rare lectures. Four principles define a continuous approach:
            </p>
            <div className="mt-8 space-y-4">
              {CONTINUOUS_PRINCIPLES.map((p) => (
                <div
                  key={p.title}
                  className="flex gap-4 rounded-2xl border border-border bg-surface/60 p-5 backdrop-blur"
                >
                  <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/15 text-primary">
                    <p.icon className="size-5" />
                  </span>
                  <div>
                    <h3 className="font-display text-base">{p.title}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-body">{p.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="mt-16">
            <h2 className="text-2xl sm:text-3xl">A five-step playbook for TA teams</h2>
            <div className="mt-8 space-y-6">
              {STEPS.map((s) => (
                <div key={s.step} className="flex gap-5">
                  <span className="font-display text-2xl text-primary/70">{s.step}</span>
                  <div>
                    <h3 className="font-display text-lg">{s.title}</h3>
                    <p className="mt-1 leading-relaxed text-body">{s.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="mt-16 rounded-2xl border border-border bg-surface/60 p-6 backdrop-blur">
            <h2 className="text-2xl">What good looks like after 12 weeks</h2>
            <ul className="mt-5 space-y-3">
              {[
                "Managers complete a short simulation weekly without being chased — the habit carries itself.",
                "Decision accuracy climbs steadily on your weakest topics, not just the ones people already do well.",
                "Debriefs get sharper: managers arrive with evidence from structured probing instead of impressions.",
                "TA can point to per-topic capability analytics instead of workshop attendance sheets.",
              ].map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm leading-relaxed text-body">
                  <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" />
                  {item}
                </li>
              ))}
            </ul>
          </section>

          <section className="mt-16 rounded-2xl border border-primary/40 bg-primary/10 p-8 text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 text-xs text-muted-foreground">
              <Users className="size-3" /> Built for TA teams and hiring managers
            </span>
            <h2 className="mt-4 text-3xl">Benchmark runs this playbook for you</h2>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-body">
              Benchmark turns hiring training into a weekly habit: three-question
              micro-simulations, instant evidence-based feedback, XP and streaks for
              managers, and capability analytics for Talent Acquisition. Create a
              group, invite your managers, and watch their judgement improve week
              by week.
            </p>
            <Button asChild size="lg" className="mt-6">
              <Link to="/auth">
                Start training your managers <ArrowRight className="size-4" />
              </Link>
            </Button>
            <p className="mt-3 text-xs text-muted-foreground">
              Free for solo players · groups up to 3 seats included
            </p>
          </section>
        </article>
      </main>

      <footer className="border-t border-border py-8 text-center text-xs text-muted-foreground">
        Benchmark — continuous hiring capability training.
      </footer>
    </div>
  );
}
