import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Zap, MailCheck, TriangleAlert } from "lucide-react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { RouteError, RouteNotFound } from "@/components/RouteError";
import { getInviteByToken, startInviteSignIn, completeInvite } from "@/lib/invites.functions";

const searchSchema = z.object({ token: z.string().optional() });

export const Route = createFileRoute("/accept-invite")({
  validateSearch: (s: Record<string, unknown>) => searchSchema.parse(s),
  head: () => ({
    meta: [
      { title: "Join your group · Benchmark" },
      {
        name: "description",
        content:
          "Accept your Benchmark group invitation and start your weekly hiring simulations — no password needed.",
      },
      { property: "og:title", content: "Join your group · Benchmark" },
      {
        property: "og:description",
        content: "Accept your Benchmark invitation with a one-click sign-in link.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AcceptInvitePage,
  errorComponent: RouteError,
  notFoundComponent: RouteNotFound,
});

type Phase = "loading" | "invalid" | "ready" | "sent" | "joining" | "error";

function AcceptInvitePage() {
  const { token } = Route.useSearch();
  const router = useRouter();
  const inviteFn = useServerFn(getInviteByToken);
  const startFn = useServerFn(startInviteSignIn);
  const completeFn = useServerFn(completeInvite);

  const [phase, setPhase] = useState<Phase>("loading");
  const [message, setMessage] = useState("");
  const [groupName, setGroupName] = useState("");
  const [sentTo, setSentTo] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!token) {
        setPhase("invalid");
        setMessage("This invitation link is incomplete. Please use the link from your email.");
        return;
      }

      const { data: sessionData } = await supabase.auth.getSession();
      if (sessionData.session) {
        if (cancelled) return;
        setPhase("joining");
        const res = await completeFn({ data: { token } });
        if (cancelled) return;
        if (res.ok) {
          router.navigate({ to: res.track === "recruiter" ? "/recruiter" : "/hub" });
          return;
        }
        setPhase("error");
        setMessage(res.error);
        return;
      }

      const info = await inviteFn({ data: { token } });
      if (cancelled) return;
      if (info.state === "pending") {
        setGroupName(info.groupName);
        setPhase("ready");
        return;
      }
      setPhase("invalid");
      setMessage(
        info.state === "accepted"
          ? "This invitation has already been used. Sign in to continue your training."
          : info.state === "revoked"
            ? "This invitation is no longer active. Please contact your group owner to be invited again."
            : "We couldn't find this invitation. Please contact your group owner for a new link.",
      );
    })();
    return () => {
      cancelled = true;
    };
  }, [token, inviteFn, completeFn, router]);

  async function sendLink() {
    if (!token) return;
    setBusy(true);
    const res = await startFn({ data: { token } });
    setBusy(false);
    if (!res.ok) {
      setPhase("invalid");
      setMessage(res.error);
      return;
    }
    setSentTo(res.email);
    setPhase("sent");
  }

  return (
    <div className="grid min-h-dvh place-items-center bg-background px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 flex items-center justify-center gap-2">
          <span className="grid size-9 place-items-center rounded-lg bg-primary text-primary-foreground">
            <Zap className="size-5" />
          </span>
          <span className="font-display text-2xl">Benchmark</span>
        </div>

        <div className="rounded-xl border border-border bg-surface p-6">
          {phase === "loading" || phase === "joining" ? (
            <p className="text-center text-sm text-body">
              {phase === "joining" ? "Setting up your training…" : "Checking your invitation…"}
            </p>
          ) : phase === "ready" ? (
            <div className="space-y-5">
              <div className="text-center">
                <h1 className="text-xl font-bold tracking-tight">
                  You&rsquo;re invited to {groupName}
                </h1>
                <p className="mt-2 text-sm leading-relaxed text-body">
                  No password needed. We&rsquo;ll email you a one-click link that signs you in and
                  takes you straight to your first training session.
                </p>
              </div>
              <Button className="w-full" onClick={sendLink} disabled={busy}>
                {busy ? "Sending link…" : "Email me my sign-in link"}
              </Button>
            </div>
          ) : phase === "sent" ? (
            <div className="space-y-4 text-center">
              <span className="mx-auto grid size-12 place-items-center rounded-full bg-primary/15 text-primary">
                <MailCheck className="size-6" />
              </span>
              <h1 className="text-xl font-bold tracking-tight">Check your inbox</h1>
              <p className="text-sm leading-relaxed text-body">
                We sent a sign-in link to{" "}
                <span className="font-medium text-foreground">{sentTo}</span>. Open it on this
                device to join {groupName || "your group"}. Can&rsquo;t find it? Check your spam
                folder.
              </p>
              <Button variant="outline" className="w-full" onClick={sendLink} disabled={busy}>
                {busy ? "Sending…" : "Send it again"}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-start gap-3 rounded-lg border border-warning/40 bg-warning/10 p-4">
                <TriangleAlert className="mt-0.5 size-4 shrink-0 text-warning" />
                <p className="text-sm leading-relaxed text-foreground">{message}</p>
              </div>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => router.navigate({ to: "/auth" })}
              >
                Go to sign in
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
