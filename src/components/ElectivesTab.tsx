import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import {
  Check,
  Code,
  FileText,
  Palette,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Users,
} from "lucide-react";
import { getGroupElectives, setGroupElective } from "@/lib/benchmark.functions";
import { CATEGORY_META, CATEGORY_ORDER } from "@/lib/electives";
import type { ElectiveCategory } from "@/lib/electives/types";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

const CATEGORY_ICONS: Record<ElectiveCategory, React.ReactNode> = {
  functional: <Code className="size-5" />,
  operational: <Palette className="size-5" />,
  playbook: <TrendingUp className="size-5" />,
  compliance: <ShieldCheck className="size-5" />,
};

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
            <div className="grid gap-4 md:grid-cols-2">
              {modules.map((m) => {
                const Icon = CATEGORY_ICONS[category];
                return (
                  <article
                    key={m.slug}
                    className={cn(
                      "group relative flex flex-col gap-4 rounded-xl border p-5 backdrop-blur-sm transition-all duration-200",
                      m.enabled
                        ? "border-indigo-500/30 bg-indigo-950/10 shadow-[0_0_20px_-6px_rgba(99,102,241,0.25)]"
                        : "border-zinc-800 bg-zinc-900/50 opacity-60",
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div
                          className={cn(
                            "flex size-10 shrink-0 items-center justify-center rounded-lg border transition-colors",
                            m.enabled
                              ? "border-indigo-500/30 bg-indigo-500/10 text-indigo-300"
                              : "border-zinc-700 bg-zinc-800 text-zinc-400",
                          )}
                        >
                          {Icon}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-semibold text-zinc-100">
                              {m.title}
                            </h4>
                            {m.enabled ? (
                              <Badge className="bg-emerald-500/15 px-1.5 py-0 text-[10px] font-semibold text-emerald-400 hover:bg-emerald-500/15">
                                Active
                              </Badge>
                            ) : null}
                          </div>
                          <span className="mt-1 inline-flex items-center rounded-full bg-zinc-800 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                            {m.audience}
                          </span>
                        </div>
                      </div>
                      <Switch
                        checked={m.enabled}
                        disabled={mutation.isPending}
                        onCheckedChange={() =>
                          mutation.mutate({ moduleSlug: m.slug, on: !m.enabled })
                        }
                        aria-label={m.enabled ? `Disable ${m.title}` : `Enable ${m.title}`}
                      />
                    </div>

                    <p className="text-sm leading-relaxed text-zinc-300">{m.summary}</p>

                    <ul className="space-y-2">
                      {m.lessons.map((l) => (
                        <li key={l.slug} className="flex items-start gap-2 text-xs text-zinc-400">
                          <Check className="mt-0.5 size-3.5 shrink-0 text-emerald-500/80" />
                          <span>{l.title}</span>
                        </li>
                      ))}
                    </ul>

                    <button
                      type="button"
                      className={cn(
                        "mt-auto flex items-center gap-2 rounded-lg border border-zinc-700/50 bg-zinc-800/80 p-3 text-left text-xs text-zinc-300 transition-colors hover:border-indigo-500/30 hover:bg-zinc-700/80 hover:text-zinc-100",
                        !m.enabled && "pointer-events-none opacity-70",
                      )}
                      disabled={!m.enabled}
                      onClick={() => toast.info(`${m.artifact} template preview coming soon.`)}
                    >
                      <FileText className="size-3.5 shrink-0 text-indigo-400" />
                      <span className="flex-1">
                        <span className="font-medium">Artifact:</span> {m.artifact}
                      </span>
                      <Sparkles className="size-3.5 shrink-0 text-zinc-500 transition-colors group-hover:text-indigo-300" />
                    </button>

                    <div className="flex items-center gap-2 text-xs text-zinc-400">
                      <Users className="size-3.5 shrink-0" />
                      <span>
                        {m.completions} completion{m.completions === 1 ? "" : "s"} by your team
                      </span>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}
