export type LevelDef = { level: number; title: string; minXp: number };

export const LEVELS: LevelDef[] = [
  { level: 1, title: "Novice Interviewer", minXp: 0 },
  { level: 2, title: "Structured Starter", minXp: 200 },
  { level: 3, title: "Evidence Gatherer", minXp: 500 },
  { level: 4, title: "Calibrated Assessor", minXp: 900 },
  { level: 5, title: "Bias Aware", minXp: 1400 },
  { level: 6, title: "Signal Reader", minXp: 2000 },
  { level: 7, title: "Panel Leader", minXp: 2800 },
  { level: 8, title: "Talent Strategist", minXp: 3800 },
  { level: 9, title: "Hiring Coach", minXp: 5000 },
  { level: 10, title: "Master Bar Raiser", minXp: 6500 },
];

export const XP_PER_CORRECT = 100;
export const PERFECT_BONUS = 50;
export const STREAK_BONUS_PER_WEEK = 10;
export const MAX_STREAK_BONUS_WEEKS = 10;

export function levelForXp(totalXp: number): LevelDef {
  let current = LEVELS[0]!;
  for (const l of LEVELS) if (totalXp >= l.minXp) current = l;
  return current;
}

export function nextLevel(totalXp: number): LevelDef | null {
  return LEVELS.find((l) => l.minXp > totalXp) ?? null;
}

export function levelProgress(totalXp: number): {
  current: LevelDef;
  next: LevelDef | null;
  pct: number;
  xpIntoLevel: number;
  xpForLevel: number;
} {
  const current = levelForXp(totalXp);
  const next = nextLevel(totalXp);
  if (!next) {
    return { current, next: null, pct: 100, xpIntoLevel: 0, xpForLevel: 0 };
  }
  const xpForLevel = next.minXp - current.minXp;
  const xpIntoLevel = totalXp - current.minXp;
  return {
    current,
    next,
    xpIntoLevel,
    xpForLevel,
    pct: Math.min(100, Math.round((xpIntoLevel / xpForLevel) * 100)),
  };
}

export function computeXp(correctCount: number, streakWeeks: number) {
  const base = correctCount * XP_PER_CORRECT;
  const perfect = correctCount === 3 ? PERFECT_BONUS : 0;
  const streakBonus =
    Math.min(streakWeeks, MAX_STREAK_BONUS_WEEKS) * STREAK_BONUS_PER_WEEK;
  return { base, perfect, streakBonus, total: base + perfect + streakBonus };
}

export const QUARTER_THEMES: Record<number, { name: string; blurb: string }> = {
  1: {
    name: "Interview Fundamentals",
    blurb: "Structure, behavioural questioning and evidence capture.",
  },
  2: {
    name: "Bias & Inclusive Hiring",
    blurb: "Recognising and interrupting evaluation bias.",
  },
  3: {
    name: "Candidate Experience & Process",
    blurb: "Experience, speed, assessment design and calibration.",
  },
  4: {
    name: "Strategic Talent Leadership",
    blurb: "Leadership hiring, workforce planning and capability building.",
  },
};

export function quarterForWeek(week: number): number {
  if (week <= 13) return 1;
  if (week <= 26) return 2;
  if (week <= 39) return 3;
  return 4;
}
