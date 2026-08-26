import { useEffect, useState } from "react";
import { motion } from "motion/react";
import {
  FileText,
  Sparkles,
  Check,
  Flame,
  Upload,
} from "lucide-react";

const SECTIONS = [
  {
    tag: "01 / AI GENERATOR",
    title: "Personalized.",
    subtitle:
      "Turn your internal documents into scored scenarios in seconds. Upload your culture deck or rubrics, and let AI build custom assessments tailored to your team.",
    glow: "from-purple-600/20 via-indigo-500/10 to-transparent",
  },
  {
    tag: "02 / REAL-TIME PRACTICE",
    title: "Realistic.",
    subtitle:
      "Practice critical decision points with instant feedback. Every choice reveals detailed reasoning the moment your managers respond.",
    glow: "from-emerald-600/20 via-teal-500/10 to-transparent",
  },
  {
    tag: "03 / ROADMAP",
    title: "Structured.",
    subtitle:
      "A 52-week progressive pathway built across four quarters. Master interview fundamentals, bias mitigation, candidate experience, and strategic talent leadership.",
    glow: "from-cyan-600/20 via-blue-500/10 to-transparent",
  },
  {
    tag: "04 / ENGAGEMENT",
    title: "Habit-forming.",
    subtitle:
      "Drive continuous practice with weekly streaks, XP bonuses, and group leaderboards. Watch interview quality improve week after week.",
    glow: "from-amber-600/20 via-orange-500/10 to-transparent",
  },
  {
    tag: "05 / GROUP TELEMETRY",
    title: "Diagnostic.",
    subtitle:
      "Uncover exact skill gaps across your hiring teams. Measure interviewer preparedness, decision accuracy, and rubric alignment in real time before bad hires happen.",
    glow: "from-cyan-500/20 via-blue-600/10 to-transparent",
  },
];


export function FeatureStory() {
  return (
    <div className="space-y-0">
      {SECTIONS.map((s, i) => (
        <FeatureRow key={s.tag} {...s} index={i} />
      ))}
    </div>
  );
}

function FeatureRow({
  tag,
  title,
  subtitle,
  glow,
  index,
}: (typeof SECTIONS)[number] & { index: number }) {
  return (
    <section className="grid min-h-[85vh] grid-cols-1 items-center gap-12 py-24 lg:grid-cols-12 lg:gap-16 md:py-36">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="col-span-12 lg:col-span-5 lg:sticky lg:top-28"
      >
        <span className="inline-block rounded-md px-2.5 py-1 font-mono text-[11px] tracking-widest text-dim keycap-badge">
          [ {tag} ]
        </span>
        <h2 className="mt-5 text-4xl sm:text-5xl">{title}</h2>
        <p className="mt-4 max-w-md text-base leading-relaxed text-dim">
          {subtitle}
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.7, delay: 0.1, ease: "easeOut" }}
        className="relative col-span-12 lg:col-span-7"
      >
        <div
          aria-hidden
          className={`pointer-events-none absolute -inset-10 rounded-[3rem] bg-gradient-to-br blur-2xl ${glow}`}
        />
        <div className="relative rounded-3xl border border-white/10 bg-slate-900/50 p-8 shadow-[0_0_50px_rgba(0,0,0,0.8)] backdrop-blur-2xl">
          {index === 0 && <StageAI />}
          {index === 1 && <StageSim />}
          {index === 2 && <StageRoadmap />}
          {index === 3 && <StageStreak />}
          {index === 4 && <StageTelemetry />}
        </div>
      </motion.div>
    </section>
  );
}

