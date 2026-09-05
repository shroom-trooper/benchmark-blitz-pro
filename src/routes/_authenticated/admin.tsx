import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Fragment, useState } from "react";
import { AlertTriangle, Users, Activity, CalendarClock, Lock } from "lucide-react";
import { toast } from "sonner";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { AppShell } from "@/components/AppShell";
import { AssessmentsTab } from "@/components/AssessmentsTab";
import { ElectivesTab } from "@/components/ElectivesTab";

import {
  getGroupConsole,
  inviteToGroup,
  registerUpgradeInterest,
  removeMember,
  revokeInvite,
} from "@/lib/benchmark.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Group console · Benchmark" },
      {
        name: "description",
        content:
          "Invite your managers, track their weekly hiring simulations, and see where your team's decision quality is weakest.",
      },
      { property: "og:title", content: "Group console · Benchmark" },
      {
        property: "og:description",
        content: "Manage your training group and see capability analytics.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AdminPage,
});

type Console = NonNullable<Awaited<ReturnType<typeof getGroupConsole>>>;

function AdminPage() {
  const consoleFn = useServerFn(getGroupConsole);
  const query = useQuery({
    queryKey: ["group-console"],
    queryFn: () => consoleFn({}),
    retry: false,
  });

  if (query.isLoading) {
    return (
      <AppShell>
        <Skeleton className="h-96 w-full rounded-xl" />
      </AppShell>
    );
  }

  if (query.error || !query.data) {
    return (
      <AppShell>
        <div className="rounded-xl border border-border bg-surface p-8 text-center">
          <h1 className="text-xl">You don't have a group yet</h1>
          <p className="mt-2 text-sm leading-relaxed text-body">
            Create one from your hub to invite managers and track their progress.
          </p>
          <Button asChild className="mt-4">
            <Link to="/hub">Go to hub</Link>
          </Button>
        </div>
      </AppShell>
    );
  }

  const t = query.data;

  return (
    <AppShell>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl">{t.group.name}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Week {t.summary.currentWeek} of 52 · {t.group.seatsUsed}/{t.group.memberLimit}{" "}
            seats used
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Metric label="Members" value={String(t.summary.members)} icon={<Users className="size-4" />} />
          <Metric
            label="This week participation"
            value={`${t.summary.participation}%`}
            icon={<Activity className="size-4" />}
          />
          <Metric
            label="Group decision accuracy"
            value={`${t.summary.avgAccuracy}%`}
            icon={<CalendarClock className="size-4" />}
          />
          <Metric
            label="Dormant members"
            value={String(t.summary.dormant)}
            icon={<AlertTriangle className="size-4" />}
          />
        </div>

        <Tabs defaultValue="team">
          <TabsList>
            <TabsTrigger value="team">Team</TabsTrigger>
            <TabsTrigger value="assessments">Assessments</TabsTrigger>
            <TabsTrigger value="electives">Electives</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="team" className="mt-6 space-y-6">
            <TeamTab data={t} />
          </TabsContent>

          <TabsContent value="assessments" className="mt-6 space-y-6">
            <AssessmentsTab />
          </TabsContent>

          <TabsContent value="electives" className="mt-6 space-y-6">
            <ElectivesTab />
          </TabsContent>

          <TabsContent value="analytics" className="mt-6 space-y-6">
            <MemberAnalytics data={t} />

            <ReadinessDonut data={t} />
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  );
}

function timeAgo(iso: string | null) {
  if (!iso) return "Never";
  const diff = Date.now() - new Date(iso).getTime();
  const day = 86_400_000;
  if (diff < 3_600_000) return "Just now";
  if (diff < day) return `${Math.floor(diff / 3_600_000)}h ago`;
  const days = Math.floor(diff / day);
  if (days === 1) return "Yesterday";
  if (days < 30) return `${days} days ago`;
  const months = Math.floor(days / 30);
  return `${months} month${months === 1 ? "" : "s"} ago`;
}

const READINESS: Record<string, { label: string; className: string }> = {
  high: {
    label: "High",
    className: "bg-success/15 text-success",
  },
  practice: {
    label: "Needs practice",
    className: "bg-warning/15 text-warning",
  },
  risk: {
    label: "At risk",
    className: "bg-destructive/15 text-destructive",
  },
};

