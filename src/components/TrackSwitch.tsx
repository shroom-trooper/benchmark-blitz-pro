import { useNavigate } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { useMe } from "@/components/AppShell";
import { setActiveTrack } from "@/lib/benchmark.functions";
import { TRACK_LABELS, type Track } from "@/lib/gamification";
import { Button } from "@/components/ui/button";

/** Segmented control shown only to members entitled to both tracks. */
export function TrackSwitch({ active }: { active: Track }) {
  const { data: me } = useMe();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const switchFn = useServerFn(setActiveTrack);

  const mutation = useMutation({
    mutationFn: (track: Track) => switchFn({ data: { track } }),
    onSuccess: async (_res, track) => {
      await qc.invalidateQueries();
      navigate({ to: track === "recruiter" ? "/recruiter" : "/hub" });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const allowed = (me?.allowedTracks ?? ["interviewer"]) as Track[];
  if (allowed.length < 2) return null;

  return (
    <div className="inline-flex rounded-lg border border-border bg-surface p-1">
      {allowed.map((t) => (
        <Button
          key={t}
          size="sm"
          variant={t === active ? "default" : "ghost"}
          disabled={mutation.isPending}
          onClick={() => (t === active ? null : mutation.mutate(t))}
        >
          {TRACK_LABELS[t]}
        </Button>
      ))}
    </div>
  );
}
