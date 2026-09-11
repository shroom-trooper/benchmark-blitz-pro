import { Link, useRouter } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Flame, Trophy, LayoutDashboard, Shield, LogOut, Zap } from "lucide-react";
import { useEffect, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getMe } from "@/lib/benchmark.functions";
import { levelProgress } from "@/lib/gamification";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { identifyUser, resetAnalytics } from "@/lib/analytics";

export function useMe() {
  const fn = useServerFn(getMe);
  return useQuery({ queryKey: ["me"], queryFn: () => fn({}) });
}

export function AppShell({ children }: { children: ReactNode }) {
  const { data: me } = useMe();
  const router = useRouter();
  const hubTo = me?.activeTrack === "recruiter" ? "/recruiter" : "/hub";
  const xp = me?.profile?.total_xp ?? 0;
  const lp = levelProgress(xp);

  useEffect(() => {
    const profile = me?.profile;
    if (profile?.id) {
      identifyUser(profile.id, {
        display_name: profile.display_name,
        level: profile.level,
        total_xp: profile.total_xp,
        owns_group: me?.ownsGroup ?? false,
      });
    }
  }, [me?.profile?.id, me?.profile?.level, me?.profile?.total_xp, me?.ownsGroup]);

  async function signOut() {
    resetAnalytics();
    await supabase.auth.signOut();
    router.navigate({ to: "/auth" });
  }

  return (
    <div className="min-h-dvh bg-background">
      <header className="sticky top-0 z-40 border-b border-border bg-surface/80 backdrop-blur">
        <div className="mx-auto grid max-w-7xl grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-4 py-3 sm:flex sm:gap-4">
          <div className="flex min-w-0 items-center gap-3">
          <Link to={hubTo} className="flex shrink-0 items-center gap-2">
            <span className="grid size-8 place-items-center rounded-lg bg-primary text-primary-foreground">
              <Zap className="size-4" />
            </span>
            <span className="hidden font-display text-lg sm:inline">Benchmark</span>
          </Link>

          <nav className="flex min-w-0 items-center gap-1 text-sm">
            <NavLink to={hubTo} icon={<LayoutDashboard className="size-4" />} label="Hub" />
            <NavLink
              to="/leaderboard"
              icon={<Trophy className="size-4" />}
              label="Leaderboard"
            />
            {me?.ownsGroup ? (
              <NavLink to="/admin" icon={<Shield className="size-4" />} label="Group" />
            ) : null}
          </nav>
          </div>

          <div className="flex shrink-0 items-center gap-4 sm:ml-auto">
            <div className="hidden min-w-44 sm:block">
              <div className="mb-1.5 flex items-center justify-between gap-3 text-sm font-medium">
                <span className="truncate text-foreground">
                  Lvl {lp.current.level} · {lp.current.title}
                </span>
                <span className="shrink-0 text-muted-foreground">{xp} XP</span>
              </div>
              <Progress value={lp.pct} className="h-2 w-full" />
            </div>
            <div className="flex items-center gap-1 rounded-full bg-warning/15 px-3 py-1 text-sm font-semibold text-warning">
              <Flame className="size-4" />
              {me?.profile?.current_streak ?? 0}
            </div>
            <Button variant="ghost" size="icon" onClick={signOut} aria-label="Sign out">
              <LogOut className="size-4" />
            </Button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-8">{children}</main>
    </div>
  );
}

function NavLink({
  to,
  icon,
  label,
}: {
  to: string;
  icon: ReactNode;
  label: string;
}) {
  return (
    <Link
      to={to}
      className="flex items-center gap-2 rounded-md px-3 py-2 text-muted-foreground transition-colors hover:bg-surface-2 hover:text-foreground [&.active]:bg-surface-2 [&.active]:text-foreground"
    >
      {icon}
      <span className="hidden sm:inline">{label}</span>
    </Link>
  );
}
