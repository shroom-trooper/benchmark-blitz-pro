import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { acceptInvite, createGroup, updateDisplayName } from "@/lib/benchmark.functions";

type Track = "interviewer" | "recruiter";

const COPY = {
  interviewer: {
    heading: "Your interviewer group",
    blurb:
      "Training a hiring manager? Create an interviewer group and invite 1 manager — you'll see their progress and a private group board.",
    placeholder: "Acme hiring managers",
    created: "Group created — invite your manager",
  },
  recruiter: {
    heading: "Your recruiter group",
    blurb:
      "Training a recruiter? Create a recruiter group and invite 1 recruiter — you'll see their progress and a private group board.",
    placeholder: "Acme recruiters",
    created: "Group created — invite your recruiter",
  },
} as const;

export function GroupPanel({
  track,
  group,
  ownsGroup,
  pendingInvites,
  displayName,
}: {
  track: Track;
  group: { id: string; name: string } | null;
  ownsGroup: boolean;
  pendingInvites: { id: string; groupName: string }[];
  displayName: string;
}) {
  const copy = COPY[track];
  const qc = useQueryClient();
  const createFn = useServerFn(createGroup);
  const acceptFn = useServerFn(acceptInvite);
  const nameFn = useServerFn(updateDisplayName);
  const [groupName, setGroupName] = useState("");
  const [name, setName] = useState(displayName);

  const create = useMutation({
    mutationFn: () => createFn({ data: { name: groupName.trim(), track } }),
    onSuccess: async () => {
      await qc.invalidateQueries();
      toast.success(copy.created);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const accept = useMutation({
    mutationFn: (inviteId: string) => acceptFn({ data: { inviteId } }),
    onSuccess: async () => {
      await qc.invalidateQueries();
      toast.success("You've joined the group");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const saveName = useMutation({
    mutationFn: () => nameFn({ data: { name: name.trim() } }),
    onSuccess: async () => {
      await qc.invalidateQueries();
      toast.success("Display name updated");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <section className="grid gap-4 lg:grid-cols-2">
      <div className="rounded-xl border border-border bg-surface p-6">
        <h2 className="text-lg">{copy.heading}</h2>
        {group ? (
          <>
            <p className="mt-2 text-sm leading-relaxed text-body">
              You're {ownsGroup ? "the admin of" : "a member of"}{" "}
              <span className="font-medium text-foreground">{group.name}</span>.
            </p>
            <div className="mt-4 flex gap-2">
              {ownsGroup ? (
                <Button asChild size="sm">
                  <Link to="/admin">Open group console</Link>
                </Button>
              ) : null}
              <Button asChild size="sm" variant="outline">
                <Link to="/leaderboard">Group leaderboard</Link>
              </Button>
            </div>
          </>
        ) : pendingInvites.length ? (
          <div className="mt-3 space-y-2">
            <p className="text-sm text-body">You've been invited to join:</p>
            {pendingInvites.map((i) => (
              <div key={i.id} className="flex items-center gap-3 text-sm">
                <span className="font-medium">{i.groupName}</span>
                <Button
                  size="sm"
                  className="ml-auto"
                  onClick={() => accept.mutate(i.id)}
                  disabled={accept.isPending}
                >
                  Join
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <>
            <p className="mt-2 text-sm leading-relaxed text-body">{copy.blurb}</p>
            <div className="mt-4 flex gap-2">
              <Input
                placeholder={copy.placeholder}
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
              />
              <Button
                onClick={() => create.mutate()}
                disabled={groupName.trim().length < 2 || create.isPending}
              >
                Create group
              </Button>
            </div>
          </>
        )}
      </div>

      <div className="rounded-xl border border-border bg-surface p-6">
        <h2 className="text-lg">Public profile</h2>
        <p className="mt-2 text-sm text-body">This name appears on the global leaderboard.</p>
        <div className="mt-4 flex gap-2">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            aria-label="Display name"
          />
          <Button
            variant="outline"
            onClick={() => saveName.mutate()}
            disabled={name.trim().length < 2 || saveName.isPending}
          >
            Save
          </Button>
        </div>
      </div>
    </section>
  );
}
