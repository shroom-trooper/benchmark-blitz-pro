import { Link, useRouter } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Flame, Trophy, LayoutDashboard, Shield, LogOut, Zap } from "lucide-react";
import type { ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getMe } from "@/lib/benchmark.functions";
import { levelProgress } from "@/lib/gamification";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";

export function useMe() {
  const fn = useServerFn(getMe);
  return useQuery({ queryKey: ["me"], queryFn: () => fn({}) });
}

export function AppShell({ children }: { children: ReactNode }) {
  const { data: me } = useMe();
  const router = useRouter();
  const xp = me?.profile?.total_xp ?? 0;
  const lp = levelProgress(xp);

  async function signOut() {
    await supabase.auth.signOut();
    router.navigate({ to: "/auth" });
  }

  return (
    <div className="min-h-dvh bg-background">
      <header className="sticky top-0 z-40 border-b border-border bg-surface/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-4 px-4 py-3">
          <Link to="/hub" className="flex items-center gap-2">
            <span className="grid size-8 place-items-center rounded-lg bg-primary text-primary-foreground">
              <Zap className="size-4" />
            </span>
            <span className="font-display text-lg">Benchmark</span>
          </Link>

          <nav className="flex items-center gap-1 text-sm">
            <NavLink to="/hub" icon={<LayoutDashboard className="size-4" />} label="Hub" />
            <NavLink
              to="/leaderboard"
              icon={<Trophy className="size-4" />}
              label="Leaderboard"
            />
            {me?.ownsGroup ? (
              <NavLink to="/admin" icon={<Shield className="size-4" />} label="Group" />
            ) : null}
          </nav>

          <div className="ml-auto flex items-center gap-4">
            <div className="hidden min-w-44 sm:block">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span className="font-medium text-foreground">
                  Lvl {lp.current.level} · {lp.current.title}
                </span>
                <span>{xp} XP</span>
              </div>
              <Progress value={lp.pct} className="mt-1 h-1.5" />
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
