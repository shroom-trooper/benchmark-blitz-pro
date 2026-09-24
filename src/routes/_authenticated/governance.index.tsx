import { Link, createFileRoute } from "@tanstack/react-router";
import { FileCheck2, Flag, ShieldCheck, Trash2 } from "lucide-react";
import { RouteError, RouteNotFound } from "@/components/RouteError";
import { ROLE_LABELS, ROLE_PERMISSIONS, type OrgRole } from "@/lib/authz/permissions";
import { useGovernance } from "./governance";

export const Route = createFileRoute("/_authenticated/governance/")({
  component: Overview,
  errorComponent: RouteError,
  notFoundComponent: RouteNotFound,
});

const ROLE_SUMMARY: Record<OrgRole, string> = {
  participant: "Completes preparation, sees own profile, flags questions.",
  ta_admin: "Team readiness, manages members, writes draft questions and submits them for review.",
  content_reviewer: "Reviews, approves, publishes, suspends and retires questions; resolves flags.",
  organization_admin: "Everything above plus roles, principles, retention, deletion and audit.",
};

function Overview() {
  const { data } = useGovernance();
  if (!data) return null;
  const cards = [
    { to: "/governance/review", icon: FileCheck2, label: "Questions awaiting review", n: data.counts.inReview, show: data.permissions.includes("content.review") },
    { to: "/governance/flags", icon: Flag, label: "Open question flags", n: data.counts.openFlags, show: data.permissions.includes("question_flags.read") },
    { to: "/governance/retention", icon: Trash2, label: "Pending deletion requests", n: data.counts.pendingDeletions, show: data.permissions.includes("deletion.execute") },
  ].filter((c) => c.show);
  return (
    <div className="space-y-8">
      {cards.length ? (
        <div className="grid gap-3 sm:grid-cols-3">
          {cards.map((c) => (
            <Link key={c.to} to={c.to} className="rounded-xl border border-border bg-surface p-4 hover:border-primary/50">
              <c.icon className="size-4 text-muted-foreground" />
              <p className="mt-2 font-display text-2xl">{c.n}</p>
              <p className="text-xs text-muted-foreground">{c.label}</p>
            </Link>
          ))}
        </div>
      ) : null}
      <section>
        <h2 className="mb-3 text-sm uppercase tracking-wide text-muted-foreground">Roles in Benchmark</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {(Object.keys(ROLE_SUMMARY) as OrgRole[]).map((r) => (
            <div key={r} className={`rounded-xl border p-4 ${data.roles.includes(r) ? "border-primary/50 bg-primary/5" : "border-border bg-surface"}`}>
              <p className="flex items-center gap-2 text-sm font-medium">
                <ShieldCheck className="size-4" /> {ROLE_LABELS[r]} {data.roles.includes(r) ? <span className="text-xs text-primary">(you)</span> : null}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">{ROLE_SUMMARY[r]}</p>
              <p className="mt-2 text-[11px] text-muted-foreground">{ROLE_PERMISSIONS[r].length} permissions</p>
            </div>
          ))}
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          No role gets automatic access to candidate CVs, Gmail content or Google credentials. Capability scores can't be edited by anyone — only invalid questions can be excluded, with a recorded reason.
        </p>
      </section>
    </div>
  );
}
