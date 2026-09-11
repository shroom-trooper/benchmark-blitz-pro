import { forwardRef } from "react";

export type ShareCardData = {
  name: string;
  level: number;
  levelTitle: string;
  totalXp: number;
  streak: number;
  rank: number | null;
  totalPlayers: number;
  percentile: number | null;
  track?: "interviewer" | "recruiter";
};

export const CARD_W = 1200;
export const CARD_H = 630;

export function rankBadgeLabel(d: ShareCardData) {
  const role = d.track === "recruiter" ? "Recruiter" : "Interviewer";
  if (!d.rank) return "In training";
  if (d.rank <= 3) return `#${d.rank} Global Rank`;
  if (d.percentile && d.percentile <= 25) return `Top ${d.percentile}% ${role}`;
  return `#${d.rank} of ${d.totalPlayers} Global`;
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join("");
}

/** Fixed 1200x630 card rasterised for social previews. Inline styles only so
 *  html-to-image captures it faithfully. */
export const ShareCard = forwardRef<HTMLDivElement, { data: ShareCardData }>(
  function ShareCard({ data }, ref) {
    const font =
      '"Plus Jakarta Sans", ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif';
    return (
      <div
        ref={ref}
        style={{
          width: CARD_W,
          height: CARD_H,
          position: "relative",
          overflow: "hidden",
          backgroundColor: "#08080A",
          backgroundImage:
            "radial-gradient(900px 460px at 15% -10%, rgba(99,102,241,0.35), transparent 60%), radial-gradient(700px 420px at 105% 110%, rgba(16,185,129,0.22), transparent 60%)",
          fontFamily: font,
          color: "#FFFFFF",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 64,
          boxSizing: "border-box",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <span
            style={{
              width: 46,
              height: 46,
              borderRadius: 12,
              backgroundColor: "#6366F1",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 26,
              lineHeight: "46px",
            }}
          >
            ⚡
          </span>
          <span style={{ fontSize: 30, fontWeight: 700, letterSpacing: -0.5 }}>
            Benchmark
          </span>
          <span
            style={{
              marginLeft: "auto",
              fontSize: 15,
              letterSpacing: 2,
              textTransform: "uppercase",
              color: "#A1A1AA",
            }}
          >
            {data.track === "recruiter"
              ? "Talent acquisition training"
              : "Hiring capability training"}
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 32 }}>
          <div
            style={{
              width: 132,
              height: 132,
              borderRadius: 32,
              backgroundColor: "rgba(99,102,241,0.18)",
              border: "2px solid rgba(129,140,248,0.5)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 48,
              fontWeight: 700,
              color: "#C7D2FE",
            }}
          >
            {initials(data.name) || "B"}
          </div>
          <div>
            <div
              style={{
                display: "inline-block",
                padding: "8px 18px",
                borderRadius: 999,
                backgroundColor: "rgba(99,102,241,0.2)",
                border: "1px solid rgba(129,140,248,0.45)",
                color: "#C7D2FE",
                fontSize: 20,
                fontWeight: 600,
                marginBottom: 14,
              }}
            >
              {rankBadgeLabel(data)}
            </div>
            <div style={{ fontSize: 62, fontWeight: 800, letterSpacing: -1.6 }}>
              {data.name}
            </div>
            <div style={{ fontSize: 26, color: "#A1A1AA", marginTop: 6 }}>
              Level {data.level} · {data.levelTitle}
            </div>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "flex-end", gap: 20 }}>
          <Stat label="Total XP" value={data.totalXp.toLocaleString()} accent="#818CF8" />
          <Stat label="Week streak" value={`${data.streak}`} accent="#F59E0B" />
          <Stat
            label="Global rank"
            value={data.rank ? `#${data.rank}` : "—"}
            accent="#10B981"
          />
          <div
            style={{
              marginLeft: "auto",
              maxWidth: 470,
              fontSize: 22,
              lineHeight: 1.45,
              color: "#D4D4D8",
              textAlign: "right",
            }}
          >
            {data.track === "recruiter"
              ? "Calibrated & ready to recruit. See where your TA judgement stacks up on Benchmark."
              : "Calibrated & ready to hire. See where your hiring skills stack up on Benchmark."}
          </div>
        </div>
      </div>
    );
  },
);

function Stat({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent: string;
}) {
  return (
    <div
      style={{
        minWidth: 190,
        padding: "20px 24px",
        borderRadius: 20,
        backgroundColor: "rgba(255,255,255,0.05)",
        border: "1px solid rgba(255,255,255,0.12)",
      }}
    >
      <div
        style={{
          fontSize: 15,
          letterSpacing: 1.4,
          textTransform: "uppercase",
          color: "#A1A1AA",
        }}
      >
        {label}
      </div>
      <div style={{ fontSize: 42, fontWeight: 800, color: accent, marginTop: 4 }}>
        {value}
      </div>
    </div>
  );
}
