import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import {
  ArrowLeft,
  Clock,
  FileUp,
  Layers,
  Plus,
  Sparkles,
  Trash2,
  Users,
  X,
} from "lucide-react";
import {
  createAssessmentFromLibrary,
  createAssessmentWithAi,
  deleteAssessment,
  deleteAssessmentQuestion,
  listAssessments,
  loadAssessmentEditor,
  saveAssessmentQuestion,
  updateAssessment,
} from "@/lib/benchmark.functions";
import { QUARTER_THEMES } from "@/lib/gamification";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const MAX_QUESTIONS = 25;

function Panel({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-border bg-surface p-6">
      <h2 className="text-lg">{title}</h2>
      {description ? (
        <p className="mt-1 mb-4 text-sm leading-relaxed text-body">{description}</p>
      ) : (
        <div className="mb-4" />
      )}
      {children}
    </section>
  );
}

export function AssessmentsTab() {
  const [editingId, setEditingId] = useState<string | null>(null);
  if (editingId)
    return <AssessmentEditor id={editingId} onBack={() => setEditingId(null)} />;
  return <AssessmentsList onEdit={setEditingId} />;
}

/* --------------------------------------------------------------- the list */

function AssessmentsList({ onEdit }: { onEdit: (id: string) => void }) {
  const listFn = useServerFn(listAssessments);
  const qc = useQueryClient();
  const query = useQuery({
    queryKey: ["assessments"],
    queryFn: () => listFn({}),
    retry: false,
  });

  const removeFn = useServerFn(deleteAssessment);
  const remove = useMutation({
    mutationFn: (id: string) => removeFn({ data: { id } }),
    onSuccess: () => {
      toast.success("Assessment deleted");
      void qc.invalidateQueries({ queryKey: ["assessments"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const publishFn = useServerFn(updateAssessment);
  const setStatus = useMutation({
    mutationFn: (v: { id: string; status: "draft" | "published" }) =>
      publishFn({ data: v }),
    onSuccess: (_r, v) => {
      toast.success(v.status === "published" ? "Published to your group" : "Moved to draft");
      void qc.invalidateQueries({ queryKey: ["assessments"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-6">
      <Builders onCreated={onEdit} />

      {query.isLoading ? (
        <Skeleton className="h-48 w-full rounded-xl" />
      ) : (
        <Panel
          title="Your assessments"
          description="Drafts stay private until you publish them to your group."
        >
          {!query.data?.assessments.length ? (
            <p className="text-sm text-muted-foreground">
              Nothing here yet — build one above.
            </p>
          ) : (
            <ul className="space-y-3">
              {query.data.assessments.map((a) => (
                <li
                  key={a.id}
                  className="flex flex-wrap items-start justify-between gap-4 rounded-lg border border-border bg-background/40 p-4"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium text-heading">{a.title}</span>
                      <Badge variant={a.status === "published" ? "default" : "secondary"}>
                        {a.status === "published" ? "Published" : "Draft"}
                      </Badge>
                      <Badge variant="outline">
                        {a.source === "ai" ? "AI" : a.source === "library" ? "Library" : "Manual"}
                      </Badge>
                    </div>
                    {a.description ? (
                      <p className="mt-1 text-sm leading-relaxed text-body">{a.description}</p>
                    ) : null}
                    <p className="mt-1 text-xs text-muted-foreground">
                      {a.questionCount} question{a.questionCount === 1 ? "" : "s"} ·{" "}
                      {a.estimatedMinutes} min · {a.completions} completion
                      {a.completions === 1 ? "" : "s"}
                      {a.completions ? ` · ${a.accuracy}% accuracy` : ""}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <Button size="sm" variant="outline" onClick={() => onEdit(a.id)}>
                      Review & edit
                    </Button>
                    <Button
                      size="sm"
                      variant={a.status === "published" ? "secondary" : "default"}
                      disabled={setStatus.isPending}
                      onClick={() =>
                        setStatus.mutate({
                          id: a.id,
                          status: a.status === "published" ? "draft" : "published",
                        })
                      }
                    >
                      {a.status === "published" ? "Unpublish" : "Publish"}
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      aria-label="Delete assessment"
                      onClick={() => remove.mutate(a.id)}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      )}
    </div>
  );
}

/* ------------------------------------------------------------- builders */

function Builders({ onCreated }: { onCreated: (id: string) => void }) {
  return (
    <Tabs defaultValue="library">
      <TabsList>
        <TabsTrigger value="library">
          <Layers className="mr-2 size-4" /> Build from library
        </TabsTrigger>
        <TabsTrigger value="ai">
          <Sparkles className="mr-2 size-4" /> Build with AI
        </TabsTrigger>
      </TabsList>
      <TabsContent value="library" className="mt-4">
        <LibraryBuilder onCreated={onCreated} />
      </TabsContent>
      <TabsContent value="ai" className="mt-4">
        <AiBuilder onCreated={onCreated} />
      </TabsContent>
    </Tabs>
  );
}

function DurationRow({
  count,
  minutes,
  setCount,
  setMinutes,
}: {
  count: number;
  minutes: number;
  setCount: (n: number) => void;
  setMinutes: (n: number) => void;
}) {
  const total = Math.max(1, Math.round(count * minutes));
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <div>
        <Label htmlFor="count">Total questions</Label>
        <Input
          id="count"
          type="number"
          min={1}
          max={MAX_QUESTIONS}
          value={count}
          onChange={(e) =>
            setCount(Math.min(MAX_QUESTIONS, Math.max(1, Number(e.target.value) || 1)))
          }
          className="mt-1.5"
        />
      </div>
      <div>
        <Label htmlFor="mins">Minutes per question</Label>
        <Input
          id="mins"
          type="number"
          min={0.5}
          max={10}
          step={0.5}
          value={minutes}
          onChange={(e) => setMinutes(Math.max(0.5, Number(e.target.value) || 1))}
          className="mt-1.5"
        />
      </div>
      <div className="flex items-end">
        <div className="flex w-full items-center gap-2 rounded-lg border border-border bg-background/40 px-3 py-2 text-sm">
          <Clock className="size-4 text-primary" />
          <span className="text-body">
            Approx <span className="font-semibold text-heading">{total} min</span> to complete
          </span>
        </div>
      </div>
    </div>
  );
}

function LibraryBuilder({ onCreated }: { onCreated: (id: string) => void }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [quarters, setQuarters] = useState<number[]>([1]);
  const [count, setCount] = useState(6);
  const [minutes, setMinutes] = useState(1.5);
  const qc = useQueryClient();

  const fn = useServerFn(createAssessmentFromLibrary);
  const create = useMutation({
    mutationFn: () =>
      fn({
        data: {
          title,
          description,
          quarters,
          targetQuestions: count,
          minutesPerQuestion: minutes,
        },
      }),
    onSuccess: (r) => {
      toast.success(`Draft created with ${r.generated} questions`);
      void qc.invalidateQueries({ queryKey: ["assessments"] });
      onCreated(r.id);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const toggle = (q: number) =>
    setQuarters((prev) => (prev.includes(q) ? prev.filter((x) => x !== q) : [...prev, q]));

  return (
    <Panel
      title="Mix themes from the Benchmark library"
      description="Combine any of the four capability themes and set how long the test should take. We sample questions across your chosen themes."
    >
      <div className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="lib-title">Title</Label>
            <Input
              id="lib-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Q3 interviewer refresher"
              className="mt-1.5"
            />
          </div>
          <div>
            <Label htmlFor="lib-desc">Description (optional)</Label>
            <Input
              id="lib-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Short note for your managers"
              className="mt-1.5"
            />
          </div>
        </div>

        <div>
          <Label>Themes</Label>
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            {[1, 2, 3, 4].map((q) => (
              <label
                key={q}
                className="flex cursor-pointer items-start gap-3 rounded-lg border border-border bg-background/40 p-3"
              >
                <Checkbox
                  checked={quarters.includes(q)}
                  onCheckedChange={() => toggle(q)}
                  className="mt-0.5"
                />
                <span className="text-sm">
                  <span className="font-medium text-heading">{QUARTER_THEMES[q]?.name}</span>
                  <span className="block text-xs text-muted-foreground">
                    {QUARTER_THEMES[q]?.blurb}
                  </span>
                </span>
              </label>
            ))}
          </div>
        </div>

        <DurationRow
          count={count}
          minutes={minutes}
          setCount={setCount}
          setMinutes={setMinutes}
        />

        <Button
          disabled={title.trim().length < 2 || !quarters.length || create.isPending}
          onClick={() => create.mutate()}
        >
          {create.isPending ? "Building…" : "Create draft"}
        </Button>
      </div>
    </Panel>
  );
}

async function fileToBase64(file: File) {
  const buf = await file.arrayBuffer();
  let binary = "";
  const bytes = new Uint8Array(buf);
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

function AiBuilder({ onCreated }: { onCreated: (id: string) => void }) {
  const [title, setTitle] = useState("");
  const [brief, setBrief] = useState("");
  const [text, setText] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [count, setCount] = useState(6);
  const [minutes, setMinutes] = useState(1.5);
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const qc = useQueryClient();
  const fn = useServerFn(createAssessmentWithAi);

  const tooBig = useMemo(
    () => files.reduce((s, f) => s + f.size, 0) > 12 * 1024 * 1024,
    [files],
  );

  async function generate() {
    setBusy(true);
    try {
      const encoded = await Promise.all(
        files.map(async (f) => ({
          name: f.name,
          mimeType: f.type || "application/pdf",
          dataBase64: await fileToBase64(f),
        })),
      );
      const r = await fn({
        data: {
          title,
          description: brief.slice(0, 200),
          brief,
          text,
          files: encoded,
          targetQuestions: count,
          minutesPerQuestion: minutes,
        },
      });
      toast.success(
        r.short
          ? `Generated ${r.generated} questions — the source material only supported that many.`
          : `Generated ${r.generated} questions`,
      );
      void qc.invalidateQueries({ queryKey: ["assessments"] });
      onCreated(r.id);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Generation failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Panel
      title="Generate from your own material"
      description="Upload your TA principles, interview process or a topic PDF, and/or paste text. The AI writes scenario questions grounded in that material — you review before publishing."
    >
      <div className="space-y-5">
        <div>
          <Label htmlFor="ai-title">Title</Label>
          <Input
            id="ai-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Our hiring principles in practice"
            className="mt-1.5"
          />
        </div>

        <div>
          <Label htmlFor="ai-brief">What should this test cover?</Label>
          <Input
            id="ai-brief"
            value={brief}
            onChange={(e) => setBrief(e.target.value)}
            placeholder="Applying our debrief standard and scorecard rules"
            className="mt-1.5"
          />
        </div>

        <div>
          <Label>Source documents (PDF)</Label>
          <div className="mt-2 space-y-2">
            <input
              ref={inputRef}
              type="file"
              accept="application/pdf"
              multiple
              className="hidden"
              onChange={(e) => {
                const picked = Array.from(e.target.files ?? []);
                setFiles((prev) => [...prev, ...picked].slice(0, 3));
                e.target.value = "";
              }}
            />
            <Button type="button" variant="outline" onClick={() => inputRef.current?.click()}>
              <FileUp className="mr-2 size-4" /> Add PDF
            </Button>
            {files.map((f, i) => (
              <div
                key={`${f.name}-${i}`}
                className="flex items-center justify-between rounded-lg border border-border bg-background/40 px-3 py-2 text-sm"
              >
                <span className="truncate">{f.name}</span>
                <button
                  type="button"
                  aria-label={`Remove ${f.name}`}
                  onClick={() => setFiles((prev) => prev.filter((_, j) => j !== i))}
                >
                  <X className="size-4 text-muted-foreground" />
                </button>
              </div>
            ))}
            {tooBig ? (
              <p className="text-xs text-destructive">
                Those files are too large — keep the total under 12 MB.
              </p>
            ) : null}
          </div>
        </div>

        <div>
          <Label htmlFor="ai-text">Or paste your principles / process</Label>
          <Textarea
            id="ai-text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={6}
            placeholder="Paste your TA culture, hiring principles or process notes…"
            className="mt-1.5"
          />
        </div>

        <DurationRow
          count={count}
          minutes={minutes}
          setCount={setCount}
          setMinutes={setMinutes}
        />

        <Button
          disabled={
            busy ||
            tooBig ||
            title.trim().length < 2 ||
            (!brief.trim() && !text.trim() && !files.length)
          }
          onClick={() => void generate()}
        >
          <Sparkles className="mr-2 size-4" />
          {busy ? "Generating…" : "Generate draft"}
        </Button>
      </div>
    </Panel>
  );
}

/* --------------------------------------------------------------- editor */

type EditorData = Awaited<ReturnType<typeof loadAssessmentEditor>>;
type EditorQuestion = EditorData["questions"][number];

function AssessmentEditor({ id, onBack }: { id: string; onBack: () => void }) {
  const loadFn = useServerFn(loadAssessmentEditor);
  const qc = useQueryClient();
  const query = useQuery({
    queryKey: ["assessment-editor", id],
    queryFn: () => loadFn({ data: { id } }),
    retry: false,
  });

  const updateFn = useServerFn(updateAssessment);
  const update = useMutation({
    mutationFn: (v: { status?: "draft" | "published"; title?: string; description?: string }) =>
      updateFn({ data: { id, ...v } }),
    onSuccess: () => {
      toast.success("Saved");
      void qc.invalidateQueries({ queryKey: ["assessment-editor", id] });
      void qc.invalidateQueries({ queryKey: ["assessments"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const [adding, setAdding] = useState(false);

  if (query.isLoading) return <Skeleton className="h-96 w-full rounded-xl" />;
  if (query.error || !query.data)
    return (
      <div className="space-y-4">
        <Button variant="ghost" onClick={onBack}>
          <ArrowLeft className="mr-2 size-4" /> Back
        </Button>
        <p className="text-sm text-destructive">
          {(query.error as Error)?.message ?? "Assessment not found."}
        </p>
      </div>
    );

  const d = query.data;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button variant="ghost" onClick={onBack}>
          <ArrowLeft className="mr-2 size-4" /> All assessments
        </Button>
        <div className="flex items-center gap-2">
          <Badge variant={d.assessment.status === "published" ? "default" : "secondary"}>
            {d.assessment.status === "published" ? "Published" : "Draft"}
          </Badge>
          <Button
            disabled={update.isPending}
            variant={d.assessment.status === "published" ? "secondary" : "default"}
            onClick={() =>
              update.mutate({
                status: d.assessment.status === "published" ? "draft" : "published",
              })
            }
          >
            {d.assessment.status === "published" ? "Unpublish" : "Publish to group"}
          </Button>
        </div>
      </div>

      <div>
        <h2 className="text-2xl">{d.assessment.title}</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {d.questions.length} questions · approx {d.assessment.estimatedMinutes} min
        </p>
      </div>

      <div className="space-y-4">
        {d.questions.map((q, i) => (
          <QuestionEditor key={q.id} assessmentId={id} question={q} index={i} />
        ))}
      </div>

      {adding ? (
        <QuestionEditor
          assessmentId={id}
          index={d.questions.length}
          question={{
            id: "",
            position: d.questions.length,
            scenario: "",
            options: ["", "", ""],
            correctIndex: 0,
            explanation: "",
          }}
          isNew
          onDone={() => setAdding(false)}
        />
      ) : (
        <Button variant="outline" onClick={() => setAdding(true)}>
          <Plus className="mr-2 size-4" /> Add question
        </Button>
      )}

      <Panel title="Results" description="Who in your group has taken this assessment.">
        {!d.results.length ? (
          <p className="text-sm text-muted-foreground">No completions yet.</p>
        ) : (
          <ul className="space-y-2">
            {d.results.map((r) => (
              <li
                key={r.userId}
                className="flex items-center justify-between rounded-lg border border-border bg-background/40 px-3 py-2 text-sm"
              >
                <span>
                  <span className="font-medium text-heading">{r.name}</span>
                  <span className="block text-xs text-muted-foreground">{r.email}</span>
                </span>
                <span className="flex items-center gap-2">
                  <Users className="size-4 text-muted-foreground" />
                  {r.score}/{d.questions.length}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}

function QuestionEditor({
  assessmentId,
  question,
  index,
  isNew,
  onDone,
}: {
  assessmentId: string;
  question: EditorQuestion;
  index: number;
  isNew?: boolean;
  onDone?: () => void;
}) {
  const [scenario, setScenario] = useState(question.scenario);
  const [options, setOptions] = useState<string[]>(
    question.options.length ? question.options : ["", "", ""],
  );
  const [correctIndex, setCorrectIndex] = useState(question.correctIndex);
  const [explanation, setExplanation] = useState(question.explanation);
  const qc = useQueryClient();

  const saveFn = useServerFn(saveAssessmentQuestion);
  const save = useMutation({
    mutationFn: () =>
      saveFn({
        data: {
          assessmentId,
          questionId: isNew ? null : question.id,
          scenario: scenario.trim(),
          options: options.map((o) => o.trim()).filter(Boolean),
          correctIndex,
          explanation: explanation.trim(),
        },
      }),
    onSuccess: () => {
      toast.success("Question saved");
      void qc.invalidateQueries({ queryKey: ["assessment-editor", assessmentId] });
      onDone?.();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const delFn = useServerFn(deleteAssessmentQuestion);
  const remove = useMutation({
    mutationFn: () => delFn({ data: { assessmentId, questionId: question.id } }),
    onSuccess: () => {
      toast.success("Question removed");
      void qc.invalidateQueries({ queryKey: ["assessment-editor", assessmentId] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <section className="rounded-xl border border-border bg-surface p-5">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-sm font-semibold text-heading">Question {index + 1}</span>
        {!isNew ? (
          <Button
            size="icon"
            variant="ghost"
            aria-label="Delete question"
            onClick={() => remove.mutate()}
          >
            <Trash2 className="size-4" />
          </Button>
        ) : null}
      </div>

      <Textarea
        value={scenario}
        onChange={(e) => setScenario(e.target.value)}
        rows={3}
        placeholder="Scenario"
      />

      <div className="mt-3 space-y-2">
        {options.map((o, i) => (
          <div key={i} className="flex items-center gap-2">
            <button
              type="button"
              aria-label={`Mark option ${i + 1} correct`}
              onClick={() => setCorrectIndex(i)}
              className={`size-5 shrink-0 rounded-full border ${
                correctIndex === i ? "border-primary bg-primary" : "border-border"
              }`}
            />
            <Input
              value={o}
              onChange={(e) =>
                setOptions((prev) => prev.map((p, j) => (j === i ? e.target.value : p)))
              }
              placeholder={`Option ${i + 1}`}
            />
            {options.length > 2 ? (
              <button
                type="button"
                aria-label={`Remove option ${i + 1}`}
                onClick={() => {
                  setOptions((prev) => prev.filter((_, j) => j !== i));
                  setCorrectIndex((c) => (c >= i && c > 0 ? c - 1 : c));
                }}
              >
                <X className="size-4 text-muted-foreground" />
              </button>
            ) : null}
          </div>
        ))}
        {options.length < 4 ? (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setOptions((prev) => [...prev, ""])}
          >
            <Plus className="mr-2 size-4" /> Add option
          </Button>
        ) : null}
      </div>

      <Textarea
        className="mt-3"
        value={explanation}
        onChange={(e) => setExplanation(e.target.value)}
        rows={2}
        placeholder="Why the correct answer is right"
      />

      <div className="mt-3 flex gap-2">
        <Button
          size="sm"
          disabled={
            save.isPending ||
            scenario.trim().length < 5 ||
            options.filter((o) => o.trim()).length < 2
          }
          onClick={() => save.mutate()}
        >
          {isNew ? "Add question" : "Save"}
        </Button>
        {isNew ? (
          <Button size="sm" variant="ghost" onClick={onDone}>
            Cancel
          </Button>
        ) : null}
      </div>
    </section>
  );
}
