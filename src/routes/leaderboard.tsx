import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { Flame, Medal, Trophy, Zap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { getGroupLeaderboard, getPublicLeaderboard } from "@/lib/benchmark.functions";
import { levelForXp } from "@/lib/gamification";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/leaderboard")({
  head: () => ({
    meta: [
      { title: "Global hiring capability leaderboard · Benchmark" },
      {
        name: "description",
        content:
          "See who is sharpest at hiring decisions. Weekly three-question interview simulations, XP, streaks and levels — open to everyone.",
      },
      { property: "og:title", content: "Global hiring capability leaderboard" },
      {
        property: "og:description",
        content: "Train weekly, level up your interviewing, and climb the public board.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LeaderboardPage,
});

function LeaderboardPage() {
  const publicFn = useServerFn(getPublicLeaderboard);
  const groupFn = useServerFn(getGroupLeaderboard);
  const [signedIn, setSignedIn] = useState<boolean | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSignedIn(Boolean(data.session)));
  }, []);

  const publicBoard = useQuery({
    queryKey: ["public-leaderboard"],
    queryFn: () => publicFn({}),
  });

  const groupBoard = useQuery({
    queryKey: ["group-leaderboard"],
    queryFn: () => groupFn({}),
    enabled: signedIn === true,
    retry: false,
  });

  const group = groupBoard.data;

  return (
    <div className="min-h-dvh bg-background">
      <header className="border-b border-border bg-surface/80 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-3">
          <Link to="/" className="flex items-center gap-2">
            <span className="grid size-8 place-items-center rounded-lg bg-primary text-primary-foreground">
              <Zap className="size-4" />
            </span>
            <span className="font-display text-lg font-semibold">Benchmark</span>
          </Link>
          <div className="ml-auto flex items-center gap-2">
            {signedIn ? (
              <Button asChild variant="outline" size="sm">
                <Link to="/hub">Your hub</Link>
              </Button>
            ) : (
              <Button asChild size="sm">
                <Link to="/auth">Take the test</Link>
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl space-y-6 px-4 py-10">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight">
            Global leaderboard
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {publicBoard.data
              ? `${publicBoard.data.totalPlayers} people training their hiring judgement`
              : "Loading rankings"}
          </p>
        </div>

        {publicBoard.isLoading ? (
          <Skeleton className="h-96 w-full rounded-xl" />
        ) : (
          <Tabs defaultValue="global">
            <TabsList>
              <TabsTrigger value="global">Global</TabsTrigger>
              {group?.group ? <TabsTrigger value="group">{group.group.name}</TabsTrigger> : null}
            </TabsList>

            <TabsContent value="global" className="mt-4 space-y-2">
              {publicBoard.data?.players.map((p) => (
                <Row
                  key={p.id}
                  rank={p.rank}
                  name={p.name}
                  sub={`Lvl ${p.level} ${levelForXp(p.totalXp).title}`}
                  streak={p.streak}
                  xp={p.totalXp}
                />
              ))}
              {!publicBoard.data?.players.length ? (
                <p className="rounded-xl border border-border bg-surface p-8 text-center text-sm text-muted-foreground">
                  No one has completed a simulation yet. Be first.
                </p>
              ) : null}
            </TabsContent>

            {group?.group ? (
              <TabsContent value="group" className="mt-4 space-y-2">
                {group.members.map((m) => (
                  <Row
                    key={m.id}
                    rank={m.rank}
                    name={m.name + (m.isMe ? " · you" : m.isOwner ? " · admin" : "")}
                    sub={`Lvl ${m.level} ${levelForXp(m.totalXp).title}`}
                    streak={m.streak}
                    xp={m.totalXp}
                    highlight={m.isMe}
                  />
                ))}
              </TabsContent>
            ) : null}
          </Tabs>
        )}

        {signedIn === false ? (
          <div className="rounded-xl border border-primary/40 bg-primary/10 p-6 text-center">
            <p className="font-display text-lg font-semibold">Think you can rank higher?</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Three scenarios a week, four minutes. Free to join.
            </p>
            <Button asChild className="mt-4">
              <Link to="/auth">Start training</Link>
            </Button>
          </div>
        ) : null}
      </main>
    </div>
  );
}

function Row({
  rank,
  name,
  sub,
  streak,
  xp,
  highlight,
}: {
  rank: number;
  name: string;
  sub: string;
  streak: number;
  xp: number;
  highlight?: boolean;
}) {
  return (
    <div
      className={`flex items-center gap-4 rounded-xl border p-4 ${
        highlight ? "border-primary/50 bg-primary/10" : "border-border bg-surface"
      }`}
    >
      <RankBadge rank={rank} />
      <div className="min-w-0">
        <p className="truncate font-medium">{name}</p>
        <p className="text-xs text-muted-foreground">{sub}</p>
      </div>
      <div className="ml-auto flex items-center gap-5 text-sm">
        <span className="flex items-center gap-1 text-warning">
          <Flame className="size-4" />
          {streak}
        </span>
        <span className="font-display text-lg font-semibold">
          {xp}
          <span className="ml-1 text-xs text-muted-foreground">XP</span>
        </span>
      </div>
    </div>
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
