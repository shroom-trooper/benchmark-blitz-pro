import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { createInterview } from "@/lib/readiness.functions";
import { COMMON_COMPETENCIES, INTERVIEW_STAGES } from "@/lib/readiness/taxonomy";
import { track } from "@/lib/analytics";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RouteError, RouteNotFound } from "@/components/RouteError";

export const Route = createFileRoute("/_authenticated/interviews/new")({
  head: () => ({
    meta: [
      { title: "Add interview · Benchmark" },
      { name: "description", content: "Add an upcoming interview to get tailored preparation." },
      { property: "og:title", content: "Add interview · Benchmark" },
      { property: "og:description", content: "Tailored interviewer preparation in minutes." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: NewInterview,
  errorComponent: RouteError,
  notFoundComponent: RouteNotFound,
});

function NewInterview() {
  const fn = useServerFn(createInterview);
  const nav = useNavigate();
  const qc = useQueryClient();
  const [role, setRole] = useState("");
  const [candidate, setCandidate] = useState("");
  const [stage, setStage] = useState<string>(INTERVIEW_STAGES[1]);
  const [customStage, setCustomStage] = useState("");
  const [when, setWhen] = useState("");
  const [comps, setComps] = useState<string[]>([]);
  const [customComp, setCustomComp] = useState("");
  const [resp, setResp] = useState("");
  const [jd, setJd] = useState("");
  const [cv, setCv] = useState("");
  const [principles, setPrinciples] = useState("");

  const m = useMutation({
    mutationFn: () =>
      fn({
        data: {
          roleTitle: role,
          candidateDisplayName: candidate,
          stage: stage === "__custom" ? customStage : stage,
          startsAt: new Date(when).toISOString(),
          competencies: comps,
          responsibility: resp || null,
          jobDescription: jd || null,
          candidateProfile: cv || null,
          principles: principles.split("\n").map((s) => s.trim()).filter(Boolean),
        },
      }),
    onSuccess: (r) => {
      track("interview_created", { source: "manual", competencies: comps.length, has_jd: Boolean(jd), has_cv: Boolean(cv), completeness: r.completeness });
      qc.invalidateQueries({ queryKey: ["interviews"] });
      nav({ to: "/interviews/$id", params: { id: r.id } });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const toggle = (c: string) => setComps((xs) => (xs.includes(c) ? xs.filter((x) => x !== c) : [...xs, c]));
  const valid = role.trim().length >= 2 && candidate.trim() && when && (stage !== "__custom" || customStage.trim().length >= 2);

  return (
    <AppShell>
      <form
        className="mx-auto max-w-2xl space-y-6"
        onSubmit={(e) => {
          e.preventDefault();
          if (valid && !m.isPending) m.mutate();
        }}
      >
        <div>
          <h1 className="text-3xl">Add an interview</h1>
          <p className="mt-1 text-sm text-muted-foreground">The more context you add, the more relevant your preparation.</p>
        </div>

        <div className="grid gap-4 rounded-xl border border-border bg-surface p-5 sm:grid-cols-2">
          <Field label="Role"><Input value={role} onChange={(e) => setRole(e.target.value)} placeholder="Senior Product Designer" required /></Field>
          <Field label="Candidate name"><Input value={candidate} onChange={(e) => setCandidate(e.target.value)} placeholder="First name or initials" required /></Field>
          <Field label="Date and time"><Input type="datetime-local" value={when} onChange={(e) => setWhen(e.target.value)} required /></Field>
          <Field label="Stage">
            <select value={stage} onChange={(e) => setStage(e.target.value)} className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm">
              {INTERVIEW_STAGES.map((s) => <option key={s}>{s}</option>)}
              <option value="__custom">Other…</option>
            </select>
            {stage === "__custom" ? <Input className="mt-2" value={customStage} onChange={(e) => setCustomStage(e.target.value)} placeholder="Stage name" /> : null}
          </Field>
        </div>

        <div className="rounded-xl border border-border bg-surface p-5">
          <Label>Competencies you are assessing</Label>
          <div className="mt-3 flex flex-wrap gap-2">
            {[...COMMON_COMPETENCIES, ...comps.filter((c) => !(COMMON_COMPETENCIES as readonly string[]).includes(c))].map((c) => (
              <button type="button" key={c} onClick={() => toggle(c)} className={`rounded-full border px-3 py-1 text-sm ${comps.includes(c) ? "border-primary bg-primary/15 text-primary" : "border-border text-muted-foreground hover:text-foreground"}`}>
                {c}
              </button>
            ))}
          </div>
          <div className="mt-3 flex gap-2">
            <Input value={customComp} onChange={(e) => setCustomComp(e.target.value)} placeholder="Add another competency" />
            <Button type="button" variant="outline" onClick={() => { const c = customComp.trim(); if (c && !comps.includes(c)) setComps([...comps, c]); setCustomComp(""); }}>Add</Button>
          </div>
        </div>

        <div className="space-y-4 rounded-xl border border-border bg-surface p-5">
          <p className="text-sm text-muted-foreground">Optional context</p>
          <Field label="Your responsibility in this interview"><Textarea value={resp} onChange={(e) => setResp(e.target.value)} rows={2} placeholder="e.g. Assess collaboration and stakeholder management" /></Field>
          <Field label="Job description"><Textarea value={jd} onChange={(e) => setJd(e.target.value)} rows={4} /></Field>
          <Field label="Candidate CV notes">
            <Textarea value={cv} onChange={(e) => setCv(e.target.value)} rows={4} />
            <p className="mt-1 text-xs text-muted-foreground">Used only to create fair, job-relevant practice scenarios. Only you can see it — group leads cannot.</p>
          </Field>
          <Field label="Company interviewing principles (one per line)"><Textarea value={principles} onChange={(e) => setPrinciples(e.target.value)} rows={3} /></Field>
        </div>

        <Button type="submit" size="lg" className="w-full" disabled={!valid || m.isPending}>
          {m.isPending ? "Saving…" : "Save interview"}
        </Button>
      </form>
    </AppShell>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  );
}
