import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { RouteError, RouteNotFound } from "@/components/RouteError";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { listRoles, setRole } from "@/lib/governance.functions";
import { ORG_ROLES, ROLE_LABELS, type OrgRole } from "@/lib/authz/permissions";

export const Route = createFileRoute("/_authenticated/governance/roles")({
  component: Roles,
  errorComponent: RouteError,
  notFoundComponent: RouteNotFound,
});

function Roles() {
  const fn = useServerFn(listRoles);
  const setFn = useServerFn(setRole);
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["gov-roles"], queryFn: () => fn() });
  const m = useMutation({
    mutationFn: (v: { memberId: string; role: OrgRole; grant: boolean }) => setFn({ data: v }),
    onSuccess: (r, v) => {
      toast.success(`${r.label} ${v.grant ? "granted" : "removed"}`);
      qc.invalidateQueries({ queryKey: ["gov-roles"] });
      qc.invalidateQueries({ queryKey: ["governance-overview"] });
    },
    onError: (e) => toast.error((e as Error).message),
  });
  if (q.isLoading) return <Skeleton className="h-60 w-full rounded-xl" />;
  if (q.isError || !q.data) return <p className="text-sm text-muted-foreground">You don't have access to roles.</p>;
  const { members, assignable, canAssign } = q.data;
  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">
        People can hold more than one role. Only organization admins assign roles, every change is recorded in the audit log, and the last organization admin can't be removed.
      </p>
      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead className="bg-surface-2 text-left text-xs text-muted-foreground">
            <tr>
              <th className="p-3">Member</th>
              {ORG_ROLES.map((r) => (
                <th key={r} className="p-3 text-center">{ROLE_LABELS[r]}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {members.map((mem) => (
              <tr key={mem.id} className="border-t border-border">
                <td className="p-3">{mem.name}{mem.id === q.data.me ? <span className="ml-1 text-xs text-muted-foreground">(you)</span> : null}</td>
                {ORG_ROLES.map((r) => {
                  const has = mem.roles.includes(r);
                  const editable = canAssign && assignable.includes(r);
                  return (
                    <td key={r} className="p-3 text-center">
                      <Checkbox
                        checked={has}
                        disabled={!editable || m.isPending}
                        aria-label={`${ROLE_LABELS[r]} for ${mem.name}`}
                        onCheckedChange={(v) => m.mutate({ memberId: mem.id, role: r, grant: v === true })}
                      />
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
