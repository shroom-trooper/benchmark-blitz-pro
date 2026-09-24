import { Award, Lightbulb } from "lucide-react";
import { AREA_LABELS, subSkillLabel } from "@/lib/readiness/taxonomy";
import { SCORE_EXPLANATION, type AreaProgress } from "@/lib/readiness/scoring";
import {
  DEVELOPMENT_STATUS_LABELS,
  INTERVIEW_STATUS_LABELS,
  type DevelopmentArea,
  type InterviewStatus,
  type Ratio,
  type Recommendation,
} from "@/lib/readiness/metrics";
import { Card, CapabilityCell, Empty, RatioStat, SectionTitle, Stat, fmtDate } from "./ui";

export type ProfileData = {
  name: string;
  summary: {
    nextInterview: { startsAt: string; stage: string; role: string } | null;
    nextPrepStatus: string | null;
    lastPrepAt: string | null;
    completedPreps: number;
    eligible: number;
    coverage: Ratio;
    onTime: Ratio;
    level: { level: number; title: string; next: { title: string } | null };
    lastEvidenceAt: string | null;
    currentEvidence: boolean;
  };
  progress: AreaProgress[];
  development: DevelopmentArea[];
  recentThemes: { subSkill: string; misses: number }[];
  recommendation: Recommendation;
  history: {
    id: string;
    startsAt: string;
    role: string;
    stage: string;
    status: InterviewStatus;
    completedAt: string | null;
    onTime: boolean;
    areas: string[];
    result: string | null;
    contextSources: string[];
  }[];
  recognition: { code: string; name: string; earnedAt: string }[];
};

const PREP_LABEL: Record<string, string> = {
  not_generated: "Not generated yet",
  generated: "Available, not started",
  started: "In progress",
  completed: "Completed",
  expired: "Expired",
};