const DONUT_SEGMENTS = [
  {
    key: "ready",
    label: "Ready",
    hint: "≥80% accuracy & active in the last 14 days",
    color: "var(--success)",
    textClass: "text-success",
  },
  {
    key: "practice",
    label: "Needs practice",
    hint: "50–79% accuracy, active in the last 14 days",
    color: "var(--warning)",
    textClass: "text-warning",
  },
  {
    key: "inactive",
    label: "Inactive",
    hint: "<50% accuracy or no test completed in 14+ days",
    color: "var(--destructive)",
    textClass: "text-destructive",
  },
] as const;

function ReadinessDonut({ data }: { data: Console }) {
  const counts = { ready: 0, practice: 0, inactive: 0 };
  for (const u of data.users) {
    if (u.readiness === "risk") counts.inactive += 1;
    else if (u.readiness === "high") counts.ready += 1;
    else counts.practice += 1;
  }
  const total = data.users.length;
  const chartData = DONUT_SEGMENTS.map((s) => ({
    name: s.label,
    value: counts[s.key],
    color: s.color,
  })).filter((d) => d.value > 0);

  return (
    <Panel title="Hiring readiness distribution">
      {total ? (
        <div className="grid items-center gap-6 sm:grid-cols-[1fr_1fr]">
          <div className="relative h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  dataKey="value"
                  innerRadius="70%"
                  outerRadius="95%"
                  paddingAngle={3}
                  strokeWidth={0}
                  startAngle={90}
                  endAngle={-270}
                >
                  {chartData.map((d) => (
                    <Cell key={d.name} fill={d.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: "var(--surface)",
                    border: "1px solid var(--border)",
                    borderRadius: 8,
                    color: "var(--foreground)",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-4xl font-bold tracking-tight text-foreground">
                {Math.round((counts.ready / total) * 100)}%
              </span>
              <span className="mt-1 max-w-[9rem] text-sm font-medium leading-snug text-foreground/70">
                of {total} manager{total === 1 ? "" : "s"} ready to interview
              </span>
            </div>
          </div>
          <ul className="space-y-4">
            {DONUT_SEGMENTS.map((s) => (
              <li key={s.key} className="flex items-start gap-3 text-sm">
                <span
                  className="mt-1 size-3 shrink-0 rounded-full"
                  style={{ background: s.color }}
                />
                <span>
                  <span className={`font-semibold ${s.textClass}`}>
                    {counts[s.key]} {s.label}
                  </span>
                  <span className="text-muted-foreground">
                    {" "}
                    · {Math.round((counts[s.key] / total) * 100)}%
                  </span>
                  <span className="block text-xs text-muted-foreground">{s.hint}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          No members in your group yet — invite your managers to see readiness.
        </p>
      )}
    </Panel>
  );
}

function MemberAnalytics({ data }: { data: Console }) {
  const released = data.summary.releasedWeeks;
  const rows = data.users;
  const [open, setOpen] = useState<string | null>(null);

  return (
    <Panel title="Member performance">
      {rows.length ? (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th className="py-2 pr-3 font-medium">#</th>
                <th className="py-2 pr-4 font-medium">Member</th>
                <th className="py-2 pr-4 font-medium">Readiness</th>
                <th className="py-2 pr-4 font-medium">Combined accuracy</th>
                <th className="py-2 pr-4 font-medium">Weekly tests</th>
                <th className="py-2 pr-4 font-medium">Custom tests</th>
                <th className="py-2 pr-4 font-medium">Quick Drills</th>
                <th className="py-2 font-medium">Last active</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((u, i) => {
                const totalSessions = u.sessions.length;
                const isOpen = open === u.id;
                const badge = READINESS[u.readiness] ?? READINESS['risk']!;
                return (
                  <Fragment key={u.id}>
                    <tr
                      onClick={() => setOpen(isOpen ? null : u.id)}
                      className="cursor-pointer border-b border-border/60 last:border-0 hover:bg-muted/30"
                    >
                      <td className="py-3 pr-3 text-muted-foreground">{i + 1}</td>
                      <td className="py-3 pr-4">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-heading">{u.name}</span>
                          {u.isOwner ? (
                            <span className="text-xs text-primary">· you</span>
                          ) : null}
                        </div>
                        <p className="truncate text-xs text-muted-foreground">{u.email}</p>
                      </td>
                      <td className="py-3 pr-4 whitespace-nowrap">
                        <span
                          className={`rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase ${badge.className}`}
                        >
                          {badge.label}
                        </span>
                      </td>
                      <td className="py-3 pr-4 whitespace-nowrap">
                        {u.totalQuestions ? (
                          <>
                            <span className="font-semibold text-heading">
                              {u.combinedAccuracy}%
                            </span>{" "}
                            <span className="text-xs text-muted-foreground">
                              ({u.totalCorrect}/{u.totalQuestions})
                            </span>
                          </>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="py-3 pr-4 whitespace-nowrap">
                        {u.completions} / {u.assignedWeekly}{" "}
                        <span className="text-xs text-muted-foreground">
                          ({u.weeklyAccuracy}%)
                        </span>
                      </td>
                      <td className="py-3 pr-4 whitespace-nowrap">
                        {u.customCompletions} / {u.assignedCustom}{" "}
                        <span className="text-xs text-muted-foreground">
                          ({u.customAvgAccuracy}%)
                        </span>
                      </td>
                      <td className="py-3 pr-4 whitespace-nowrap">
                        {u.sprintCompletions}{" "}
                        <span className="text-xs text-muted-foreground">
                          ({u.sprintAccuracy}%)
                        </span>
                      </td>
                      <td className="py-3 whitespace-nowrap text-muted-foreground">
                        {timeAgo(u.lastActiveAt)}
                      </td>
                    </tr>
                    {isOpen ? (
                      <tr className="border-b border-border/60 last:border-0">
                        <td colSpan={8} className="bg-muted/20 px-3 py-4">

                          {totalSessions ? (
                            <div className="grid gap-6 md:grid-cols-2">
                              <div>
                                <p className="mb-2 text-xs uppercase tracking-wide text-muted-foreground">
                                  Score by session
                                </p>
                                <ul className="space-y-2">
                                  {u.sessions.map((s, idx) => (
                                    <li
                                      key={idx}
                                      className="flex items-center justify-between gap-3 text-sm"
                                    >
                                      <span className="truncate">
                                        <span className="text-xs text-muted-foreground">
                                          {s.label}
                                        </span>{" "}
                                        {s.topic}
                                      </span>
                                      <span className="whitespace-nowrap text-muted-foreground">
                                        {s.score}/{s.total} · {s.accuracy}%
                                      </span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                              <div>
                                <p className="mb-2 text-xs uppercase tracking-wide text-muted-foreground">
                                  Suggested focus
                                </p>
                                {u.weakTopics.length ? (
                                  <ul className="space-y-2 text-sm">
                                    {u.weakTopics.map((w, idx) => (
                                      <li key={idx} className="leading-relaxed">
                                        <span className="rounded-md bg-destructive/15 px-1.5 py-0.5 text-xs font-semibold text-destructive">
                                          {w.accuracy}%
                                        </span>{" "}
                                        Revisit <span className="font-medium">{w.topic}</span>
                                      </li>
                                    ))}
                                  </ul>
                                ) : (
                                  <p className="text-sm leading-relaxed text-body">
                                    Full marks everywhere so far — keep the streak going.
                                  </p>
                                )}
                                {u.completions < released ? (
                                  <p className="mt-3 text-sm leading-relaxed text-body">
                                    {released - u.completions} released weekly session
                                    {released - u.completions === 1 ? "" : "s"} still outstanding.
                                  </p>
                                ) : null}
                              </div>
                            </div>
                          ) : (
                            <p className="text-sm leading-relaxed text-body">
                              No sessions completed yet — nudge them to start this week's training.
                            </p>
                          )}
                        </td>
                      </tr>
                    ) : null}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
          <p className="mt-3 text-xs text-muted-foreground">
            Ranked by overall accuracy across weekly and custom sessions. Select a row for the
            full breakdown.
          </p>
        </div>
      ) : (
        <p className="text-sm leading-relaxed text-body">
          No members yet — invite managers from the Team tab to start tracking their progress.
        </p>
      )}
    </Panel>
  );
}



function TeamTab({ data }: { data: Console }) {
  const qc = useQueryClient();
  const inviteFn = useServerFn(inviteToGroup);
  const revokeFn = useServerFn(revokeInvite);
  const removeFn = useServerFn(removeMember);
  const interestFn = useServerFn(registerUpgradeInterest);
  const [email, setEmail] = useState("");
  const [seats, setSeats] = useState("10");

  const refresh = () => qc.invalidateQueries({ queryKey: ["group-console"] });
  const full = data.group.seatsLeft <= 0;

  const invite = useMutation({
    mutationFn: () => inviteFn({ data: { email } }),
    onSuccess: () => {
      toast.success("Invite created — they'll see it when they sign in with that email");
      setEmail("");
      refresh();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const revoke = useMutation({
    mutationFn: (inviteId: string) => revokeFn({ data: { inviteId } }),
    onSuccess: () => {
      toast.success("Invite revoked");
      refresh();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: (memberId: string) => removeFn({ data: { memberId } }),
    onSuccess: () => {
      toast.success("Member removed");
      refresh();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const interest = useMutation({
    mutationFn: () => interestFn({ data: { seats: Number(seats) || null } }),
    onSuccess: () => toast.success("Noted — we'll let you know when bigger groups open up"),
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <>
      <Panel title="Invite a manager">
        {full ? (
          <div className="rounded-lg border border-warning/40 bg-warning/10 p-4">
            <p className="flex items-center gap-2 text-sm font-semibold text-warning">
              <Lock className="size-4" /> Group limit reached
            </p>
            <p className="mt-1 text-sm leading-relaxed text-body">
              The free tier covers {data.group.memberLimit} members plus you. Larger teams are
              coming soon — tell us how many seats you need.
            </p>
            <div className="mt-3 flex gap-2">
              <Input
                type="number"
                min={1}
                className="w-28"
                value={seats}
                onChange={(e) => setSeats(e.target.value)}
                aria-label="Seats needed"
              />
              <Button
                variant="outline"
                onClick={() => interest.mutate()}
                disabled={interest.isPending}
              >
                Notify me
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex gap-2">
            <Input
              type="email"
              placeholder="manager@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <Button onClick={() => invite.mutate()} disabled={!email || invite.isPending}>
              Invite
            </Button>
          </div>
        )}

        <ul className="mt-4 space-y-2 text-sm">
          {data.invites.map((i) => (
            <li key={i.id} className="flex items-center gap-3">
              <span className="truncate">{i.email}</span>
              <span className="text-xs text-muted-foreground">{i.status}</span>
              {i.status === "pending" ? (
                <Button
                  size="sm"
                  variant="ghost"
                  className="ml-auto"
                  onClick={() => revoke.mutate(i.id)}
                >
                  Revoke
                </Button>
              ) : null}
            </li>
          ))}
          {!data.invites.length ? (
            <li className="text-xs text-muted-foreground">No invites yet.</li>
          ) : null}
        </ul>
      </Panel>

      <Panel title="Members">
        <div className="space-y-2">
          {data.users.map((u) => (
            <div
              key={u.id}
              className="flex flex-wrap items-center gap-3 rounded-lg border border-border p-3 text-sm"
            >
              <div className="min-w-0">
                <p className="truncate font-medium">
                  {u.name}
                  {u.isOwner ? <span className="text-primary"> · you</span> : null}
                </p>
                <p className="truncate text-xs text-muted-foreground">{u.email}</p>
              </div>
              <div className="ml-auto flex flex-wrap items-center gap-4">
                <span className="text-xs text-muted-foreground">
                  Lvl {u.level} · {u.totalXp} XP · {u.completions} sessions · streak {u.streak}
                </span>
                {!u.isOwner ? (
                  <Button size="sm" variant="ghost" onClick={() => remove.mutate(u.id)}>
                    Remove
                  </Button>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      </Panel>
    </>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-border bg-surface p-6">
      <h2 className="mb-4 text-lg">{title}</h2>
      {children}
    </section>
  );
}

function Metric({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border bg-surface p-5">
      <div className="flex items-center gap-2 text-muted-foreground">
        {icon}
        <p className="text-xs uppercase tracking-wide">{label}</p>
      </div>
      <p className="mt-2 font-display text-2xl">{value}</p>
    </div>
  );
}
