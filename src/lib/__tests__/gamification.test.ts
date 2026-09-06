import { afterEach, describe, expect, it, vi } from "vitest";
import {
  LEVELS,
  MAX_STREAK_BONUS_WEEKS,
  PERFECT_BONUS,
  SPRINT_PERFECT_BONUS,
  SPRINT_XP_PER_CORRECT,
  STREAK_BONUS_PER_WEEK,
  TOTAL_WEEKS,
  XP_PER_CORRECT,
  computeXp,
  levelForXp,
  levelProgress,
  nextLevel,
  nextUnlockAt,
  sprintMultiplier,
  unlockedWeekFor,
} from "@/lib/gamification";

afterEach(() => vi.useRealTimers());

describe("levels", () => {
  it("is a strictly increasing ladder starting at 0 XP", () => {
    expect(LEVELS[0]!.minXp).toBe(0);
    for (let i = 1; i < LEVELS.length; i += 1) {
      expect(LEVELS[i]!.minXp).toBeGreaterThan(LEVELS[i - 1]!.minXp);
      expect(LEVELS[i]!.level).toBe(LEVELS[i - 1]!.level + 1);
    }
  });

  it("maps XP to the right level, including edges and junk input", () => {
    expect(levelForXp(0).level).toBe(1);
    expect(levelForXp(199).level).toBe(1);
    expect(levelForXp(200).level).toBe(2);
    expect(levelForXp(-50).level).toBe(1);
    expect(levelForXp(999_999).level).toBe(LEVELS.at(-1)!.level);
  });

  it("reports progress within a level and caps at the top", () => {
    const mid = levelProgress(350);
    expect(mid.current.level).toBe(2);
    expect(mid.next?.level).toBe(3);
    expect(mid.pct).toBeGreaterThan(0);
    expect(mid.pct).toBeLessThan(100);

    const top = levelProgress(999_999);
    expect(top.next).toBeNull();
    expect(top.pct).toBe(100);
    expect(nextLevel(999_999)).toBeNull();
  });
});

describe("weekly XP", () => {
  it("awards base XP per correct answer", () => {
    expect(computeXp(0, 0).total).toBe(0);
    expect(computeXp(1, 0).base).toBe(XP_PER_CORRECT);
    expect(computeXp(2, 0).perfect).toBe(0);
  });

  it("awards the perfect bonus only on 3/3", () => {
    expect(computeXp(3, 0).perfect).toBe(PERFECT_BONUS);
    expect(computeXp(3, 0).total).toBe(3 * XP_PER_CORRECT + PERFECT_BONUS);
  });

  it("caps the streak bonus", () => {
    expect(computeXp(0, 1).streakBonus).toBe(STREAK_BONUS_PER_WEEK);
    expect(computeXp(0, 99).streakBonus).toBe(
      MAX_STREAK_BONUS_WEEKS * STREAK_BONUS_PER_WEEK,
    );
  });
});

describe("rolling weekly release", () => {
  it("opens week 1 at signup and a new week every 7 days", () => {
    vi.useFakeTimers();
    const signup = new Date("2026-01-01T00:00:00.000Z");
    vi.setSystemTime(signup);
    const iso = signup.toISOString();
    expect(unlockedWeekFor(iso)).toBe(1);

    vi.setSystemTime(new Date("2026-01-07T23:00:00.000Z"));
    expect(unlockedWeekFor(iso)).toBe(1);

    vi.setSystemTime(new Date("2026-01-08T01:00:00.000Z"));
    expect(unlockedWeekFor(iso)).toBe(2);

    vi.setSystemTime(new Date("2030-01-01T00:00:00.000Z"));
    expect(unlockedWeekFor(iso)).toBe(TOTAL_WEEKS);
    expect(nextUnlockAt(iso)).toBeNull();
  });

  it("degrades gracefully on missing or corrupt timestamps", () => {
    expect(unlockedWeekFor(null)).toBe(1);
    expect(unlockedWeekFor(undefined)).toBe(1);
    expect(unlockedWeekFor("not-a-date")).toBe(1);
    expect(nextUnlockAt("not-a-date")).toBeNull();
    expect(nextUnlockAt(null)).toBeNull();
  });
});

describe("sprint scoring", () => {
  it("uses the documented sprint values", () => {
    expect(SPRINT_XP_PER_CORRECT).toBe(20);
    expect(SPRINT_PERFECT_BONUS).toBe(10);
  });

  it("applies the daily-streak multiplier tiers", () => {
    expect(sprintMultiplier(0)).toBe(1);
    expect(sprintMultiplier(2)).toBe(1);
    expect(sprintMultiplier(3)).toBe(1.25);
    expect(sprintMultiplier(6)).toBe(1.25);
    expect(sprintMultiplier(7)).toBe(1.5);
    expect(sprintMultiplier(100)).toBe(1.5);
  });
});