/* ---------- Stage 1: AI generation ---------- */
function StageAI() {
  const cards = [
    "Candidate pushes back on your rubric — what do you do?",
    "A panelist scores on 'culture fit'. Your next move?",
    "Two finalists, one has referral bias. How do you decide?",
  ];
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3 rounded-2xl border border-dashed border-white/15 bg-void/60 px-4 py-5">
        <span className="grid size-10 place-items-center rounded-xl bg-primary/15 text-primary">
          <Upload className="size-5" />
        </span>
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-sm text-heading">
            <FileText className="size-4 text-dim" />
            Acme_Hiring_Principles.pdf
          </div>
          <div className="text-xs text-dim">Drop a culture deck, rubric or playbook</div>
        </div>
      </div>

      <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-purple-500 to-indigo-400 shadow-[0_0_14px_rgba(139,92,246,0.8)]"
          animate={{ width: ["8%", "100%"] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      <div className="space-y-3">
        {cards.map((c, i) => (
          <motion.div
            key={c}
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4 + i * 0.35, duration: 0.5 }}
            className="flex items-start gap-3 rounded-xl border border-keycap-border bg-keycap/80 p-4"
          >
            <Sparkles className="mt-0.5 size-4 shrink-0 text-primary" />
            <p className="text-sm leading-relaxed text-body">{c}</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

/* ---------- Stage 2: micro-simulation ---------- */
function StageSim() {
  const options = [
    "Ask for a specific example from the last 6 months.",
    "Note the gut feel and move on to the next question.",
    "Rephrase the question until you hear what you expect.",
  ];
  const [picked, setPicked] = useState<number | null>(null);
  const correct = picked === 0;

  return (
    <div className="space-y-4">
      <div className="font-mono text-[11px] tracking-widest text-dim">
        WEEK 14 · EVIDENCE CAPTURE
      </div>
      <p className="text-base leading-relaxed text-heading">
        A candidate answers in hypotheticals. What is your next move?
      </p>
      <div className="relative space-y-2.5">
        {options.map((o, i) => {
          const active = picked === i;
          const good = active && i === 0;
          return (
            <button
              key={o}
              onClick={() => setPicked(i)}
              className={`w-full rounded-xl border p-4 text-left text-sm transition-all duration-300 ${
                good
                  ? "border-emerald-400/60 bg-emerald-500/10 text-heading shadow-[0_0_0_3px_rgba(16,185,129,0.25),0_0_30px_rgba(16,185,129,0.35)]"
                  : active
                    ? "border-destructive/60 bg-destructive/10 text-heading"
                    : "border-keycap-border bg-keycap/80 text-body hover:border-primary/40"
              }`}
            >
              <span className="flex items-center gap-3">
                <span className="grid size-5 shrink-0 place-items-center rounded-full border border-white/20">
                  {good && <Check className="size-3 text-emerald-400" />}
                </span>
                {o}
              </span>
            </button>
          );
        })}

        {correct && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.9 }}
            animate={{ opacity: 1, y: -8, scale: 1 }}
            transition={{ type: "spring", stiffness: 320, damping: 18 }}
            className="pointer-events-none absolute -top-3 right-2 rounded-full border border-emerald-400/50 bg-emerald-500/15 px-3 py-1 font-mono text-xs text-emerald-300"
          >
            +150 XP
          </motion.div>
        )}
      </div>
      <p className="text-xs text-dim">
        {correct
          ? "Correct — behavioural evidence beats hypotheticals every time."
          : "Pick an option to see the reasoning."}
      </p>
    </div>
  );
}

/* ---------- Stage 3: roadmap ---------- */
const QUARTERS = [
  { q: "Q1", name: "Interview Fundamentals", weeks: ["Structured interviewing", "Behavioural probing", "Evidence capture", "Scorecard discipline"] },
  { q: "Q2", name: "Bias & Inclusive Hiring", weeks: ["Affinity bias", "Halo & horns", "Inclusive language", "Debias the debrief"] },
  { q: "Q3", name: "Candidate Experience", weeks: ["Speed to decision", "Assessment design", "Feedback loops", "Calibration"] },
  { q: "Q4", name: "Strategic Talent", weeks: ["Executive hiring", "Workforce planning", "Capability building", "Hiring analytics"] },
];

function StageRoadmap() {
  const [open, setOpen] = useState(0);
  return (
    <div className="space-y-6">
      <div className="relative h-1.5 rounded-full bg-white/10">
        <div className="absolute inset-y-0 left-0 w-[62%] rounded-full bg-gradient-to-r from-cyan-500 to-blue-400" />
        <div className="absolute -top-1.5 flex w-full justify-between">
          {QUARTERS.map((q, i) => (
            <button
              key={q.q}
              onMouseEnter={() => setOpen(i)}
              onFocus={() => setOpen(i)}
              onClick={() => setOpen(i)}
              className={`size-4.5 rounded-full border-2 transition-all ${
                open === i
                  ? "size-5 border-cyan-300 bg-cyan-400 shadow-[0_0_18px_rgba(34,211,238,0.7)]"
                  : "border-white/25 bg-keycap"
              }`}
              aria-label={q.name}
            />
          ))}
        </div>
      </div>
      <div className="flex justify-between font-mono text-[11px] tracking-widest text-dim">
        {QUARTERS.map((q) => (
          <span key={q.q}>{q.q}</span>
        ))}
      </div>

      <motion.div
        key={open}
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 260, damping: 22 }}
        className="rounded-2xl border border-keycap-border bg-keycap/80 p-5"
      >
        <h3 className="text-lg">{QUARTERS[open]!.name}</h3>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {QUARTERS[open]!.weeks.map((w, i) => (
            <motion.div
              key={w}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="flex items-center gap-2 rounded-lg bg-void/60 px-3 py-2 text-sm text-body"
            >
              <span className="size-1.5 rounded-full bg-cyan-400" />
              {w}
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

/* ---------- Stage 4: streaks + podium ---------- */
function StageStreak() {
  const podium = [
    { place: 2, name: "Maya R.", xp: "4,210", h: "h-20" },
    { place: 1, name: "Devon K.", xp: "5,860", h: "h-28" },
    { place: 3, name: "Priya S.", xp: "3,940", h: "h-14" },
  ];
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between gap-4 rounded-2xl border border-amber-400/25 bg-amber-500/10 px-5 py-4">
        <div className="flex items-center gap-3">
          <Flame className="size-6 origin-bottom text-amber-400 animate-[flicker_0.7s_ease-in-out_infinite] drop-shadow-[0_0_10px_rgba(251,191,36,0.8)]" />
          <span className="font-mono text-sm tracking-widest text-amber-200">
            12 WEEK STREAK
          </span>
        </div>
        <motion.span
          animate={{ y: [0, -4, 0] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
          className="rounded-md px-2 py-1 font-mono text-[11px] text-dim keycap-badge"
        >
          +120 XP BONUS
        </motion.span>
      </div>

      <div className="flex items-end justify-center gap-4">
        {podium.map((p, i) => (
          <motion.div
            key={p.place}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.15 * i, type: "spring", stiffness: 200, damping: 20 }}
            className="flex w-24 flex-col items-center gap-2"
          >
            <span
              className={`grid size-11 place-items-center rounded-full border-2 font-display text-sm ${
                p.place === 1
                  ? "border-amber-400 text-amber-300 shadow-[0_0_20px_rgba(251,191,36,0.5)]"
                  : "border-white/20 text-dim"
              }`}
            >
              {p.name[0]}
            </span>
            <span className="text-xs text-body">{p.name}</span>
            <div
              className={`flex w-full ${p.h} items-start justify-center rounded-t-xl border border-b-0 border-keycap-border bg-gradient-to-b from-keycap-2 to-keycap pt-2 font-display`}
            >
              {p.place}
            </div>
            <span className="-mt-1 font-mono text-[11px] text-dim">{p.xp} XP</span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

/* ---------- Stage 5: group telemetry ---------- */
const GAPS = [
  { name: "Bias Detection", pct: 42, label: "High Risk", tone: "amber" },
  { name: "Structured Scoring", pct: 88, label: "Strong", tone: "emerald" },
  { name: "Candidate Experience", pct: 64, label: "Improving", tone: "cyan" },
];

const TONE: Record<string, string> = {
  amber: "border-amber-400/40 bg-amber-500/10 text-amber-300",
  emerald: "border-emerald-400/40 bg-emerald-500/10 text-emerald-300",
  cyan: "border-cyan-400/40 bg-cyan-500/10 text-cyan-300",
};

const WEEKS = [52, 58, 61, 70, 74, 78];

function useCountUp(target: number, run: boolean) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!run) return;
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min((now - start) / 1400, 1);
      setValue(Math.round(target * (1 - Math.pow(1 - t, 3))));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, run]);
  return value;
}

function StageTelemetry() {
  const [inView, setInView] = useState(false);
  const readiness = useCountUp(78, inView);
  const R = 52;
  const C = 2 * Math.PI * R;

  return (
    <motion.div
      onViewportEnter={() => setInView(true)}
      viewport={{ once: true, margin: "-60px" }}
      className="space-y-6"
    >
      <div className="font-mono text-[11px] tracking-widest text-dim">
        GROUP · 12 INTERVIEWERS
      </div>

      {/* A: skill gap heatmap */}
      <div className="space-y-2.5">
        {GAPS.map((g, i) => (
          <motion.div
            key={g.name}
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.12, duration: 0.45 }}
            className="flex items-center justify-between gap-4 rounded-xl border border-keycap-border bg-keycap/80 px-4 py-3"
          >
            <span className="text-sm text-body">{g.name}</span>
            <span
              className={`shrink-0 rounded-full border px-2.5 py-1 font-mono text-[11px] ${TONE[g.tone]}`}
            >
              {g.pct}% · {g.label}
            </span>
          </motion.div>
        ))}
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        {/* B: readiness ring */}
        <div className="flex flex-col items-center justify-center rounded-2xl border border-keycap-border bg-void/60 p-5">
          <div className="relative grid place-items-center">
            <svg width="132" height="132" className="-rotate-90">
              <circle cx="66" cy="66" r={R} className="fill-none stroke-white/10" strokeWidth="10" />
              <motion.circle
                cx="66"
                cy="66"
                r={R}
                className="fill-none stroke-cyan-400 drop-shadow-[0_0_10px_rgba(34,211,238,0.7)]"
                strokeWidth="10"
                strokeLinecap="round"
                strokeDasharray={C}
                initial={{ strokeDashoffset: C }}
                whileInView={{ strokeDashoffset: C * (1 - 0.78) }}
                viewport={{ once: true }}
                transition={{ duration: 1.4, ease: "easeOut" }}
              />
            </svg>
            <div className="absolute text-center">
              <div className="font-display text-2xl text-heading">{readiness}%</div>
              <div className="font-mono text-[10px] tracking-widest text-dim">READY</div>
            </div>
          </div>
          <p className="mt-3 text-center text-xs text-dim">Interviewer readiness</p>
        </div>

        {/* C: accuracy bars */}
        <div className="rounded-2xl border border-keycap-border bg-void/60 p-5">
          <div className="font-mono text-[10px] tracking-widest text-dim">
            DECISION ACCURACY · 6 WEEKS
          </div>
          <div className="mt-4 flex h-28 items-end justify-between gap-2">
            {WEEKS.map((w, i) => (
              <motion.div
                key={i}
                initial={{ height: 0 }}
                whileInView={{ height: `${w}%` }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.09, duration: 0.6, ease: "easeOut" }}
                className="w-full rounded-t-md bg-gradient-to-t from-blue-600/60 to-cyan-400 shadow-[0_0_14px_rgba(34,211,238,0.35)]"
              />
            ))}
          </div>
          <div className="mt-2 flex justify-between font-mono text-[10px] text-dim">
            {WEEKS.map((_, i) => (
              <span key={i}>W{i + 1}</span>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
