import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { Flame, Medal, Share2, Trophy, Zap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  getGroupLeaderboard,
  getPublicLeaderboard,
  getPublicRecruiterLeaderboard,
  getRecruiterGroupLeaderboard,
} from "@/lib/benchmark.functions";
import { levelForXp, levelProgressIn } from "@/lib/gamification";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ShareAchievementModal } from "@/components/ShareAchievementModal";
import { RouteError, RouteNotFound } from "@/components/RouteError";


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
  component: LeaderboardPage,  errorComponent: RouteError,
  notFoundComponent: RouteNotFound,

});

function LeaderboardPage() {
  const publicFn = useServerFn(getPublicLeaderboard);
  const groupFn = useServerFn(getGroupLeaderboard);
  const publicRecruiterFn = useServerFn(getPublicRecruiterLeaderboard);
  const recruiterGroupFn = useServerFn(getRecruiterGroupLeaderboard);
  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  const [myId, setMyId] = useState<string | null>(null);
  const [shareOpen, setShareOpen] = useState(false);
  const [track, setTrack] = useState<"interviewer" | "recruiter">("interviewer");

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSignedIn(Boolean(data.session));
      setMyId(data.session?.user.id ?? null);
    });
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

  const recruiterBoard = useQuery({
    queryKey: ["public-recruiter-leaderboard"],
    queryFn: () => publicRecruiterFn({}),
    enabled: track === "recruiter",
  });

  const recruiterGroupBoard = useQuery({
    queryKey: ["recruiter-group-leaderboard"],
    queryFn: () => recruiterGroupFn({}),
    enabled: track === "recruiter" && signedIn === true,
    retry: false,
  });

  const group = groupBoard.data;
  const recruiterGroup = recruiterGroupBoard.data;
  const isRecruiter = track === "recruiter";
  const activeBoard = isRecruiter ? recruiterBoard : publicBoard;
  const activeGroup = isRecruiter ? recruiterGroup : group;
  const titleFor = (xp: number) =>
    isRecruiter ? levelProgressIn("recruiter", xp).current.title : levelForXp(xp).title;

  return (
    <div className="min-h-dvh bg-background">
      <header className="border-b border-border bg-surface/80 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-3">
          <Link to="/" className="flex items-center gap-2">
            <span className="grid size-8 place-items-center rounded-lg bg-primary text-primary-foreground">
              <Zap className="size-4" />
            </span>
            <span className="font-display text-lg">Benchmark</span>
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
          <h1 className="text-3xl">Global leaderboard</h1>
          <p className="mt-1 text-sm text-body">
            {activeBoard.data
              ? `${activeBoard.data.totalPlayers} people training their ${
                  isRecruiter ? "recruiting craft" : "hiring judgement"
                }`
              : "Loading rankings"}
          </p>
        </div>

        <Tabs value={track} onValueChange={(v) => setTrack(v as "interviewer" | "recruiter")}>
          <TabsList>
            <TabsTrigger value="interviewer">Interviewer</TabsTrigger>
            <TabsTrigger value="recruiter">Recruiter</TabsTrigger>
          </TabsList>
        </Tabs>

        {activeBoard.isLoading ? (
          <Skeleton className="h-96 w-full rounded-xl" />
        ) : (
          <Tabs defaultValue="global" key={track}>
            <TabsList>
              <TabsTrigger value="global">Global</TabsTrigger>
              {activeGroup?.group ? (
                <TabsTrigger value="group">{activeGroup.group.name}</TabsTrigger>
              ) : null}
            </TabsList>

            <TabsContent value="global" className="mt-4 space-y-2">
              {activeBoard.data?.players.map((p) => (
                <Row
                  key={p.id}
                  rank={p.rank}
                  name={p.name}
                  sub={`Lvl ${p.level} ${titleFor(p.totalXp)}`}
                  streak={p.streak}
                  xp={p.totalXp}
                  highlight={p.id === myId}
                  onShare={!isRecruiter && p.id === myId ? () => setShareOpen(true) : undefined}
                />
              ))}

              {!activeBoard.data?.players.length ? (
                <p className="rounded-xl border border-border bg-surface p-8 text-center text-sm text-body">
                  No one has completed a {isRecruiter ? "recruiter " : ""}simulation yet. Be first.
                </p>
              ) : null}
            </TabsContent>

            {activeGroup?.group ? (
              <TabsContent value="group" className="mt-4 space-y-2">
                {activeGroup.members.map((m) => (
                  <Row
                    key={m.id}
                    rank={m.rank}
                    name={m.name + (m.isMe ? " · you" : m.isOwner ? " · admin" : "")}
                    sub={`Lvl ${m.level} ${titleFor(m.totalXp)}`}
                    streak={m.streak}
                    xp={m.totalXp}
                    highlight={m.isMe}
                  />
                ))}
                {!activeGroup.members.length ? (
                  <p className="rounded-xl border border-border bg-surface p-8 text-center text-sm text-body">
                    No members have trained yet.
                  </p>
                ) : null}
              </TabsContent>
            ) : null}
          </Tabs>
        )}

        {signedIn === false ? (
          <div className="rounded-xl border border-primary/40 bg-primary/10 p-6 text-center">
            <p className="font-display text-lg">Think you can rank higher?</p>
            <p className="mt-1 text-sm leading-relaxed text-body">
              Three scenarios a week, four minutes. Free to join.
            </p>
            <Button asChild className="mt-4">
              <Link to="/auth">Start training</Link>
            </Button>
          </div>
        ) : null}
      </main>

      {shareOpen ? <ShareAchievementModal onClose={() => setShareOpen(false)} /> : null}
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
  onShare,
}: {
  rank: number;
  name: string;
  sub: string;
  streak: number;
  xp: number;
  highlight?: boolean;
  onShare?: (() => void) | undefined;
}) {
  return (
    <div
      className={`flex flex-wrap items-center gap-x-4 gap-y-2 rounded-xl border p-4 ${
        highlight ? "border-primary/50 bg-primary/10" : "border-border bg-surface"
      }`}
    >
      <RankBadge rank={rank} />
      <div className="min-w-0">
        <p className="truncate font-medium">{name}</p>
        <p className="text-xs text-muted-foreground">{sub}</p>
      </div>
      {onShare ? (
        <Button size="sm" variant="outline" className="order-last sm:order-none" onClick={onShare}>
          <Share2 className="size-3.5" /> Share rank
        </Button>
      ) : null}
      <div className="ml-auto flex items-center gap-5 text-sm">
        <span className="flex items-center gap-1 text-warning">
          <Flame className="size-4" />
          {streak}
        </span>
        <span className="font-display text-lg">
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
      className={`grid size-9 shrink-0 place-items-center rounded-lg font-display ${colour}`}
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
