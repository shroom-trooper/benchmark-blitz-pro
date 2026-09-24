import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { AlertTriangle, Target, Users } from "lucide-react";
import { getGroupReadiness } from "@/lib/readiness.functions";
import { AREA_LABELS, CAPABILITY_AREAS } from "@/lib/readiness/taxonomy";
import { STAGE_LABELS } from "@/lib/readiness/scoring";
import { track } from "@/lib/analytics";
import { CapabilityGrid, PrepStatusBadge } from "@/components/CapabilityGrid";
import { Skeleton } from "@/components/ui/skeleton";

const fmt = (iso: string | null) =>
  iso
    ? new Date(iso).toLocaleString(undefined, {
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "—";

export function ReadinessTab() {
  const fn = useServerFn(getGroupReadiness);
  const q = useQuery({ queryKey: ["group-readiness"], queryFn: () => fn() });
  const [open, setOpen] = useState<string | null>(null);
  useEffect(() => {
    track("readiness_dashboard_viewed");
  }, []);

  if (q.isLoading) return <Skeleton className="h-64 w-full rounded-xl" />;
  const d = q.data;
  if (!d)
    return (
      <p className="text-sm text-muted-foreground">
        Interview readiness is available for interviewer groups.
      </p>
    );
  if (!d.members.length)
    return (
      <p className="text-sm text-muted-foreground">
        Invite a member to start seeing their interview preparation here.
      </p>
    );
  const member = d.members.find((m) => m.id === open);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <Goal
          icon={<Target className="size-4" />}
          label="Upcoming interviews prepared"
          value={`${d.goals.prepared}/${d.goals.upcoming}`}
        />
        <Goal
          icon={<Users className="size-4" />}
          label="Members preparing this month"
          value={`${d.goals.activeThisMonth}/${d.goals.members}`}
        />
        <Goal
          icon={<AlertTriangle className="size-4" />}
          label="Needs attention"
          value={String(d.attention.length)}
        />
      </div>

      {d.attention.length ? (
        <Section title="Attention needed">
          <ul className="space-y-2">
            {d.attention.map((a, i) => (
              <li
                key={i}
                className="flex gap-3 rounded-lg border border-warning/30 bg-warning/10 p-3 text-sm"
              >
                <AlertTriangle className="mt-0.5 size-4 shrink-0 text-warning" /> {a.text}
              </li>
            ))}
          </ul>
        </Section>
      ) : null}

      <Section title="Upcoming interviews">
        {d.upcoming.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No upcoming interviews logged by your team.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full text-sm">
              <thead className="bg-surface-2 text-left text-xs text-muted-foreground">
                <tr>
                  <th className="p-3">Interviewer</th>
                  <th className="p-3">Role</th>
                  <th className="p-3">Stage</th>
                  <th className="p-3">When</th>
                  <th className="p-3">Preparation</th>
                  <th className="p-3">Completed</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {d.upcoming.map((u) => (
                  <tr key={u.id}>
                    <td className="p-3">{u.interviewer}</td>
                    <td className="p-3">{u.roleTitle}</td>
                    <td className="p-3">{u.stage}</td>
                    <td className="p-3">{fmt(u.startsAt)}</td>
                    <td className="p-3">
                      <PrepStatusBadge status={u.prepStatus} />
                    </td>
                    <td className="p-3">{fmt(u.prepCompletedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Section>

      <Section title="Team capability overview">
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead className="bg-surface-2 text-left text-xs text-muted-foreground">
              <tr>
                <th className="p-3">Member</th>
                {CAPABILITY_AREAS.map((a) => (
                  <th key={a} className="p-3">
                    {AREA_LABELS[a]}
                  </th>
                ))}
                <th className="p-3">Preps</th>
                <th className="p-3">Last prep</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {d.members.map((m) => (
                <tr
                  key={m.id}
                  className="cursor-pointer hover:bg-surface-2"
                  onClick={() => setOpen(m.id)}
                >
                  <td className="p-3 font-medium">{m.name}</td>
                  {m.progress.map((p) => (
                    <td key={p.capability_area} className="p-3">
                      <span
                        className={p.mastery_stage === "building" ? "text-muted-foreground" : ""}
                      >
                        {STAGE_LABELS[p.mastery_stage]}
                      </span>
                      {p.mastery_stage !== "building" ? (
                        <span className="block text-xs text-muted-foreground">
                          {p.weighted_score}% · {p.evidence_confidence}
                        </span>
                      ) : null}
                    </td>
                  ))}
                  <td className="p-3">{m.completedPreps}</td>
                  <td className="p-3">{fmt(m.lastPrepAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      {member ? (
        <div className="rounded-xl border border-primary/30 bg-surface p-5">
          <>
            <div className="flex items-center justify-between">
              <h3 className="font-display text-lg">{member.name}</h3>
              <button
                type="button"
                className="text-sm text-muted-foreground hover:text-foreground"
                onClick={() => setOpen(null)}
              >
                Close
              </button>
            </div>
            <div className="mt-4 space-y-4">
              <p className="text-sm text-muted-foreground">
                Level {member.level.level} · {member.level.title} · {member.completedPreps}{" "}
                preparations · last {fmt(member.lastPrepAt)}
              </p>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-lg border border-border p-3">
                  <p className="text-xs text-muted-foreground">Strongest</p>
                  {member.strongest ? AREA_LABELS[member.strongest] : "Building profile"}
                </div>
                <div className="rounded-lg border border-border p-3">
                  <p className="text-xs text-muted-foreground">Priority development</p>
                  {member.priority ? AREA_LABELS[member.priority] : "Building profile"}
                </div>
              </div>
              <CapabilityGrid progress={member.progress} compact />
            </div>
          </>
        </div>
      ) : null}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="mb-3 text-sm uppercase tracking-wide text-muted-foreground">{title}</h3>
      {children}
    </div>
  );
}
function Goal({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <p className="flex items-center gap-2 text-xs text-muted-foreground">
        {icon}
        {label}
      </p>
      <p className="mt-2 font-display text-2xl">{value}</p>
    </div>
  );
}
