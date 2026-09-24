import { useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { createDraft, updateDraft } from "@/lib/governance.functions";
import { RISK_LABELS, maxRisk, suggestedRisk, validateQuestion, type RiskLevel } from "@/lib/governance/validation";
import { AREA_LABELS, CAPABILITY_AREAS, SUB_SKILLS, subSkillLabel, type CapabilityArea } from "@/lib/readiness/taxonomy";

export type EditorInitial = {
  id: string;
  scenario: string;
  options: string[];
  correct_index: number;
  explanation: string;
  capability_area: string;
  sub_skill: string;
  difficulty: string;
  risk_level: RiskLevel;
  sources: string[];
};

const sel = "h-9 w-full rounded-md border border-border bg-surface px-2 text-sm";

export function QuestionEditor({ initial, onDone }: { initial?: EditorInitial; onDone: () => void }) {
  const create = useServerFn(createDraft);
  const update = useServerFn(updateDraft);
  const [f, setF] = useState({
    scenario: initial?.scenario ?? "",
    options: initial?.options ?? ["", "", "", ""],
    correctIndex: initial?.correct_index ?? 0,
    explanation: initial?.explanation ?? "",
    capabilityArea: (initial?.capability_area ?? "structured_evaluation") as CapabilityArea,
    subSkill: initial?.sub_skill ?? SUB_SKILLS.structured_evaluation[0]!,
    difficulty: (initial?.difficulty ?? "standard") as "foundation" | "standard" | "advanced",
    risk: (initial?.risk_level ?? "standard") as RiskLevel,
    sources: (initial?.sources ?? []).join("\n"),
  });
  const [busy, setBusy] = useState(false);
  const validation = useMemo(() => validateQuestion(f), [f]);
  const minRisk = suggestedRisk([f.scenario, f.explanation, ...f.options].join(" "), f.capabilityArea);
  const effectiveRisk = maxRisk(f.risk, minRisk);

  const save = async () => {
    setBusy(true);
    const data = {
      ...f,
      risk: effectiveRisk,
      sources: f.sources.split("\n").map((s) => s.trim()).filter(Boolean).slice(0, 10),
      interviewStages: [],
    };
    try {
      if (initial) await update({ data: { ...data, id: initial.id } });
      else await create({ data });
      toast.success(initial ? "Draft saved" : "Draft created");
      onDone();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-3 rounded-xl border border-border bg-surface p-4">
      <label className="block text-xs text-muted-foreground">
        Scenario
        <Textarea value={f.scenario} onChange={(e) => setF({ ...f, scenario: e.target.value })} rows={3} maxLength={2000} className="mt-1" />
      </label>
      <div className="grid gap-2 sm:grid-cols-2">
        {f.options.map((o, i) => (
          <label key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
            <input type="radio" name="correct" checked={f.correctIndex === i} onChange={() => setF({ ...f, correctIndex: i })} aria-label={`Option ${i + 1} is correct`} />
            <Input value={o} placeholder={`Option ${i + 1}`} maxLength={500} onChange={(e) => setF({ ...f, options: f.options.map((x, j) => (j === i ? e.target.value : x)) })} />
          </label>
        ))}
      </div>
      <p className="text-xs text-muted-foreground">Select the radio button next to the best answer.</p>
      <label className="block text-xs text-muted-foreground">
        Explanation (why the best answer is preferable)
        <Textarea value={f.explanation} onChange={(e) => setF({ ...f, explanation: e.target.value })} rows={2} maxLength={2000} className="mt-1" />
      </label>
      <div className="grid gap-2 sm:grid-cols-4">
        <label className="text-xs text-muted-foreground">Capability area
          <select className={sel} value={f.capabilityArea} onChange={(e) => { const a = e.target.value as CapabilityArea; setF({ ...f, capabilityArea: a, subSkill: SUB_SKILLS[a][0]! }); }}>
            {CAPABILITY_AREAS.map((a) => <option key={a} value={a}>{AREA_LABELS[a]}</option>)}
          </select>
        </label>
        <label className="text-xs text-muted-foreground">Sub-skill
          <select className={sel} value={f.subSkill} onChange={(e) => setF({ ...f, subSkill: e.target.value })}>
            {SUB_SKILLS[f.capabilityArea].map((s) => <option key={s} value={s}>{subSkillLabel(s)}</option>)}
          </select>
        </label>
        <label className="text-xs text-muted-foreground">Difficulty
          <select className={sel} value={f.difficulty} onChange={(e) => setF({ ...f, difficulty: e.target.value as typeof f.difficulty })}>
            <option value="foundation">Foundation</option><option value="standard">Standard</option><option value="advanced">Advanced</option>
          </select>
        </label>
        <label className="text-xs text-muted-foreground">Risk level
          <select className={sel} value={effectiveRisk} onChange={(e) => setF({ ...f, risk: e.target.value as RiskLevel })}>
            {(["standard", "elevated", "high"] as const).map((r) => <option key={r} value={r} disabled={maxRisk(r, minRisk) !== r}>{RISK_LABELS[r]}</option>)}
          </select>
        </label>
      </div>
      {minRisk !== "standard" ? <p className="text-xs text-warning">This content touches {minRisk}-risk topics, so it needs at least {minRisk} review.</p> : null}
      <label className="block text-xs text-muted-foreground">
        Principle or source references (one per line)
        <Textarea value={f.sources} onChange={(e) => setF({ ...f, sources: e.target.value })} rows={2} className="mt-1" />
      </label>
      {!validation.ok ? (
        <ul className="list-disc pl-5 text-xs text-warning">
          {validation.issues.map((i) => <li key={i}>{i}</li>)}
        </ul>
      ) : <p className="text-xs text-success">Automated checks pass.</p>}
      <div className="flex gap-2">
        <Button size="sm" disabled={busy} onClick={save}>{initial ? "Save draft" : "Create draft"}</Button>
        <Button size="sm" variant="ghost" onClick={onDone}>Cancel</Button>
      </div>
    </div>
  );
}
