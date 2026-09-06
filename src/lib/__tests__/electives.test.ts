import { describe, expect, it } from "vitest";
import {
  CATEGORY_META,
  CATEGORY_ORDER,
  ELECTIVE_MODULES,
  TOTAL_ELECTIVE_LESSONS,
  getLesson,
  getModule,
} from "@/lib/electives";

describe("elective library data", () => {
  it("has unique module slugs and non-empty metadata", () => {
    const slugs = new Set<string>();
    for (const m of ELECTIVE_MODULES) {
      expect(slugs.has(m.slug), `duplicate module ${m.slug}`).toBe(false);
      slugs.add(m.slug);
      expect(m.slug).toMatch(/^[a-z0-9-]+$/);
      expect(m.title.trim().length).toBeGreaterThan(2);
      expect(m.summary.trim().length).toBeGreaterThan(10);
      expect(m.audience.trim().length).toBeGreaterThan(2);
      expect(m.artifact.trim().length).toBeGreaterThan(2);
      expect(m.objectives.length).toBeGreaterThan(0);
      expect(CATEGORY_ORDER).toContain(m.category);
      expect(CATEGORY_META[m.category]).toBeDefined();
    }
  });

  it("has unique lesson slugs with 3 valid questions each", () => {
    let lessons = 0;
    for (const m of ELECTIVE_MODULES) {
      const seen = new Set<string>();
      expect(m.lessons.length, `${m.slug} has no lessons`).toBeGreaterThan(0);
      for (const l of m.lessons) {
        lessons += 1;
        expect(seen.has(l.slug), `duplicate lesson ${m.slug}/${l.slug}`).toBe(false);
        seen.add(l.slug);
        expect(l.slug).toMatch(/^[a-z0-9-]+$/);
        expect(l.title.trim().length).toBeGreaterThan(2);
        expect(l.focus.trim().length).toBeGreaterThan(2);
        expect(l.questions.length, `${m.slug}/${l.slug}`).toBe(3);
        l.questions.forEach((q, i) => {
          const id = `${m.slug}/${l.slug} q${i + 1}`;
          expect(q.scenario.trim().length, id).toBeGreaterThan(10);
          expect(q.explanation.trim().length, id).toBeGreaterThan(10);
          expect(q.options.length, id).toBeGreaterThanOrEqual(2);
          expect(new Set(q.options).size, `${id} duplicate options`).toBe(
            q.options.length,
          );
          expect(q.correctIndex, id).toBeGreaterThanOrEqual(0);
          expect(q.correctIndex, id).toBeLessThan(q.options.length);
        });
      }
    }
    expect(lessons).toBe(TOTAL_ELECTIVE_LESSONS);
  });

  it("resolves modules and lessons by slug, and returns undefined for unknown ids", () => {
    const first = ELECTIVE_MODULES[0]!;
    expect(getModule(first.slug)?.slug).toBe(first.slug);
    expect(getModule("does-not-exist")).toBeUndefined();
    expect(getLesson(first.slug, first.lessons[0]!.slug)?.lesson.slug).toBe(
      first.lessons[0]!.slug,
    );
    expect(getLesson(first.slug, "nope")).toBeUndefined();
    expect(getLesson("nope", "nope")).toBeUndefined();
  });
});
