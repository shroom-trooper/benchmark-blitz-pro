import { describe, expect, it } from "vitest";
import { questionsByWeek, getQuestionsForWeek } from "@/lib/curriculum";
import { TOTAL_WEEKS, quarterForWeek } from "@/lib/gamification";

const weeks = Object.keys(questionsByWeek).map(Number);

describe("core curriculum data", () => {
  it("covers every week from 1 to 52 exactly once", () => {
    expect(weeks.length).toBe(TOTAL_WEEKS);
    for (let w = 1; w <= TOTAL_WEEKS; w += 1) {
      expect(questionsByWeek[w], `week ${w} missing`).toBeDefined();
    }
  });

  it("has exactly 3 well-formed questions per week", () => {
    for (const w of weeks) {
      const qs = questionsByWeek[w]!;
      expect(qs.length, `week ${w}`).toBe(3);
      qs.forEach((q, i) => {
        const id = `week ${w} question ${i + 1}`;
        expect(q.scenario.trim().length, id).toBeGreaterThan(10);
        expect(q.explanation.trim().length, id).toBeGreaterThan(10);
        expect(q.options.length, id).toBeGreaterThanOrEqual(2);
        expect(new Set(q.options).size, `${id} duplicate options`).toBe(
          q.options.length,
        );
        q.options.forEach((o) => expect(o.trim().length, id).toBeGreaterThan(0));
        expect(q.correctIndex, id).toBeGreaterThanOrEqual(0);
        expect(q.correctIndex, id).toBeLessThan(q.options.length);
      });
    }
  });

  it("returns an empty array for out-of-range weeks", () => {
    expect(getQuestionsForWeek(0)).toEqual([]);
    expect(getQuestionsForWeek(53)).toEqual([]);
    expect(getQuestionsForWeek(Number.NaN)).toEqual([]);
  });

  it("maps every week to a quarter between 1 and 4", () => {
    for (let w = 1; w <= TOTAL_WEEKS; w += 1) {
      const q = quarterForWeek(w);
      expect(q).toBeGreaterThanOrEqual(1);
      expect(q).toBeLessThanOrEqual(4);
    }
  });
});
