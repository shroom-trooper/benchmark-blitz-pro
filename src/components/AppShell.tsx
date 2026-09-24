import { Link, useRouter } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  Zap,
  LogOut,
  Home,
  CalendarClock,
  Gauge,
  CalendarDays,
  Users,
  Layers,
  Activity,
  BookOpen,
  Shield,
  Settings,
  Menu,
} from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getMe } from "@/lib/benchmark.functions";
import { getMyAccess } from "@/lib/governance.functions";
import { visibleNav, personalLink, type NavItem } from "@/lib/authz/navigation";
import { Button } from "@/components/ui/button";
import { identifyUser, resetAnalytics } from "@/lib/analytics";

export function useMe() {
  const fn = useServerFn(getMe);
  return useQuery({ queryKey: ["me"], queryFn: () => fn({}) });
}

export function useAccess() {
  const fn = useServerFn(getMyAccess);
  return useQuery({ queryKey: ["my-access"], queryFn: () => fn(), staleTime: 60_000 });
}

const ICONS: Record<NavItem["icon"], typeof Home> = {
  home: Home,
  "calendar-clock": CalendarClock,
  gauge: Gauge,
  calendar: CalendarDays,
  users: Users,
  layers: Layers,
  activity: Activity,
  book: BookOpen,
  shield: Shield,
  settings: Settings,
};

export function AppShell({ children }: { children: ReactNode }) {
  const { data: me } = useMe();
  const { data: access } = useAccess();
  const router = useRouter();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const perms = access?.permissions ?? [];
  const personal = personalLink(perms);
  const items = personal ? [...visibleNav(perms), personal] : visibleNav(perms);

  useEffect(() => {
    const id = me?.profile?.id;
    if (id) identifyUser(id, { has_team_access: (access?.permissions ?? []).includes("capability.read_team") });
  }, [me?.profile?.id, access?.permissions]);

  async function signOut() {
    resetAnalytics();
    sessionStorage.removeItem("bm-landed");
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    router.navigate({ to: "/auth", replace: true });
  }

  return (
    <div className="min-h-dvh bg-background">
      <header className="sticky top-0 z-40 border-b border-border bg-surface/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3">
          <Link to="/home" className="flex shrink-0 items-center gap-2">
            <span className="grid size-8 place-items-center rounded-lg bg-primary text-primary-foreground">
              <Zap className="size-4" />
            </span>
            <span className="font-display text-lg">Benchmark</span>
          </Link>
          <nav className="hidden min-w-0 flex-1 items-center gap-1 overflow-x-auto text-sm lg:flex">
            {items.map((i) => (
              <NavLink key={i.to} item={i} />
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-1">
            {access?.orgName ? (
              <span className="hidden max-w-40 truncate text-xs text-muted-foreground xl:inline">{access.orgName}</span>
            ) : null}
            <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setOpen((o) => !o)} aria-label="Menu">
              <Menu className="size-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={signOut} aria-label="Sign out">
              <LogOut className="size-4" />
            </Button>
          </div>
        </div>
        {open ? (
          <nav className="grid gap-1 border-t border-border px-4 py-3 text-sm lg:hidden" onClick={() => setOpen(false)}>
            {items.map((i) => (
              <NavLink key={i.to} item={i} />
            ))}
          </nav>
        ) : null}
      </header>
      <main className="mx-auto max-w-7xl px-4 py-8">{children}</main>
    </div>
  );
}

function NavLink({ item }: { item: NavItem }) {
  const Icon = ICONS[item.icon];
  return (
    <Link
      to={item.to}
      activeOptions={{ exact: item.to === "/readiness" || item.to === "/governance" }}
      className="flex shrink-0 items-center gap-2 rounded-md px-3 py-2 text-muted-foreground transition-colors hover:bg-surface-2 hover:text-foreground [&.active]:bg-surface-2 [&.active]:text-foreground"
    >
      <Icon className="size-4" />
      <span>{item.label}</span>
    </Link>
  );
}