export function ProfileView({ d, self = false }: { d: ProfileData; self?: boolean }) {
  const s = d.summary;
  return (
    <div className="space-y-8">
      <section>
        <SectionTitle>Readiness summary</SectionTitle>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Stat
            label="Next interview"
            value={s.nextInterview ? fmtDate(s.nextInterview.startsAt, true) : "None scheduled"}
            sub={s.nextInterview ? `${s.nextInterview.stage} · ${PREP_LABEL[s.nextPrepStatus ?? "not_generated"]}` : undefined}
          />
          <Stat label="Last preparation" value={fmtDate(s.lastPrepAt)} sub={`${s.completedPreps} completed in total`} />
          <RatioStat label="Preparation coverage" r={s.coverage} help="Eligible interviews with a completed preparation ÷ eligible interviews (last 180 days)." />
          <RatioStat label="Completed before start" r={s.onTime} help="Eligible interviews prepared before the interview started ÷ eligible interviews." />
          <Stat label="Professional level" value={`Level ${s.level.level}`} sub={s.level.title} />
          <Stat
            label="Evidence freshness"
            value={s.currentEvidence ? "Current" : s.lastEvidenceAt ? "Stale" : "No evidence"}
            sub={s.lastEvidenceAt ? `Last answer ${fmtDate(s.lastEvidenceAt)}` : undefined}
          />
        </div>
      </section>

      <section>
        <SectionTitle help={SCORE_EXPLANATION}>Four-area capability profile</SectionTitle>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {d.progress.map((p) => (
            <Card key={p.capability_area}>
              <p className="mb-2 text-sm font-medium">{AREA_LABELS[p.capability_area]}</p>
              <CapabilityCell p={p} />
              <dl className="mt-3 grid grid-cols-2 gap-1 text-xs text-muted-foreground">
                <dt>Correct</dt>
                <dd className="text-right text-foreground">
                  {p.correct_answers} / {p.total_questions}
                </dd>
                <dt>Raw accuracy</dt>
                <dd className="text-right text-foreground">{p.total_questions ? `${p.raw_percentage}%` : "—"}</dd>
                <dt>Last evidence</dt>
                <dd className="text-right text-foreground">{fmtDate(p.last_evidence_at)}</dd>
              </dl>
              {p.next_stage ? <p className="mt-2 text-xs text-muted-foreground">Next: {p.next_stage}</p> : null}
            </Card>
          ))}
        </div>
        <p className="mt-2 text-xs text-muted-foreground">{SCORE_EXPLANATION}</p>
      </section>

      <section>
        <SectionTitle>Development detail</SectionTitle>
        <Card className="mb-3 flex gap-3">
          <Lightbulb className="mt-0.5 size-5 shrink-0 text-warning" />
          <div>
            <p className="text-sm font-medium">{self ? "Your next practice focus" : "Recommended next practice focus"}</p>
            <p className="text-sm text-muted-foreground">{d.recommendation.text}</p>
          </div>
        </Card>
        {d.development.length ? (
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full text-sm">
              <thead className="bg-surface-2 text-left text-xs text-muted-foreground">
                <tr>
                  <th className="p-3">Sub-skill</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Accuracy</th>
                  <th className="p-3">Sessions with misses</th>
                  <th className="p-3">Last seen</th>
                </tr>
              </thead>
              <tbody>
                {d.development.map((x) => (
                  <tr key={x.code} className="border-t border-border">
                    <td className="p-3">
                      {subSkillLabel(x.subSkill)}
                      <span className="block text-xs text-muted-foreground">{AREA_LABELS[x.area]}</span>
                    </td>
                    <td className="p-3">{DEVELOPMENT_STATUS_LABELS[x.status]}</td>
                    <td className="p-3">
                      {x.accuracy}% <span className="text-xs text-muted-foreground">of {x.evidenceCount}</span>
                    </td>
                    <td className="p-3">{x.sessions}</td>
                    <td className="p-3">{fmtDate(x.lastConfirmed)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <Empty>No repeated development areas. Gaps are only shown after misses across more than one preparation session.</Empty>
        )}
        {d.recentThemes.length ? (
          <p className="mt-3 text-xs text-muted-foreground">
            Recent incorrect-answer themes (60 days):{" "}
            {d.recentThemes.map((t) => `${subSkillLabel(t.subSkill)} (${t.misses})`).join(", ")}
          </p>
        ) : null}
      </section>

      <section>
        <SectionTitle>Preparation history</SectionTitle>
        {d.history.length ? (
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full text-sm">
              <thead className="bg-surface-2 text-left text-xs text-muted-foreground">
                <tr>
                  <th className="p-3">Interview</th>
                  <th className="p-3">Role · stage</th>
                  <th className="p-3">Preparation</th>
                  <th className="p-3">Areas practised</th>
                  <th className="p-3">Result</th>
                </tr>
              </thead>
              <tbody>
                {d.history.map((h) => (
                  <tr key={h.id} className="border-t border-border">
                    <td className="p-3 whitespace-nowrap">{fmtDate(h.startsAt, true)}</td>
                    <td className="p-3">
                      {h.role}
                      <span className="block text-xs text-muted-foreground">{h.stage}</span>
                    </td>
                    <td className="p-3">
                      {INTERVIEW_STATUS_LABELS[h.status]}
                      {h.completedAt ? <span className="block text-xs text-muted-foreground">{fmtDate(h.completedAt, true)}</span> : null}
                    </td>
                    <td className="p-3 text-xs">{h.areas.map((a) => AREA_LABELS[a as keyof typeof AREA_LABELS]).join(", ") || "—"}</td>
                    <td className="p-3 text-xs">
                      {h.result ?? "—"}
                      {h.contextSources.length ? <span className="block text-muted-foreground">Context: {h.contextSources.join(", ")}</span> : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <Empty>No interviews in the last 180 days.</Empty>
        )}
      </section>

      <section>
        <SectionTitle>Recognition</SectionTitle>
        {d.recognition.length ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {d.recognition.map((r) => (
              <Card key={r.code} className="flex items-center gap-3">
                <Award className="size-5 text-warning" />
                <div>
                  <p className="text-sm font-medium">{r.name}</p>
                  <p className="text-xs text-muted-foreground">Earned {fmtDate(r.earnedAt)}</p>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Empty>Recognition is earned through completed preparations and demonstrated capability.</Empty>
        )}
      </section>
    </div>
  );
}
