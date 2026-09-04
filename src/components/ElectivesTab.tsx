import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { getGroupElectives, setGroupElective } from "@/lib/benchmark.functions";
import { CATEGORY_META, CATEGORY_ORDER } from "@/lib/electives";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export function ElectivesTab() {
  const loadFn = useServerFn(getGroupElectives);
  const setFn = useServerFn(setGroupElective);
  const queryClient = useQueryClient();

  const query = useQuery({ queryKey: ["group-electives"], queryFn: () => loadFn() });

  const mutation = useMutation({
    mutationFn: (vars: { moduleSlug: string; on: boolean }) => setFn({ data: vars }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["group-electives"] });
      queryClient.invalidateQueries({ queryKey: ["electives"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (query.isLoading) return <Skeleton className="h-96 w-full rounded-xl" />;

  const data = query.data!;

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-lg">Elective tracks</h2>
        <p className="mt-1 text-sm text-body">
          {data.curated
            ? "Your team sees only the tracks switched on below."
            : "Nothing switched on yet, so your team can see the whole library. Switch tracks on to focus them."}
        </p>
      </div>

      {CATEGORY_ORDER.map((category) => {
        const modules = data.modules.filter((m) => m.category === category);
        if (!modules.length) return null;
        const meta = CATEGORY_META[category];
        return (
          <section key={category} className="space-y-3">
            <div>
              <h3 className="text-base">{meta.name}</h3>
              <p className="text-sm text-body">{meta.blurb}</p>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              {modules.map((m) => (
                <article
                  key={m.slug}
                  className={`rounded-xl border p-5 ${
                    m.enabled ? "border-primary/40 bg-primary/5" : "border-border bg-surface"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h4 className="text-sm font-semibold">{m.title}</h4>
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">
                        {m.audience}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant={m.enabled ? "outline" : "default"}
                      disabled={mutation.isPending}
                      onClick={() =>
                        mutation.mutate({ moduleSlug: m.slug, on: !m.enabled })
                      }
                    >
                      {m.enabled ? "Switch off" : "Switch on"}
                    </Button>
                  </div>
                  <p className="mt-3 text-sm text-body">{m.summary}</p>
                  <ul className="mt-3 space-y-1 text-xs text-muted-foreground">
                    {m.lessons.map((l) => (
                      <li key={l.slug}>· {l.title}</li>
                    ))}
                  </ul>
                  <p className="mt-3 text-xs text-muted-foreground">
                    Artifact: {m.artifact} · {m.completions} completion
                    {m.completions === 1 ? "" : "s"} by your team
                  </p>
                </article>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
