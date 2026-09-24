import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { CalendarCheck2, RefreshCw, ShieldCheck, Unplug } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { RouteError, RouteNotFound } from "@/components/RouteError";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  completeOutlookConnect,
  disconnectOutlook,
  getCalendarStatus,
  startOutlookConnect,
  syncCalendarNow,
  updateNotificationPrefs,
} from "@/lib/calendar.functions";
import { track } from "@/lib/analytics";

export const Route = createFileRoute("/_authenticated/settings/calendar")({
  head: () => ({
    meta: [
      { title: "Calendar & notifications · Benchmark" },
      { name: "description", content: "Connect Outlook to detect interviews and schedule preparation." },
      { property: "og:title", content: "Calendar & notifications · Benchmark" },
      { property: "og:description", content: "Automatic interview preparation from your Outlook calendar." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: CalendarSettings,
  errorComponent: RouteError,
  notFoundComponent: RouteNotFound,
});

function waitForPopup(popup: Window) {
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
        event.data?.connectorId !== "microsoft_outlook" ||
        (type !== "appUserConnectorOAuthComplete" && type !== "appUserConnectorOAuthFailed")
      )
        return;
      cleanup();
      if (type === "appUserConnectorOAuthComplete")
        resolve(typeof event.data?.code === "string" ? event.data.code : null);
      else reject(new Error("The Outlook connection didn't complete."));
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

function CalendarSettings() {
  const qc = useQueryClient();
  const statusFn = useServerFn(getCalendarStatus);
  const startFn = useServerFn(startOutlookConnect);
  const completeFn = useServerFn(completeOutlookConnect);
  const syncFn = useServerFn(syncCalendarNow);
  const discFn = useServerFn(disconnectOutlook);
  const prefsFn = useServerFn(updateNotificationPrefs);
  const q = useQuery({ queryKey: ["calendar-status"], queryFn: () => statusFn() });

  const connect = useMutation({
    mutationFn: async () => {
      const popup = window.open("", "benchmark-outlook", "width=600,height=720");
      if (!popup) throw new Error("Your browser blocked the sign-in window. Allow popups and try again.");
      let code: string | null;
      try {
        const { authorizationUrl } = await startFn();
        const done = waitForPopup(popup);
        popup.location.href = authorizationUrl;
        code = await done;
      } catch (e) {
        popup.close();
        throw e;
      }
      if (!code) throw new Error("Background sync needs offline access enabled on the workspace Outlook app.");
      return completeFn({ data: { code } });
    },
    onSuccess: (r) => {
      const reconnect = Boolean(q.data?.connection);
      toast.success(reconnect ? "Reconnected to Outlook" : "Outlook connected — we'll look for upcoming interviews.");
      track("calendar_connected", { provider: "microsoft", reconnect, sync: r.sync });
      qc.invalidateQueries();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const sync = useMutation({
    mutationFn: () => syncFn(),
    onSuccess: (r) => {
      track("calendar_sync_completed", { status: r.status, events: r.processed });
      if (r.status === "ok") toast.success(`Calendar synced (${r.processed} events checked)`);
      else if (r.status === "needs_reauthorization") toast.error("Your Outlook access needs to be renewed.");
      else toast.error("Sync didn't complete. We'll retry automatically.");
      qc.invalidateQueries();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const disconnect = useMutation({
    mutationFn: () => discFn(),
    onSuccess: () => {
      track("calendar_disconnected", { provider: "microsoft" });
      toast.success("Outlook disconnected. Future reminders were cancelled.");
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
  const { configured, connection } = q.data;
  const needsReauth = connection?.status === "needs_reauthorization";

  return (
    <AppShell>
      <div className="mx-auto max-w-3xl space-y-6">
        <div>
          <h1 className="text-3xl">Calendar & notifications</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Connect Outlook and Benchmark will spot upcoming interviews, ask you to confirm them, and have your
            preparation ready in time. Adding interviews by hand keeps working either way.
          </p>
        </div>

        <section className="rounded-xl border border-border bg-surface p-5">
          <div className="flex flex-wrap items-center gap-4">
            <CalendarCheck2 className="size-6 text-primary" />
            <div className="min-w-0 flex-1">
              <p className="font-medium">Microsoft Outlook</p>
              <p className="text-sm text-muted-foreground">
                {!configured
                  ? "Setup needed — a workspace admin must enable the Outlook connection first."
                  : !connection
                    ? "Not connected"
                    : needsReauth
                      ? "Your Outlook access needs to be renewed."
                      : `Connected${connection.provider_email ? ` as ${connection.provider_email}` : ""} · last sync ${fmt(connection.last_successful_sync_at)}`}
              </p>
            </div>
            {configured && (!connection || needsReauth) ? (
              <Button onClick={() => connect.mutate()} disabled={connect.isPending}>
                {connect.isPending ? "Connecting…" : needsReauth ? "Reconnect Outlook" : "Connect Outlook"}
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
                <Button variant="ghost" onClick={() => disconnect.mutate()} disabled={disconnect.isPending}>
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
              Read-only calendar access only — no email, files or contacts. We look at the next 30 days, and we only
              read attachments on an interview invite after you approve them. Attachment text is deleted 7 days after
              the interview, or straight away if you disconnect.
            </p>
          </div>
        </section>

        <PrefsForm prefs={q.data.prefs} onSave={(p) => prefsFn({ data: p })} />
      </div>
    </AppShell>
  );
}

type PrefsShape = Parameters<typeof updateNotificationPrefs>[0]["data"];

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
  const row = (label: string, hint: string, key: keyof PrefsShape) => (
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
