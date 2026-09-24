import { describe, expect, it } from "vitest";
import {
  aggregateTeam,
  completedBeforeStart,
  developmentAreas,
  isEligible,
  ratio,
  toCsv,
} from "@/lib/readiness/metrics";
import { computeAllProgress, type EvidenceItem } from "@/lib/readiness/scoring";

const now = Date.parse("2026-09-24T12:00:00Z");
const H = 3_600_000;
const iv = (over: Record<string, unknown> = {}) =>
  ({
    id: "i1",
    interviewer_id: "u1",
    starts_at: new Date(now + 24 * H).toISOString(),
    created_at: new Date(now - 24 * H).toISOString(),
    status: "scheduled",
    confirmation_status: "confirmed",
    ...over,
  }) as unknown as Parameters<typeof isEligible>[0];
const members = new Set(["u1"]);

describe("eligibility", () => {
  const from = now - 30 * 24 * H;
  const to = now + 30 * 24 * H;
  it("accepts confirmed, member, lead time ok", () => expect(isEligible(iv(), members, from, to)).toBe(true));
  it("excludes cancelled", () => expect(isEligible(iv({ status: "cancelled" }), members, from, to)).toBe(false));
  it("excludes unconfirmed", () => expect(isEligible(iv({ confirmation_status: "pending" }), members, from, to)).toBe(false));
  it("excludes non-members / owners", () => expect(isEligible(iv({ interviewer_id: "owner" }), members, from, to)).toBe(false));
  it("excludes less than 2 hours lead time", () =>
    expect(isEligible(iv({ created_at: new Date(now + 23 * H).toISOString() }), members, from, to)).toBe(false));
  it("excludes outside range", () =>
    expect(isEligible(iv({ starts_at: new Date(to + H).toISOString() }), members, from, to)).toBe(false));
});

describe("ratios & timing", () => {
  it("never divides by zero", () => expect(ratio(0, 0)).toEqual({ numerator: 0, denominator: 0, pct: null }));
  it("rounds", () => expect(ratio(1, 3).pct).toBe(33));
  it("completion after start is late", () => {
    const i = iv();
    const s = { completed_at: new Date(now + 25 * H).toISOString() } as Parameters<typeof completedBeforeStart>[1];
    expect(completedBeforeStart(i, s)).toBe(false);
  });
});

const e = (sub: string, correct: boolean, session: string, q: string, area: EvidenceItem["capability_area"] = "bias_mitigation"): EvidenceItem =>
  ({
    capability_area: area,
    sub_skill: sub,
    is_correct: correct,
    difficulty: "standard",
    recorded_at: new Date(now - 86_400_000).toISOString(),
    prep_session_id: session,
    prep_question_id: q,
  }) as EvidenceItem;

describe("development areas", () => {
  it("one wrong answer is never a development area", () => {
    expect(developmentAreas([e("affinity_bias", false, "s1", "q1")])).toHaveLength(0);
  });
  it("duplicate answers to one question do not count twice", () => {
    const xs = Array.from({ length: 10 }, () => e("affinity_bias", false, "s1", "q1"));
    expect(developmentAreas(xs).filter((d) => d.status === "active")).toHaveLength(0);
  });
});

describe("team aggregation", () => {
  it("suppresses below minimum group size", () => {
    const t = aggregateTeam([{ progress: computeAllProgress([]), evidence: [] }]);
    expect(t.every((x) => x.suppressed)).toBe(true);
  });
});

describe("csv export", () => {
  it("neutralises formula injection", () => {
    expect(toCsv([{ name: "=HYPERLINK(1)" }])).toContain("'=HYPERLINK");
  });
  it("rejects private columns", () => {
    expect(() => toCsv([{ candidate_email: "x" } as never])).toThrow();
  });
});
