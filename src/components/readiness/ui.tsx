import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useSearch } from "@tanstack/react-router";
import { ArrowDownRight, ArrowRight, ArrowUpRight, CircleDashed, HelpCircle } from "lucide-react";
import type { ReactNode } from "react";
import { getReadinessDashboard } from "@/lib/readiness-dashboard.functions";
import {
  CONFIDENCE_LABELS,
  DIRECTION_LABELS,
  STAGE_LABELS,
  type AreaProgress,
  type Confidence,
  type Direction,
  type Stage,
} from "@/lib/readiness/scoring";
import type { Ratio } from "@/lib/readiness/metrics";

export const RANGES = { "30d": 30, "90d": 90, "180d": 180 } as const;
export type RangeKey = keyof typeof RANGES;

export function rangeFor(key: RangeKey) {
  const now = Date.now();
  // Past N days plus the next 30 days (upcoming interviews).
  const from = new Date(now - RANGES[key] * 86_400_000);
  from.setUTCHours(0, 0, 0, 0);
  const to = new Date(now + 30 * 86_400_000);
  to.setUTCHours(23, 59, 59, 0);
  return { from: from.toISOString(), to: to.toISOString() };
}

export function useRange(): RangeKey {
  const s = useSearch({ strict: false }) as { range?: RangeKey };
  return s.range && s.range in RANGES ? s.range : "30d";
}

export function useDashboard() {
  const range = useRange();
  const fn = useServerFn(getReadinessDashboard);
  return useQuery({
    queryKey: ["readiness-dashboard", range],
    queryFn: () => fn({ data: rangeFor(range) }),
    staleTime: 60_000,
  });
}

export const fmtDate = (iso: string | null | undefined, time = false) =>
  iso
    ? new Date(iso).toLocaleString(undefined, {
        day: "numeric",
        month: "short",
        ...(time ? { hour: "2-digit", minute: "2-digit" } : {}),
      })
    : "—";

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-xl border border-border bg-surface p-4 ${className}`}>{children}</div>;
}

export function SectionTitle({ children, help }: { children: ReactNode; help?: string }) {
  return (
    <h2 className="mb-3 flex items-center gap-1.5 text-sm uppercase tracking-wide text-muted-foreground">
      {children}
      {help ? (
        <span title={help} aria-label={help} className="cursor-help">
          <HelpCircle className="size-3.5" />
        </span>
      ) : null}
    </h2>
  );
}

/** A percentage that always shows its numerator and denominator. */
export function RatioStat({ label, r, help }: { label: string; r: Ratio; help?: string }) {
  return (
    <Card>
      <p className="flex items-center gap-1 text-xs text-muted-foreground">
        {label}
        {help ? (
          <span title={help} aria-label={help}>
            <HelpCircle className="size-3" />
          </span>
        ) : null}
      </p>
      <p className="mt-1 font-display text-2xl">{r.pct === null ? "—" : `${r.pct}%`}</p>
      <p className="text-xs text-muted-foreground">
        {r.denominator === 0 ? "No eligible data yet" : `${r.numerator} of ${r.denominator}`}
      </p>
    </Card>
  );
}

export function Stat({ label, value, sub }: { label: string; value: ReactNode; sub?: ReactNode }) {
  return (
    <Card>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 font-display text-2xl">{value}</p>
      {sub ? <p className="text-xs text-muted-foreground">{sub}</p> : null}
    </Card>
  );
}

const CONF_ICON: Record<Confidence, string> = { low: "○", medium: "◐", high: "●" };
export function ConfidenceTag({ c }: { c: Confidence }) {
  return (
    <span className="text-xs text-muted-foreground" title={CONFIDENCE_LABELS[c]}>
      <span aria-hidden>{CONF_ICON[c]}</span> {CONFIDENCE_LABELS[c]}
    </span>
  );
}

export function DirectionTag({ d }: { d: Direction }) {
  const Icon = d === "improving" ? ArrowUpRight : d === "declining" ? ArrowDownRight : d === "stable" ? ArrowRight : CircleDashed;
  const cls = d === "improving" ? "text-success" : d === "declining" ? "text-warning" : "text-muted-foreground";
  return (
    <span className={`inline-flex items-center gap-1 text-xs ${cls}`}>
      <Icon className="size-3.5" aria-hidden />
      {DIRECTION_LABELS[d]}
    </span>
  );
}

const STAGE_CLS: Record<Stage, string> = {
  building: "border-dashed border-border text-muted-foreground",
  foundation: "border-border bg-surface-2",
  practiced: "border-primary/30 bg-primary/10",
  calibrated: "border-primary/50 bg-primary/20",
  mastery: "border-success/50 bg-success/15",
};

/** Accessible capability cell: text for stage, score, confidence, count and direction. */
export function CapabilityCell({ p, compact = false }: { p: AreaProgress; compact?: boolean }) {
  const building = p.mastery_stage === "building";
  return (
    <div className={`rounded-lg border p-2.5 ${STAGE_CLS[p.mastery_stage]}`}>
      <p className="text-sm font-medium">{STAGE_LABELS[p.mastery_stage]}</p>
      {building ? (
        <p className="text-xs text-muted-foreground">{p.total_questions} answers — not scored yet</p>
      ) : (
        <p className="text-xs">
          {p.weighted_score}% · {p.total_questions} answers
        </p>
      )}
      {!compact ? (
        <div className="mt-1 flex flex-wrap gap-x-2">
          <ConfidenceTag c={p.evidence_confidence} />
          {!building ? <DirectionTag d={p.recent_direction} /> : null}
        </div>
      ) : null}
    </div>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return <p className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">{children}</p>;
}

export function downloadCsv(filename: string, csv: string) {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
