import { Link, Outlet, createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { AppShell } from "@/components/AppShell";
import { LoadingSplash } from "@/components/LoadingSplash";
import { RouteError, RouteNotFound } from "@/components/RouteError";
import { getGovernanceOverview } from "@/lib/governance.functions";
import { ROLE_LABELS, type Permission } from "@/lib/authz/permissions";

export const Route = createFileRoute("/_authenticated/governance")({
  head: () => ({
    meta: [
      { title: "Governance · Benchmark" },
      { name: "description", content: "Roles, content review, question flags, retention and audit for your organization." },
      { property: "og:title", content: "Governance · Benchmark" },
      { property: "og:description", content: "Governed, explainable interviewer coaching." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: GovernanceLayout,
  errorComponent: RouteError,
  notFoundComponent: RouteNotFound,
});

export function useGovernance() {
  const fn = useServerFn(getGovernanceOverview);
  return useQuery({ queryKey: ["governance-overview"], queryFn: () => fn(), staleTime: 30_000 });
}

const TABS: { to: string; label: string; perm: Permission | null; exact?: boolean }[] = [
  { to: "/governance", label: "Overview", perm: null, exact: true },
  { to: "/admin", label: "Members & invitations", perm: "members.manage" },
  { to: "/governance/roles", label: "Roles & access", perm: "members.read" },
  { to: "/governance/content", label: "Content library", perm: "content.read" },
  { to: "/governance/review", label: "Review queue", perm: "content.review" },
  { to: "/governance/flags", label: "Flags", perm: "question_flags.read" },
  { to: "/governance/principles", label: "Organization settings", perm: null },
  { to: "/settings/calendar", label: "Integrations", perm: "integrations.view_health" },
  { to: "/governance/retention", label: "Retention & deletion", perm: "retention.manage" },
  { to: "/governance/audit", label: "Audit log", perm: "audit.read" },
];

function GovernanceLayout() {
  const q = useGovernance();
  if (q.isLoading) return <LoadingSplash />;
  if (!q.data)
    return (
      <AppShell>
        <div className="mx-auto max-w-xl rounded-xl border border-border bg-surface p-6 text-center">
          <h1 className="text-xl">Governance</h1>
          <p className="mt-2 text-sm text-muted-foreground">You aren't part of an organization yet. Ask your organization admin to invite you.</p>
        </div>
      </AppShell>
    );
  const perms = new Set(q.data.permissions);
  return (
    <AppShell>
      <div className="mx-auto max-w-7xl space-y-6">
        <div>
          <p className="text-sm text-muted-foreground">
            {q.data.orgName} · {q.data.roles.map((r) => ROLE_LABELS[r]).join(", ")}
          </p>
          <h1 className="text-3xl">Governance</h1>
        </div>
        <nav className="flex gap-1 overflow-x-auto border-b border-border" aria-label="Governance sections">
          {TABS.filter((t) => !t.perm || perms.has(t.perm)).map((t) => (
            <Link
              key={t.to}
              to={t.to}
              activeOptions={{ exact: !!t.exact }}
              className="whitespace-nowrap border-b-2 border-transparent px-3 py-2 text-sm text-muted-foreground hover:text-foreground"
              activeProps={{ className: "!border-primary !text-foreground" }}
            >
              {t.label}
            </Link>
          ))}
        </nav>
        <Outlet />
      </div>
    </AppShell>
  );
}
