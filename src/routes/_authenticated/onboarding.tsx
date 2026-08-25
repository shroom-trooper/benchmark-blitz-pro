import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Users, User, Zap } from "lucide-react";
import { toast } from "sonner";
import { useMe } from "@/components/AppShell";
import {
  acceptInvite,
  createGroup,
  updateDisplayName,
} from "@/lib/benchmark.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/_authenticated/onboarding")({
  head: () => ({
    meta: [
      { title: "Set up your training · Benchmark" },
      {
        name: "description",
        content:
          "Choose a display name for the public leaderboard, then train solo or create a group to track your managers.",
      },
      { property: "og:title", content: "Set up your training · Benchmark" },
      {
        property: "og:description",
        content: "Train solo or create a group of up to three managers.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Onboarding,
});

function Onboarding() {
  const { data: me } = useMe();
  const router = useRouter();
  const qc = useQueryClient();
  const nameFn = useServerFn(updateDisplayName);
  const groupFn = useServerFn(createGroup);
  const acceptFn = useServerFn(acceptInvite);

  const [displayName, setDisplayName] = useState("");
  const [groupName, setGroupName] = useState("");
  const [mode, setMode] = useState<"solo" | "group">("solo");

  const currentName = displayName || me?.profile?.display_name || "";

  const finish = useMutation({
    mutationFn: async () => {
      if (currentName.trim().length >= 2) {
        await nameFn({ data: { name: currentName.trim() } });
      }
      if (mode === "group") {
        await groupFn({ data: { name: groupName.trim() } });
      }
    },
    onSuccess: async () => {
      await qc.invalidateQueries();
      toast.success(mode === "group" ? "Group created" : "You're all set");
      router.navigate({ to: mode === "group" ? "/admin" : "/hub" });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const accept = useMutation({
    mutationFn: (inviteId: string) => acceptFn({ data: { inviteId } }),
    onSuccess: async () => {
      await qc.invalidateQueries();
      toast.success("You've joined the group");
      router.navigate({ to: "/hub" });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="grid min-h-dvh place-items-center bg-background px-4 py-12">
      <div className="w-full max-w-xl space-y-6">
        <div className="flex items-center justify-center gap-2">
          <span className="grid size-9 place-items-center rounded-lg bg-primary text-primary-foreground">
            <Zap className="size-5" />
          </span>
          <span className="font-display text-2xl font-semibold">Benchmark</span>
        </div>

        {me?.pendingInvites?.length ? (
          <section className="rounded-xl border border-primary/40 bg-primary/10 p-5">
            <h2 className="font-display text-lg font-semibold">You've been invited</h2>
            {me.pendingInvites.map((i) => (
              <div key={i.id} className="mt-3 flex items-center gap-3 text-sm">
                <span>{i.groupName}</span>
                <Button
                  size="sm"
                  className="ml-auto"
                  onClick={() => accept.mutate(i.id)}
                  disabled={accept.isPending}
                >
                  Join group
                </Button>
              </div>
            ))}
          </section>
        ) : null}

        <section className="space-y-5 rounded-xl border border-border bg-surface p-6">
          <div>
            <h1 className="font-display text-2xl font-semibold">How will you use Benchmark?</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              You can change this later — solo players can create a group any time.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="display-name">Display name (shown on the public leaderboard)</Label>
            <Input
              id="display-name"
              value={currentName}
              placeholder="Alex R."
              onChange={(e) => setDisplayName(e.target.value)}
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <Choice
              active={mode === "solo"}
              onClick={() => setMode("solo")}
              icon={<User className="size-5" />}
              title="Just train me"
              body="Weekly simulations, XP, streaks and a spot on the public leaderboard."
            />
            <Choice
              active={mode === "group"}
              onClick={() => setMode("group")}
              icon={<Users className="size-5" />}
              title="Create a group"
              body="Invite up to 3 managers, see their progress and a private group board."
            />
          </div>

          {mode === "group" ? (
            <div className="space-y-2">
              <Label htmlFor="group-name">Group name</Label>
              <Input
                id="group-name"
                value={groupName}
                placeholder="Acme hiring managers"
                onChange={(e) => setGroupName(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Free tier: 3 members plus you. Larger teams are coming soon.
              </p>
            </div>
          ) : null}

          <Button
            className="w-full"
            disabled={
              finish.isPending ||
              currentName.trim().length < 2 ||
              (mode === "group" && groupName.trim().length < 2)
            }
            onClick={() => finish.mutate()}
          >
            {finish.isPending ? "Setting up…" : "Continue"}
          </Button>
        </section>
      </div>
    </div>
  );
}

function Choice({
  active,
  onClick,
  icon,
  title,
  body,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-xl border p-4 text-left transition-colors ${
        active
          ? "border-primary bg-primary/10"
          : "border-border bg-background hover:bg-surface-2"
      }`}
    >
      <span className={active ? "text-primary" : "text-muted-foreground"}>{icon}</span>
      <p className="mt-2 font-semibold">{title}</p>
      <p className="mt-1 text-xs text-muted-foreground">{body}</p>
    </button>
  );
}
