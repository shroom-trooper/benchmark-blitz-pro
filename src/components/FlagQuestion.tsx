import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Flag } from "lucide-react";
import { toast } from "sonner";
import { flagQuestion } from "@/lib/governance.functions";
import { FLAG_REASONS, FLAG_REASON_LABELS, type FlagReason } from "@/lib/governance/validation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { track } from "@/lib/analytics";

/** Lets a participant report an unclear, incorrect, biased or inappropriate question. */
export function FlagQuestion({ prepQuestionId }: { prepQuestionId: string }) {
  const fn = useServerFn(flagQuestion);
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<FlagReason>("unclear");
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  if (sent) return <p className="mt-3 text-xs text-muted-foreground">Thanks — this question was flagged for review. It won't create a development area for you while it's being reviewed.</p>;
  if (!open)
    return (
      <button type="button" onClick={() => setOpen(true)} className="mt-3 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
        <Flag className="size-3.5" /> Flag this question
      </button>
    );
  return (
    <div className="mt-3 space-y-2 rounded-lg border border-border p-3">
      <p className="text-xs font-medium">What's wrong with this question?</p>
      <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label="Flag reason">
        {FLAG_REASONS.map((r) => (
          <button
            key={r}
            type="button"
            role="radio"
            aria-checked={reason === r}
            onClick={() => setReason(r)}
            className={`rounded-full border px-2.5 py-1 text-xs ${reason === r ? "border-primary bg-primary/10" : "border-border"}`}
          >
            {FLAG_REASON_LABELS[r]}
          </button>
        ))}
      </div>
      <Textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Optional details (don't include candidate information)" maxLength={1000} rows={2} />
      <div className="flex gap-2">
        <Button
          size="sm"
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            try {
              await fn({ data: { prepQuestionId, reason, comment: comment || null } });
              track("question_flagged", { reason });
              setSent(true);
            } catch (e) {
              toast.error((e as Error).message || "Could not flag the question.");
            } finally {
              setBusy(false);
            }
          }}
        >
          Submit flag
        </Button>
        <Button size="sm" variant="ghost" onClick={() => setOpen(false)}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
