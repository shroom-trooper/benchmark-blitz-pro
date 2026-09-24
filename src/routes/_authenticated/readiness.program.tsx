import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import { Card, RatioStat, SectionTitle, Stat, useDashboard } from "@/components/readiness/ui";
import { track } from "@/lib/analytics";
import { RouteError, RouteNotFound } from "@/components/RouteError";

export const Route = createFileRoute("/_authenticated/readiness/program")({
  component: Program,
  errorComponent: RouteError,
  notFoundComponent: RouteNotFound,
});

const STAGE_HELP: Record<string, string> = {
  eligible: "Confirmed, not cancelled, current member, created ≥2h before start, inside the period.",
  generated: "A preparation session exists for the interview.",
  delivered: "The preparation email was delivered, it was generated in the app, or the interviewer opened it.",
  started: "The interviewer answered at least one question.",
  completed: "Preparation finished before the interview started.",
};

function Program() {
  const { data } = useDashboard();
  useEffect(() => {
    track("program_health_opened");
  }, []);
  if (!data || data.empty) return null;
  const p = data.program;
  const top = Math.max(1, p.funnel[0]!.count);
  return (
    <div className="space-y-8">
      <section>
        <SectionTitle>Preparation funnel</SectionTitle>
        <Card>
          <ol className="space-y-3">
            {p.funnel.map((f, i) => {
              const prev = i === 0 ? null : p.funnel[i - 1]!.count;
              return (
                <li key={f.key}>
                  <div className="flex justify-between text-sm">
                    <span title={STAGE_HELP[f.key]}>{f.label}</span>
                    <span>
                      {f.count}
                      {prev !== null ? <span className="text-xs text-muted-foreground"> · {prev ? Math.round((f.count / prev) * 100) : 0}% of previous</span> : null}
                    </span>
                  </div>
                  <div className="mt-1 h-2 rounded bg-surface-2" aria-hidden>
                    <div className="h-2 rounded bg-primary" style={{ width: `${(f.count / top) * 100}%` }} />
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">{STAGE_HELP[f.key]}</p>
                </li>
              );
            })}
          </ol>
        </Card>
      </section>
      <section>
        <SectionTitle>Program metrics</SectionTitle>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Stat label="Detected interviews" value={p.detected} sub="From Google Calendar in period" />
          <Stat label="Confirmed interviews" value={p.confirmed} />
          <Stat label="Eligible interviews" value={p.eligible} />
          <Stat label="Median preparation time" value={p.medianPrepMinutes === null ? "—" : `${p.medianPrepMinutes} min`} />
          <RatioStat label="Start rate" r={p.startRate} help="Delivered preparations that were started ÷ delivered preparations." />
          <RatioStat label="Completion rate" r={p.completionRate} help="Started preparations that were completed ÷ started." />
          <RatioStat label="Repeat preparation" r={p.repeatRate} help="Interviewers who prepared for more than one eligible interview ÷ interviewers with at least two eligible interviews." />
          <RatioStat label="Four-area coverage" r={p.fourArea} />
          <RatioStat label="Current evidence" r={p.currentEvidence} help="Members with evidence in the last 90 days." />
          <RatioStat label="Still building profiles" r={p.building} />
          <RatioStat label="Calendar connections healthy" r={p.integration} />
          <RatioStat label="Interviews with sufficient context" r={p.context} />
          <RatioStat label="Attachment processing success" r={p.attachments} help={`${p.attachmentFailures} failed`} />
        </div>
      </section>
    </div>
  );
}
