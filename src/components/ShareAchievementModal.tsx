import { useCallback, useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toPng } from "html-to-image";
import { Check, Copy, Download, Facebook, Linkedin, Loader2, Share2, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { CARD_H, CARD_W, ShareCard, type ShareCardData } from "@/components/ShareCard";
import { claimShareBonus, getShareProfile, saveShareCard } from "@/lib/share.functions";
import { track } from "@/lib/analytics";

const HOOK =
  "Calibrated & ready to hire. See where your hiring skills stack up on Benchmark.";

export function ShareAchievementModal({ onClose }: { onClose: () => void }) {
  const profileFn = useServerFn(getShareProfile);
  const saveFn = useServerFn(saveShareCard);
  const bonusFn = useServerFn(claimShareBonus);
  const qc = useQueryClient();

  const cardRef = useRef<HTMLDivElement>(null);
  const [png, setPng] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["share-profile"],
    queryFn: () => profileFn({}),
  });

  const save = useMutation({ mutationFn: (dataUrl: string) => saveFn({ data: { png: dataUrl } }) });

  const bonus = useMutation({
    mutationFn: () => bonusFn({}),
    onSuccess: (res) => {
      if (res.awarded) {
        toast.success("+50 XP for sharing your achievement");
        void qc.invalidateQueries({ queryKey: ["me"] });
        void qc.invalidateQueries({ queryKey: ["public-leaderboard"] });
      }
    },
  });

  useEffect(() => {
    if (!data || png || !cardRef.current) return;
    let cancelled = false;
    const node = cardRef.current;
    void toPng(node, { width: CARD_W, height: CARD_H, pixelRatio: 1, cacheBust: true, skipFonts: true })
      .then((url) => {
        if (cancelled) return;
        setPng(url);
        save.mutate(url);
      })
      .catch(() => {
        if (!cancelled) toast.error("Could not build your share image.");
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, png]);

  // Always share the public production URL — the preview origin is login-gated,
  // so LinkedIn/Twitter crawlers (and recipients) get a blocked page.
  const SHARE_BASE =
    (import.meta.env["VITE_SITE_URL"] as string | undefined) ?? "https://usebenchmark.app";
  const shareUrl = data?.slug ? `${SHARE_BASE}/p/${data.slug}` : "";

  const afterShare = useCallback(
    (channel: string) => {
      track("achievement_shared", { channel });
      if (data && !data.bonusAwarded) bonus.mutate();
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [data],
  );

  const cardData: ShareCardData | null = data
    ? {
        name: data.name,
        level: data.level,
        levelTitle: data.levelTitle,
        totalXp: data.totalXp,
        streak: data.streak,
        rank: data.rank,
        totalPlayers: data.totalPlayers,
        percentile: data.percentile,
      }
    : null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Share your rank"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl rounded-2xl border border-border bg-surface p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute right-4 top-4 rounded-lg p-1.5 text-muted-foreground hover:bg-surface-2 hover:text-foreground"
        >
          <X className="size-4" />
        </button>

        <h2 className="font-display text-xl">Brag rights</h2>
        <p className="mt-1 text-sm text-body">
          Share your rank. Anyone who opens the link sees this card and can take a free
          3-minute sprint.
        </p>

        <div className="mt-5 overflow-hidden rounded-xl border border-border bg-black">
          {isLoading || !png ? (
            <Skeleton className="aspect-[1200/630] w-full" />
          ) : (
            <img src={png} alt="Your Benchmark achievement card" className="w-full" />
          )}
        </div>

        {shareUrl ? (
          <div className="mt-4 flex items-center gap-2 rounded-lg border border-border bg-surface-2 px-3 py-2">
            <span className="truncate text-xs text-muted-foreground">{shareUrl}</span>
          </div>
        ) : null}

        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
          <Button asChild variant="default" disabled={!shareUrl}>
            <a
              href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => afterShare("linkedin")}
            >
              <Linkedin className="size-4" /> LinkedIn
            </a>
          </Button>
          <Button asChild variant="outline" disabled={!shareUrl}>
            <a
              href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(HOOK)}&url=${encodeURIComponent(shareUrl)}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => afterShare("twitter")}
            >
              <Share2 className="size-4" /> Twitter/X
            </a>
          </Button>
          <Button asChild variant="outline" disabled={!shareUrl}>
            <a
              href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => afterShare("facebook")}
            >
              <Facebook className="size-4" /> Facebook
            </a>
          </Button>
          <Button
            variant="outline"
            disabled={!shareUrl}
            onClick={async () => {
              await navigator.clipboard.writeText(shareUrl);
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
              toast.success("Link copied");
              afterShare("copy_link");
            }}
          >
            {copied ? <Check className="size-4" /> : <Copy className="size-4" />} Copy link
          </Button>
          <Button
            variant="outline"
            disabled={!png}
            onClick={() => {
              const a = document.createElement("a");
              a.href = png!;
              a.download = "benchmark-rank.png";
              a.click();
              afterShare("download");
            }}
          >
            <Download className="size-4" /> Download
          </Button>
        </div>

        {data && !data.bonusAwarded ? (
          <p className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
            {bonus.isPending ? <Loader2 className="size-3 animate-spin" /> : null}
            First share earns you a one-time +50 XP.
          </p>
        ) : null}

        {/* Offscreen 1200x630 source used to rasterise the card */}
        {cardData ? (
          <div
            aria-hidden
            style={{
              position: "fixed",
              top: 0,
              left: -99999,
              width: CARD_W,
              height: CARD_H,
              pointerEvents: "none",
            }}
          >
            <ShareCard ref={cardRef} data={cardData} />
          </div>
        ) : null}
      </div>
    </div>
  );
}
