import { Link, createFileRoute } from "@tanstack/react-router";
import { AlertTriangle, ArrowRight } from "lucide-react";
import { AREA_LABELS, subSkillLabel } from "@/lib/readiness/taxonomy";
import { Card, DirectionTag, Empty, RatioStat, SectionTitle, Stat, fmtDate, useDashboard } from "@/components/readiness/ui";
import { track } from "@/lib/analytics";
import { RouteError, RouteNotFound } from "@/components/RouteError";

export const Route = createFileRoute("/_authenticated/readiness/")({
  component: Overview,
  errorComponent: RouteError,
  notFoundComponent: RouteNotFound,
});

function Overview() {
  const { data } = useDashboard();
  if (!data || data.empty) return null;
  const m = data.metrics;
  return (
    <div className="space-y-8">
      <section>
        <SectionTitle>Attention needed</SectionTitle>
        {data.attention.length ? (
          <div className="grid gap-3 lg:grid-cols-2">
            {data.attention.map((a) => (
              <Card key={a.kind}>
                <div className="flex gap-3">
                  <AlertTriangle className="mt-0.5 size-4 shrink-0 text-warning" aria-hidden />
                  <div className="space-y-1">
                    <p className="text-sm font-medium">{a.what}</p>
                    <p className="text-xs text-muted-foreground">{a.why}</p>
                    {a.who.length ? <p className="text-xs">Affected: {a.who.join(", ")}</p> : null}
                    <p className="flex items-center gap-1 text-xs text-primary">
                      <ArrowRight className="size-3" aria-hidden /> {a.action}
                    </p>
                    {a.who.length ? (
                      <Link
                        to="/readiness/people"
                        search={(s) => s}
                        onClick={() => track("attention_item_opened", { kind: a.kind })}
                        className="text-xs underline text-muted-foreground"
                      >
                        View people
                      </Link>
                    ) : null}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Empty>Nothing needs attention right now.</Empty>
        )}
      </section>

      <section>
        <SectionTitle help="Eligible interview: confirmed, not cancelled, assigned to a current member, created at least 2 hours before it starts, and inside the selected period.">
          Readiness metrics
        </SectionTitle>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Stat label="Upcoming eligible interviews" value={m.upcoming} sub={`${m.eligible} eligible in period`} />
          <RatioStat label="Preparation coverage" r={m.coverage} help="Eligible interviews with a completed preparation ÷ eligible interviews." />
          <RatioStat label="Completed before interview" r={m.onTime} help="Eligible interviews with preparation completed before the start time ÷ eligible interviews." />
          <Stat label="Median preparation time" value={m.medianPrepMinutes === null ? "—" : `${m.medianPrepMinutes} min`} sub="Started → completed" />
          <Stat label="Active interviewers" value={`${m.activeInterviewers} of ${m.members}`} sub="Prepared in the last 30 days" />
          <RatioStat label="Current capability evidence" r={m.currentEvidence} help="Members with evidence recorded in the last 90 days ÷ members." />
          <RatioStat label="Four-area coverage" r={m.fourArea} help="Members with at least 8 answers in every capability area ÷ members." />
          <Stat label="Need confirmation" value={m.needsConfirmation} sub="Detected upcoming interviews" />
        </div>
      </section>

      <section>
        <SectionTitle help={data.teamMethod}>Team capability snapshot</SectionTitle>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {data.team.map((t) => (
            <Link key={t.area} to="/readiness/capability/$area" params={{ area: t.area }} className="block">
              <Card className="h-full hover:border-primary/50">
                <p className="text-sm font-medium">{AREA_LABELS[t.area]}</p>
                <p className="mt-2 font-display text-2xl">{t.suppressed ? "Not enough data" : `${t.score}%`}</p>
                <p className="text-xs text-muted-foreground">
                  {t.contributors} contributing · {t.excludedBuilding} building profile · {t.evidence} answers
                </p>
                <p className="text-xs text-muted-foreground">
                  Confidence: {t.confidence.high} high · {t.confidence.medium} medium · {t.confidence.low} low
                </p>
                <div className="mt-1">
                  <DirectionTag d={t.direction} />
                </div>
                {t.topMissed.length ? (
                  <p className="mt-2 text-xs text-muted-foreground">
                    Most missed: {t.topMissed.map((x) => subSkillLabel(x.subSkill)).join(", ")}
                  </p>
                ) : null}
              </Card>
            </Link>
          ))}
        </div>
        <p className="mt-2 text-xs text-muted-foreground">{data.teamMethod}</p>
      </section>

      <section>
        <SectionTitle>Recent activity</SectionTitle>
        {data.activity.length ? (
          <ul className="divide-y divide-border rounded-xl border border-border bg-surface">
            {data.activity.map((a, i) => (
              <li key={i} className="flex justify-between gap-3 p-3 text-sm">
                <span>{a.text}</span>
                <span className="shrink-0 text-xs text-muted-foreground">{fmtDate(a.at)}</span>
              </li>
            ))}
          </ul>
        ) : (
          <Empty>No preparation activity in this period yet.</Empty>
        )}
      </section>
    </div>
  );
}
