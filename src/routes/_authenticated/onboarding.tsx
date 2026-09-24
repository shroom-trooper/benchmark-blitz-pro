import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { CalendarClock, CalendarPlus, Mail, ShieldCheck, Sparkles, Trophy, Zap } from "lucide-react";
import { toast } from "sonner";
import { getOnboarding, saveOnboarding, ONBOARDING_STEPS } from "@/lib/onboarding.functions";
import { updateNotificationPrefs } from "@/lib/calendar.functions";
import { getMyAccess } from "@/lib/governance.functions";
import { landingFor } from "@/lib/authz/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { LoadingSplash } from "@/components/LoadingSplash";
import { RouteError, RouteNotFound } from "@/components/RouteError";

export const Route = createFileRoute("/_authenticated/onboarding")({
  head: () => ({
    meta: [
      { title: "Get started · Benchmark" },
      { name: "description", content: "Set up Benchmark: add your interviews and get gamified training right before each one." },
      { property: "og:title", content: "Get started · Benchmark" },
      { property: "og:description", content: "Interview-triggered, gamified training for hiring managers." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Onboarding,
  errorComponent: RouteError,
  notFoundComponent: RouteNotFound,
});

const LEADS = [
  { label: "The evening before", minutes: 720 },
  { label: "Two hours before", minutes: 120 },
  { label: "One day before", minutes: 1440 },
];

function Onboarding() {
  const router = useRouter();
  const qc = useQueryClient();
  const getFn = useServerFn(getOnboarding);
  const saveFn = useServerFn(saveOnboarding);
  const prefsFn = useServerFn(updateNotificationPrefs);
  const accessFn = useServerFn(getMyAccess);
  const state = useQuery({ queryKey: ["onboarding"], queryFn: () => getFn() });
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [lead, setLead] = useState(720);

  useEffect(() => {
    if (!state.data) return;
    setStep(Math.min(state.data.step, ONBOARDING_STEPS - 1));
    setName((n) => n || state.data.name);
  }, [state.data]);

  const save = useMutation({
    mutationFn: async (next: number) => {
      await saveFn({ data: { step: next, ...(step === 1 ? { name: name.trim() } : {}) } });
      if (step === 5) {
        await prefsFn({
          data: {
            calendar_detection_enabled: true,
            email_preparation_enabled: true,
            email_refresher_enabled: true,
            preparation_lead_minutes: lead,
            refresher_lead_minutes: 15,
            quiet_hours_start: null,
            quiet_hours_end: null,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
          },
        });
      }
      return next;
    },
    onSuccess: (next) => setStep(next),
    onError: (e: Error) => toast.error(e.message),
  });

  const finish = useMutation({
    mutationFn: async () => {
      await saveFn({ data: { step: ONBOARDING_STEPS, complete: true } });
      return accessFn();
    },
    onSuccess: async (access) => {
      await qc.invalidateQueries();
      router.navigate({ to: landingFor(access.permissions), replace: true });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  /** Remember where the user is before leaving the flow, so they resume here. */
  async function leaveTo(to: "/settings/calendar" | "/interviews/new", resumeAt: number) {
    await saveFn({ data: { step: resumeAt } });
    router.navigate({ to });
  }

  if (state.isLoading) return <LoadingSplash />;
  if (state.data?.completed) {
    router.navigate({ to: "/home", replace: true });
    return <LoadingSplash />;
  }

  const next = () => save.mutate(step + 1);
  const busy = save.isPending || finish.isPending;

  const screens: { title: string; body: React.ReactNode; primary: React.ReactNode; secondary?: React.ReactNode }[] = [
    {
      title: "Welcome to Benchmark",
      body: <p>Short training right before your real interviews, so you walk in prepared. It takes about two minutes to set up.</p>,
      primary: <Button onClick={next} disabled={busy}>Get started</Button>,
    },
    {
      title: "What should we call you?",
      body: (
        <div className="space-y-2">
          <Label htmlFor="ob-name">Your name</Label>
          <Input id="ob-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Alex Rivera" />
        </div>
      ),
      primary: <Button onClick={next} disabled={busy || name.trim().length < 2}>Continue</Button>,
    },
    {
      title: "How Benchmark works",
      body: (
        <ol className="space-y-4">
          <HowItem icon={<CalendarClock className="size-5" />} title="An interview is detected or added" text="From your Google Calendar, or added by hand." />
          <HowItem icon={<Sparkles className="size-5" />} title="Training is prepared for that interview" text="Foundational interviewer skills, tuned to the role and stage." />
          <HowItem icon={<Trophy className="size-5" />} title="You earn points and level up" text="Complete training to gain points, levels, achievements and ranking." />
        </ol>
      ),
      primary: <Button onClick={next} disabled={busy}>Continue</Button>,
    },
    {
      title: "Connect your calendar",
      body: <p>Connect Google Calendar so Benchmark can spot interviews automatically. We only read event details, never change them. Or skip this and add interviews yourself.</p>,
      primary: <Button onClick={() => void leaveTo("/settings/calendar", 4)} disabled={busy}>Connect Google Calendar</Button>,
      secondary: <Button variant="ghost" onClick={next} disabled={busy}>Add interviews manually</Button>,
    },
    {
      title: "Gmail attachments (optional)",
      body: (
        <div className="flex gap-3">
          <Mail className="mt-0.5 size-5 shrink-0 text-muted-foreground" />
          <p>You can let Benchmark read CVs attached to the matching interview invitation. It's off by default, and you can turn it on later in Settings.</p>
        </div>
      ),
      primary: <Button onClick={next} disabled={busy}>Skip for now</Button>,
    },
    {
      title: "When should training arrive?",
      body: (
        <div className="grid gap-2">
          {LEADS.map((l) => (
            <button
              key={l.minutes}
              type="button"
              onClick={() => setLead(l.minutes)}
              className={`rounded-lg border p-3 text-left text-sm transition-colors ${lead === l.minutes ? "border-primary bg-primary/10" : "border-border hover:bg-surface-2"}`}
            >
              {l.label}
            </button>
          ))}
          <p className="text-xs text-muted-foreground">You'll also get a short refresher 15 minutes before.</p>
        </div>
      ),
      primary: <Button onClick={next} disabled={busy}>Continue</Button>,
    },
    {
      title: "Your privacy",
      body: (
        <div className="flex gap-3">
          <ShieldCheck className="mt-0.5 size-5 shrink-0 text-success" />
          <p>Benchmark measures your interviewing skills, never the candidate. Candidate details are used only to tailor your training and are deleted on a schedule. Your admins see progress, not your answers.</p>
        </div>
      ),
      primary: <Button onClick={next} disabled={busy}>I understand</Button>,
    },
    {
      title: "Add your first interview",
      body: <p>Add an upcoming interview to get your first training, or confirm one we found in your calendar. You can also do this later from Home.</p>,
      primary: (
        <Button onClick={() => void leaveTo("/interviews/new", 8)} disabled={busy}>
          <CalendarPlus className="size-4" /> Add an interview
        </Button>
      ),
      secondary: <Button variant="ghost" onClick={next} disabled={busy}>Later</Button>,
    },
    {
      title: "You're all set",
      body: <p>Your next interview and training will show on Home. Every completed training earns points toward your next level.</p>,
      primary: <Button onClick={() => finish.mutate()} disabled={busy}>{finish.isPending ? "Opening…" : "Go to Home"}</Button>,
    },
  ];

  const s = screens[step] ?? screens[0]!;

  return (
    <div className="grid min-h-dvh place-items-center bg-background px-4 py-12">
      <div className="w-full max-w-lg space-y-6">
        <Link to="/" className="flex items-center justify-center gap-2">
          <span className="grid size-9 place-items-center rounded-lg bg-primary text-primary-foreground">
            <Zap className="size-5" />
          </span>
          <span className="font-display text-2xl">Benchmark</span>
        </Link>
        <div className="space-y-2">
          <Progress value={((step + 1) / screens.length) * 100} className="h-1.5" />
          <p className="text-center text-xs text-muted-foreground">Step {step + 1} of {screens.length}</p>
        </div>
        <section className="space-y-5 rounded-xl border border-border bg-surface p-6">
          <h1 className="text-2xl">{s.title}</h1>
          <div className="text-sm leading-relaxed text-body">{s.body}</div>
          <div className="flex flex-wrap items-center gap-2">
            {s.primary}
            {s.secondary}
            {step > 0 && step < screens.length - 1 ? (
              <Button variant="link" className="ml-auto" onClick={() => setStep(step - 1)} disabled={busy}>
                Back
              </Button>
            ) : null}
          </div>
        </section>
      </div>
    </div>
  );
}

function HowItem({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return (
    <li className="flex gap-3">
      <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary/15 text-primary">{icon}</span>
      <div>
        <p className="font-medium text-foreground">{title}</p>
        <p className="text-xs text-muted-foreground">{text}</p>
      </div>
    </li>
  );
}
