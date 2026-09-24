import { Link } from "@tanstack/react-router";
import { ArrowRight, Gauge } from "lucide-react";
import { Button } from "@/components/ui/button";

/** Readiness now lives in its own dashboard; this tab points there. */
export function ReadinessTab() {
  return (
    <div className="rounded-xl border border-border bg-surface p-6">
      <div className="flex items-start gap-3">
        <Gauge className="mt-0.5 size-5 text-primary" />
        <div className="space-y-2">
          <h2 className="text-lg">Interviewer readiness dashboard</h2>
          <p className="text-sm text-muted-foreground">
            See who has upcoming interviews, who prepared on time, capability evidence per area, repeated development areas and suggested coaching actions.
          </p>
          <Button asChild size="sm">
            <Link to="/readiness">
              Open readiness dashboard <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
