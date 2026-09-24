import { Link, createFileRoute, notFound } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect } from "react";
import { ArrowLeft } from "lucide-react";
import { AREA_LABELS, CAPABILITY_AREAS, subSkillLabel, type CapabilityArea } from "@/lib/readiness/taxonomy";
import { getCapabilityDetail } from "@/lib/readiness-dashboard.functions";
import { Card, DirectionTag, Empty, SectionTitle, Stat } from "@/components/readiness/ui";
import { Skeleton } from "@/components/ui/skeleton";
import { track } from "@/lib/analytics";
import { RouteError, RouteNotFound } from "@/components/RouteError";

export const Route = createFileRoute("/_authenticated/readiness/capability/$area")({
  beforeLoad: ({ params }) => {
    if (!(CAPABILITY_AREAS as readonly string[]).includes(params.area)) throw notFound();
  },
  component: Detail,
  errorComponent: RouteError,
  notFoundComponent: RouteNotFound,
});

function Detail() {
  const { area } = Route.useParams() as { area: CapabilityArea };
  const fn = useServerFn(getCapabilityDetail);
  const q = useQuery({ queryKey: ["capability-detail", area], queryFn: () => fn({ data: { area } }), staleTime: 60_000 });
  useEffect(() => {
    track("capability_detail_opened", { area });
  }, [area]);
  const d = q.data;
  return (
    <div className="space-y-6">
      <Link to="/readiness/capability" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> Heatmap
      </Link>
      <h2 className="text-2xl">{AREA_LABELS[area]}</h2>
      {q.isLoading ? <Skeleton className="h-64 w-full rounded-xl" /> : null}
      {q.isError ? <Empty>Could not load this capability.</Empty> : null}
      {d && d.suppressed ? (
        <Empty>
          Not enough data — team-level detail appears once at least 3 interviewers have Medium confidence in this area ({d.contributors} so far).
        </Empty>
      ) : null}
      {d && !d.suppressed ? (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Stat label="Team score" value={`${d.team.score}%`} sub={<DirectionTag d={d.team.direction} />} />
            <Stat label="Total answers" value={d.team.evidence} />
            <Stat label="Contributing interviewers" value={d.team.contributors} sub={`${d.team.excludedBuilding} building profile (excluded)`} />
            <Stat
              label="Evidence confidence"
              value={`${d.team.confidence.high} / ${d.team.confidence.medium} / ${d.team.confidence.low}`}
              sub="high / medium / low"
            />
          </div>
          {d.focus ? (
            <Card>
              <p className="text-sm font-medium">Recommended coaching focus</p>
              <p className="text-sm text-muted-foreground">{d.focus}</p>
            </Card>
          ) : null}
          <section>
            <SectionTitle>Sub-skill performance</SectionTitle>
            <div className="overflow-x-auto rounded-xl border border-border">
              <table className="w-full text-sm">
                <thead className="bg-surface-2 text-left text-xs text-muted-foreground">
                  <tr>
                    <th className="p-3">Sub-skill</th>
                    <th className="p-3">Accuracy</th>
                    <th className="p-3">Misses</th>
                    <th className="p-3">Change (last 60 vs prior 60 days)</th>
                  </tr>
                </thead>
                <tbody>
                  {d.subSkills.map((s) => (
                    <tr key={s.subSkill} className="border-t border-border">
                      <td className="p-3">{subSkillLabel(s.subSkill)}</td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-24 rounded bg-surface-2" aria-hidden>
                            <div className="h-1.5 rounded bg-primary" style={{ width: `${s.accuracy}%` }} />
                          </div>
                          {s.accuracy}% <span className="text-xs text-muted-foreground">of {s.total}</span>
                        </div>
                      </td>
                      <td className="p-3">{s.misses}</td>
                      <td className="p-3 text-xs">{s.change === null ? "Not enough comparable evidence" : `${s.change > 0 ? "+" : ""}${s.change} pts`}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {d.mostImproved.length ? (
              <p className="mt-2 text-xs text-muted-foreground">Most improved: {d.mostImproved.map((s) => subSkillLabel(s.subSkill)).join(", ")}</p>
            ) : null}
          </section>
          <section className="grid gap-6 lg:grid-cols-2">
            <div>
              <SectionTitle>Interview stages</SectionTitle>
              <ul className="divide-y divide-border rounded-xl border border-border bg-surface text-sm">
                {d.stages.map((s) => (
                  <li key={s.stage} className="flex justify-between p-3">
                    <span>{s.stage}</span>
                    <span className="text-muted-foreground">{s.total} answers · {s.missRate}% missed</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <SectionTitle>Score over time</SectionTitle>
              <ul className="divide-y divide-border rounded-xl border border-border bg-surface text-sm">
                {d.trend.map((t) => (
                  <li key={t.month} className="flex justify-between p-3">
                    <span>{t.month}</span>
                    <span className="text-muted-foreground">{t.accuracy === null ? `Not enough data (${t.answers})` : `${t.accuracy}% · ${t.answers} answers`}</span>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        </>
      ) : null}
    </div>
  );
}
