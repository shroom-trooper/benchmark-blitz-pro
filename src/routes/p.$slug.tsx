import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { Flame, Trophy, Zap } from "lucide-react";
import { getPublicProfile } from "@/lib/share.functions";
import { Button } from "@/components/ui/button";
import { rankBadgeLabel } from "@/components/ShareCard";
import { RouteError, RouteNotFound } from "@/components/RouteError";

const SITE = "https://usebenchmark.app";

export const Route = createFileRoute("/p/$slug")({
  validateSearch: (search: Record<string, unknown>) => ({
    track: search["track"] === "recruiter" ? ("recruiter" as const) : undefined,
  }),
  loaderDeps: ({ search }) => ({ track: search.track }),
  loader: async ({ params, deps }) => {
    const profile = await getPublicProfile({
      data: { slug: params.slug, ...(deps.track ? { track: deps.track } : {}) },
    });
    if (!profile) throw notFound();
    return profile;
  },
  head: ({ params, loaderData }) => {
    const recruiter = loaderData?.track === "recruiter";
    const suffix = recruiter ? "?track=recruiter" : "";
    const title = loaderData
      ? `${loaderData.name} · Level ${loaderData.level} ${loaderData.levelTitle} on Benchmark`
      : "Benchmark player";
    const tagline = recruiter
      ? "Calibrated & ready to recruit. See where your TA judgement stacks up on Benchmark."
      : "Calibrated & ready to hire. See where your hiring skills stack up on Benchmark.";
    const description = loaderData
      ? `${loaderData.name} has ${loaderData.totalXp.toLocaleString()} XP and a ${loaderData.streak}-week streak. ${tagline}`
      : tagline;
    const image = `${SITE}/api/public/og/${params.slug}${suffix}`;
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "profile" },
        { property: "og:url", content: `${SITE}/p/${params.slug}${suffix}` },
        { property: "og:image", content: image },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: title },
        { name: "twitter:description", content: description },
        { name: "twitter:image", content: image },
      ],
      links: [{ rel: "canonical", href: `${SITE}/p/${params.slug}${suffix}` }],
    };
  },
  component: PublicProfilePage,  errorComponent: RouteError,
  notFoundComponent: RouteNotFound,

});

function PublicProfilePage() {
  const p = Route.useLoaderData();
  const { slug } = Route.useParams();
  const isRecruiter = p.track === "recruiter";

  return (
    <div className="min-h-dvh bg-background">
      <header className="border-b border-border bg-surface/80 backdrop-blur">
        <div className="mx-auto flex max-w-4xl items-center gap-3 px-4 py-3">
          <Link to="/" className="flex items-center gap-2">
            <span className="grid size-8 place-items-center rounded-lg bg-primary text-primary-foreground">
              <Zap className="size-4" />
            </span>
            <span className="font-display text-lg">Benchmark</span>
          </Link>
          <Button asChild size="sm" className="ml-auto">
            <Link to="/auth">Start free</Link>
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-4xl space-y-8 px-4 py-12">
        <section className="overflow-hidden rounded-2xl border border-border bg-surface">
          <img
            src={`/api/public/og/${slug}${isRecruiter ? "?track=recruiter" : ""}`}
            alt={`${p.name}'s Benchmark achievement card`}
            className="w-full"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.display = "none";
            }}
          />
          <div className="grid gap-4 border-t border-border p-6 sm:grid-cols-4">
            <Stat label="Rank" value={p.rank ? `#${p.rank}` : "—"} />
            <Stat label="Level" value={`${p.level}`} sub={p.levelTitle} />
            <Stat label="Total XP" value={p.totalXp.toLocaleString()} />
            <Stat label="Streak" value={`${p.streak} weeks`} />
          </div>
        </section>

        <section className="rounded-2xl border border-primary/40 bg-primary/10 p-8 text-center">
          <p className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 text-xs text-muted-foreground">
            <Trophy className="size-3" /> {rankBadgeLabel(p)}
          </p>
          <h1 className="mt-4 text-3xl">
            {isRecruiter ? "Test your recruiting signal" : "Test your hiring signal"}
          </h1>
          <p className="mx-auto mt-2 max-w-xl text-sm leading-relaxed text-body">
            {isRecruiter
              ? `Three real TA scenarios, 45 seconds each. See how your judgement compares with ${p.totalPlayers.toLocaleString()} recruiters training on Benchmark.`
              : `Three real interview scenarios, 45 seconds each. See how your judgement compares with ${p.totalPlayers.toLocaleString()} hiring managers training on Benchmark.`}
          </p>
          <Button asChild size="lg" className="mt-6">
            <Link to="/auth">Try 3-Minute Quick Sprint Free</Link>
          </Button>
          <p className="mt-3 flex items-center justify-center gap-1 text-xs text-muted-foreground">
            <Flame className="size-3 text-warning" /> Free forever for solo players
          </p>
        </section>

        <div className="text-center">
          <Link to="/leaderboard" className="text-sm text-muted-foreground underline">
            View the global leaderboard
          </Link>
        </div>
      </main>
    </div>
  );
}

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="font-display text-2xl">{value}</p>
      {sub ? <p className="text-xs text-muted-foreground">{sub}</p> : null}
    </div>
  );
}
