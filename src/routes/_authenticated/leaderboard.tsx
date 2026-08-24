import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Flame, Medal, Trophy } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { getLeaderboard } from "@/lib/benchmark.functions";
import { levelForXp } from "@/lib/gamification";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/_authenticated/leaderboard")({
  head: () => ({
    meta: [
      { title: "Leaderboard · Benchmark" },
      {
        name: "description",
        content:
          "See how your hiring capability XP ranks against your peers and how departments compare across the organisation.",
      },
      { property: "og:title", content: "Leaderboard · Benchmark" },
      {
        property: "og:description",
        content: "Manager and department rankings for hiring capability training.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LeaderboardPage,
});

function LeaderboardPage() {
  const fn = useServerFn(getLeaderboard);
  const { data, isLoading } = useQuery({
    queryKey: ["leaderboard"],
    queryFn: () => fn({}),
  });

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight">
            Leaderboard
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {data ? `${data.totalPlayers} managers training` : "Loading rankings"}
            {data?.me ? ` · you are ranked #${data.me.rank}` : ""}
          </p>
        </div>

        {isLoading || !data ? (
          <Skeleton className="h-96 w-full rounded-xl" />
        ) : (
          <Tabs defaultValue="managers">
            <TabsList>
              <TabsTrigger value="managers">Managers</TabsTrigger>
              <TabsTrigger value="departments">Departments</TabsTrigger>
            </TabsList>

            <TabsContent value="managers" className="mt-4 space-y-2">
              {data.global.map((p) => (
                <div
                  key={p.id}
                  className={`flex items-center gap-4 rounded-xl border p-4 ${
                    p.isMe ? "border-primary/50 bg-primary/10" : "border-border bg-surface"
                  }`}
                >
                  <RankBadge rank={p.rank} />
                  <div className="min-w-0">
                    <p className="truncate font-medium">
                      {p.name}
                      {p.isMe ? <span className="text-primary"> · you</span> : null}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {p.department ?? "Unassigned"} · Lvl {p.level}{" "}
                      {levelForXp(p.totalXp).title}
                    </p>
                  </div>
                  <div className="ml-auto flex items-center gap-5 text-sm">
                    <span className="flex items-center gap-1 text-warning">
                      <Flame className="size-4" />
                      {p.streak}
                    </span>
                    <span className="font-display text-lg font-semibold">
                      {p.totalXp}
                      <span className="ml-1 text-xs text-muted-foreground">XP</span>
                    </span>
                  </div>
                </div>
              ))}
            </TabsContent>

            <TabsContent value="departments" className="mt-4 space-y-2">
              {data.departmentBoard.map((d) => (
                <div
                  key={d.name}
                  className="flex items-center gap-4 rounded-xl border border-border bg-surface p-4"
                >
                  <RankBadge rank={d.rank} />
                  <div>
                    <p className="font-medium">{d.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {d.members} manager{d.members === 1 ? "" : "s"}
                    </p>
                  </div>
                  <div className="ml-auto text-right">
                    <p className="font-display text-lg font-semibold">{d.avgXp} XP</p>
                    <p className="text-xs text-muted-foreground">average per manager</p>
                  </div>
                </div>
              ))}
            </TabsContent>
          </Tabs>
        )}
      </div>
    </AppShell>
  );
}

function RankBadge({ rank }: { rank: number }) {
  const colour =
    rank === 1
      ? "bg-warning/20 text-warning"
      : rank === 2
        ? "bg-muted text-foreground"
        : rank === 3
          ? "bg-destructive/15 text-destructive"
          : "bg-surface-2 text-muted-foreground";
  return (
    <span
      className={`grid size-9 shrink-0 place-items-center rounded-lg font-display font-semibold ${colour}`}
    >
      {rank <= 3 ? (
        rank === 1 ? (
          <Trophy className="size-4" />
        ) : (
          <Medal className="size-4" />
        )
      ) : (
        rank
      )}
    </span>
  );
}
