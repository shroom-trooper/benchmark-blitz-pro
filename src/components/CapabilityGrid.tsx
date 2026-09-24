import { ArrowDownRight, ArrowRight, ArrowUpRight } from "lucide-react";
import { AREA_LABELS } from "@/lib/readiness/taxonomy";
import { STAGE_LABELS, type AreaProgress } from "@/lib/readiness/scoring";
import { Progress } from "@/components/ui/progress";

const CONF_LABEL = {
  insufficient: "No evidence yet",
  low: "Low confidence",
  medium: "Moderate confidence",
  high: "High confidence",
} as const;

export function CapabilityGrid({
  progress,
  compact = false,
}: {
  progress: AreaProgress[];
  compact?: boolean;
}) {
  return (
    <div className={`grid gap-3 ${compact ? "sm:grid-cols-2" : "sm:grid-cols-2 lg:grid-cols-4"}`}>
      {progress.map((p) => (
        <AreaCard key={p.capability_area} p={p} />
      ))}
    </div>
  );
}

export function AreaCard({ p }: { p: AreaProgress }) {
  const building = p.mastery_stage === "building";
  const Dir =
    p.recent_direction === "improving"
      ? ArrowUpRight
      : p.recent_direction === "declining"
        ? ArrowDownRight
        : ArrowRight;
  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <p className="text-sm font-medium">{AREA_LABELS[p.capability_area]}</p>
      <p
        className={`mt-2 font-display text-xl ${building ? "text-muted-foreground" : "text-foreground"}`}
      >
        {STAGE_LABELS[p.mastery_stage]}
      </p>
      {building ? (
        <p className="mt-1 text-xs text-muted-foreground">
          {p.total_questions} of 8 answers needed
        </p>
      ) : (
        <>
          <Progress value={p.weighted_score} className="mt-3 h-1.5" />
          <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
            <span>
              {p.weighted_score}% · {CONF_LABEL[p.evidence_confidence]}
            </span>
            <Dir className="size-3.5" aria-label={p.recent_direction} />
          </div>
        </>
      )}
    </div>
  );
}

export function PrepStatusBadge({
  status,
}: {
  status: "not_started" | "in_progress" | "completed";
}) {
  const map = {
    not_started: ["Not started", "bg-surface-2 text-muted-foreground"],
    in_progress: ["In progress", "bg-warning/15 text-warning"],
    completed: ["Prepared", "bg-success/15 text-success"],
  } as const;
  const [label, cls] = map[status];
  return <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${cls}`}>{label}</span>;
}
