import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { CalendarCheck2, Mail, RefreshCw, ShieldCheck, Unplug } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { RouteError, RouteNotFound } from "@/components/RouteError";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  completeGoogleConnect,
  disconnectGoogle,
  getCalendarStatus,
  startGoogleConnect,
  syncCalendarNow,
  updateNotificationPrefs,
} from "@/lib/calendar.functions";
import { track } from "@/lib/analytics";

export const Route = createFileRoute("/_authenticated/settings/calendar")({
  head: () => ({
    meta: [
      { title: "Calendar & notifications · Benchmark" },
      { name: "description", content: "Connect Google Calendar to detect interviews and schedule preparation." },
      { property: "og:title", content: "Calendar & notifications · Benchmark" },
      { property: "og:description", content: "Automatic interview preparation from your Google Calendar." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: CalendarSettings,
  errorComponent: RouteError,
  notFoundComponent: RouteNotFound,
});

function waitForPopup(popup: Window, connectorId: string) {
  return new Promise<string | null>((resolve, reject) => {
    let poll: number | undefined;
    const cleanup = () => {
      window.removeEventListener("message", onMessage);
      if (poll !== undefined) window.clearInterval(poll);
    };
    const onMessage = (event: MessageEvent) => {
      const type = event.data?.type;
      if (
        event.origin !== window.location.origin ||
        event.source !== popup ||
        event.data?.connectorId !== connectorId ||
        (type !== "appUserConnectorOAuthComplete" && type !== "appUserConnectorOAuthFailed")
      )
        return;
      cleanup();
      if (type === "appUserConnectorOAuthComplete")
        resolve(typeof event.data?.code === "string" ? event.data.code : null);
      else reject(new Error("The Google connection didn't complete."));
    };
    window.addEventListener("message", onMessage);
    poll = window.setInterval(() => {
      if (!popup.closed) return;
      cleanup();
      reject(new Error("The sign-in window was closed before finishing."));
    }, 500);
  });
}

const fmt = (iso: string | null | undefined) =>
  iso ? new Date(iso).toLocaleString(undefined, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "never";

type Kind = "calendar" | "gmail";
const CONNECTOR: Record<Kind, string> = { calendar: "google_calendar", gmail: "google_mail" };

function CalendarSettings() {
  const qc = useQueryClient();
  const statusFn = useServerFn(getCalendarStatus);
  const startFn = useServerFn(startGoogleConnect);
  const completeFn = useServerFn(completeGoogleConnect);
  const syncFn = useServerFn(syncCalendarNow);
  const discFn = useServerFn(disconnectGoogle);
  const prefsFn = useServerFn(updateNotificationPrefs);
  const q = useQuery({ queryKey: ["calendar-status"], queryFn: () => statusFn() });
  const [gmailExplained, setGmailExplained] = useState(false);

  const connect = useMutation({
    mutationFn: async (kind: Kind) => {
      const popup = window.open("", "benchmark-google", "width=600,height=720");
      if (!popup) throw new Error("Your browser blocked the sign-in window. Allow popups and try again.");
      let code: string | null;
      try {
        const { authorizationUrl } = await startFn({ data: { kind } });
        const done = waitForPopup(popup, CONNECTOR[kind]);
        popup.location.href = authorizationUrl;
        code = await done;
      } catch (e) {
        popup.close();
        throw e;
      }
      if (!code) throw new Error("Background access needs offline access enabled on the workspace Google app.");
      await completeFn({ data: { kind, code } });
      return kind;
    },
    onSuccess: (kind) => {
      if (kind === "gmail") {
        toast.success("Gmail invitation attachments turned on");
        track("gmail_connected", { provider: "google" });
      } else {
        toast.success(q.data?.connection ? "Reconnected to Google Calendar" : "Google Calendar connected — we'll look for upcoming interviews.");
        track("calendar_connected", { provider: "google" });
      }
      setGmailExplained(false);
      qc.invalidateQueries();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const sync = useMutation({
    mutationFn: () => syncFn(),
    onSuccess: (r) => {
      track("calendar_sync_completed", { status: r.status, events: r.processed });
      if (r.status === "ok") toast.success(`Calendar synced (${r.processed} events checked)`);
      else if (r.status === "needs_reauthorization") toast.error("Your Google Calendar access needs to be renewed.");
      else toast.error("Sync didn't complete. We'll retry automatically.");
      qc.invalidateQueries();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const disconnect = useMutation({
    mutationFn: async (kind: Kind) => {
      await discFn({ data: { kind } });
      return kind;
    },
    onSuccess: (kind) => {
      track(kind === "gmail" ? "gmail_disconnected" : "calendar_disconnected", { provider: "google" });
      toast.success(kind === "gmail" ? "Gmail disconnected. Invitation attachment text was deleted." : "Google Calendar disconnected. Future reminders were cancelled.");
      qc.invalidateQueries();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (q.isLoading || !q.data)
    return (
      <AppShell>
        <Skeleton className="mx-auto h-72 max-w-3xl rounded-xl" />
      </AppShell>
    );
  const { configured, connection, gmailConfigured, gmailConnected } = q.data;
  const needsReauth = connection?.status === "needs_reauthorization";

  return (
    <AppShell>
      <div className="mx-auto max-w-3xl space-y-6">
        <div>
          <h1 className="text-3xl">Calendar & notifications</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Connect Google Calendar and Benchmark will spot upcoming interviews, ask you to confirm them, and have your
            preparation ready in time. Adding interviews by hand keeps working either way.
          </p>
        </div>

        <section className="rounded-xl border border-border bg-surface p-5">
          <div className="flex flex-wrap items-center gap-4">
            <CalendarCheck2 className="size-6 text-primary" />
            <div className="min-w-0 flex-1">
              <p className="font-medium">Google Calendar</p>
              <p className="text-sm text-muted-foreground">
                {!configured
                  ? "Setup needed — a workspace admin must enable the Google Calendar connection first."
                  : !connection
                    ? "Not connected"
                    : needsReauth
                      ? "Your Google Calendar access needs to be renewed."
                      : `Connected${connection.provider_email ? ` as ${connection.provider_email}` : ""} · last sync ${fmt(connection.last_successful_sync_at)}`}
              </p>
            </div>
            {configured && (!connection || needsReauth) ? (
              <Button onClick={() => connect.mutate("calendar")} disabled={connect.isPending}>
                {needsReauth ? "Reconnect Google Calendar" : "Connect Google Calendar"}
              </Button>
            ) : null}
            {!configured ? (
              <Button disabled variant="outline">
                Setup needed
              </Button>
            ) : null}
            {connection && !needsReauth ? (
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => sync.mutate()} disabled={sync.isPending}>
                  <RefreshCw className={`size-4 ${sync.isPending ? "animate-spin" : ""}`} /> Sync now
                </Button>
                <Button variant="ghost" onClick={() => disconnect.mutate("calendar")} disabled={disconnect.isPending}>
                  <Unplug className="size-4" /> Disconnect
                </Button>
              </div>
            ) : null}
          </div>
          {connection?.status === "error" ? (
            <p className="mt-3 text-sm text-destructive">The last sync failed. We'll retry automatically.</p>
          ) : null}
          <div className="mt-4 flex gap-2 rounded-lg bg-surface-2 p-3 text-xs text-muted-foreground">
            <ShieldCheck className="size-4 shrink-0" />
            <p>
              Read-only access to your calendar events for the next 30 days. Files linked from an event (Google Docs or
              Drive) are shown as links only — they are never opened automatically.
            </p>
          </div>
        </section>

        <section className="rounded-xl border border-border bg-surface p-5">
          <div className="flex flex-wrap items-center gap-4">
            <Mail className="size-6 text-primary" />
            <div className="min-w-0 flex-1">
              <p className="font-medium">Gmail invitation attachments <span className="text-xs text-muted-foreground">(optional)</span></p>
              <p className="text-sm text-muted-foreground">
                {!gmailConfigured
                  ? "Setup needed — a workspace admin must enable the Gmail connection first."
                  : gmailConnected
                    ? "On — attachments on matching interview invitations can be offered to you."
                    : "Off"}
              </p>
            </div>
            {gmailConfigured && !gmailConnected && !gmailExplained ? (
              <Button variant="outline" onClick={() => setGmailExplained(true)} disabled={!connection}>
                Turn on
              </Button>
            ) : null}
            {gmailConnected ? (
              <Button variant="ghost" onClick={() => disconnect.mutate("gmail")} disabled={disconnect.isPending}>
                <Unplug className="size-4" /> Disconnect Gmail
              </Button>
            ) : null}
          </div>
          {gmailConfigured && !gmailConnected && !connection ? (
            <p className="mt-2 text-xs text-muted-foreground">Connect Google Calendar first.</p>
          ) : null}
          {gmailExplained && !gmailConnected ? (
            <div className="mt-4 space-y-3 rounded-lg border border-border bg-surface-2 p-4 text-sm">
              <p className="font-medium">Before you continue</p>
              <ul className="list-disc space-y-1 pl-5 text-muted-foreground">
                <li>This is optional — everything else keeps working without it.</li>
                <li>Benchmark only looks for the invitation email of an interview it has already found in your calendar.</li>
                <li>It only takes files attached to that one invitation (such as a CV or job description), and only the ones you approve.</li>
                <li>It never reads your other emails, threads, replies or recruiter–candidate conversations, never searches by candidate name, and never trains a model on your email.</li>
                <li>
                  To be clear: Google's permission for this is read-only access to your whole mailbox. Benchmark limits itself
                  to the invitation match described above on its own side.
                </li>
              </ul>
              <div className="flex gap-2">
                <Button onClick={() => connect.mutate("gmail")} disabled={connect.isPending}>
                  Continue to Google
                </Button>
                <Button variant="ghost" onClick={() => setGmailExplained(false)}>
                  Not now
                </Button>
              </div>
            </div>
          ) : null}
        </section>

        <PrefsForm prefs={q.data.prefs} onSave={(p) => prefsFn({ data: p })} />
      </div>
    </AppShell>
  );
}

type PrefsShape = {
  calendar_detection_enabled: boolean;
  email_preparation_enabled: boolean;
  email_refresher_enabled: boolean;
  preparation_lead_minutes: number;
  refresher_lead_minutes: number;
  quiet_hours_start: number | null;
  quiet_hours_end: number | null;
  timezone: string;
};

function PrefsForm({
  prefs,
  onSave,
}: {
  prefs: Awaited<ReturnType<typeof getCalendarStatus>>["prefs"];
  onSave: (p: PrefsShape) => Promise<unknown>;
}) {
  const qc = useQueryClient();
  const [p, setP] = useState<PrefsShape>({
    calendar_detection_enabled: true,
    email_preparation_enabled: false,
    email_refresher_enabled: false,
    preparation_lead_minutes: 1440,
    refresher_lead_minutes: 20,
    quiet_hours_start: 21,
    quiet_hours_end: 7,
    timezone: "UTC",
  });
  useEffect(() => {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
    if (prefs)
      setP({
        calendar_detection_enabled: prefs.calendar_detection_enabled,
        email_preparation_enabled: prefs.email_preparation_enabled,
        email_refresher_enabled: prefs.email_refresher_enabled,
        preparation_lead_minutes: prefs.preparation_lead_minutes,
        refresher_lead_minutes: prefs.refresher_lead_minutes,
        quiet_hours_start: prefs.quiet_hours_start,
        quiet_hours_end: prefs.quiet_hours_end,
        timezone: prefs.timezone === "UTC" ? tz : prefs.timezone,
      });
    else setP((x) => ({ ...x, timezone: tz }));
  }, [prefs]);
  const save = useMutation({
    mutationFn: () => onSave(p),
    onSuccess: () => {
      toast.success("Preferences saved");
      qc.invalidateQueries({ queryKey: ["calendar-status"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const row = (label: string, hint: string, key: "calendar_detection_enabled" | "email_preparation_enabled" | "email_refresher_enabled") => (
    <div className="flex items-start justify-between gap-4 py-3">
      <div>
        <Label htmlFor={key}>{label}</Label>
        <p className="text-xs text-muted-foreground">{hint}</p>
      </div>
      <Switch id={key} checked={Boolean(p[key])} onCheckedChange={(v) => setP({ ...p, [key]: v })} />
    </div>
  );
  return (
    <section className="rounded-xl border border-border bg-surface p-5">
      <h2 className="font-display text-lg">Notifications</h2>
      <div className="divide-y divide-border">
        {row("Detect interviews in my calendar", "Look for likely interviews when syncing.", "calendar_detection_enabled")}
        {row("Email my preparation", "Sent before each confirmed interview.", "email_preparation_enabled")}
        {row("Email a just-in-time refresher", "Three short reminders right before you start.", "email_refresher_enabled")}
      </div>
      <div className="mt-3 grid gap-4 sm:grid-cols-2">
        <div>
          <Label>Preparation lead time (hours)</Label>
          <Input
            type="number"
            min={1}
            max={168}
            value={Math.round(p.preparation_lead_minutes / 60)}
            onChange={(e) => setP({ ...p, preparation_lead_minutes: Math.max(1, Number(e.target.value) || 24) * 60 })}
          />
        </div>
        <div>
          <Label>Refresher lead time (minutes)</Label>
          <Input
            type="number"
            min={5}
            max={240}
            value={p.refresher_lead_minutes}
            onChange={(e) => setP({ ...p, refresher_lead_minutes: Math.min(240, Math.max(5, Number(e.target.value) || 20)) })}
          />
        </div>
        <div>
          <Label>Quiet hours from</Label>
          <Input
            type="number"
            min={0}
            max={23}
            value={p.quiet_hours_start ?? ""}
            onChange={(e) => setP({ ...p, quiet_hours_start: e.target.value === "" ? null : Number(e.target.value) })}
          />
        </div>
        <div>
          <Label>Quiet hours until</Label>
          <Input
            type="number"
            min={0}
            max={23}
            value={p.quiet_hours_end ?? ""}
            onChange={(e) => setP({ ...p, quiet_hours_end: e.target.value === "" ? null : Number(e.target.value) })}
          />
        </div>
      </div>
      <p className="mt-2 text-xs text-muted-foreground">Time zone: {p.timezone}</p>
      <Button className="mt-4" onClick={() => save.mutate()} disabled={save.isPending}>
        Save preferences
      </Button>
    </section>
  );
}
