import type { AreaProgress } from "./scoring";

export type RecognitionInput = {
  completedPreps: number;
  /** Completed preparations finished at least ADVANCE_MINUTES before the interview. */
  advancePreps: number;
  lastSessionPerfect: boolean;
  progress: AreaProgress[];
  alreadyEarned: Set<string>;
};

export const ADVANCE_MINUTES = 60;
const ORDER = ["proficient", "advanced", "expert"];
const DEV_PLUS = ["developing", ...ORDER];

export const RECOGNITION_RULES: { code: string; test: (i: RecognitionInput) => boolean }[] = [
  { code: "prep_first", test: (i) => i.completedPreps >= 1 },
  { code: "prep_5", test: (i) => i.completedPreps >= 5 },
  { code: "prep_10", test: (i) => i.completedPreps >= 10 },
  { code: "prep_advance_3", test: (i) => i.advancePreps >= 3 },
  { code: "prep_perfect", test: (i) => i.lastSessionPerfect },
  { code: "area_proficient", test: (i) => i.progress.some((p) => ORDER.includes(p.mastery_stage)) },
  {
    code: "all_areas_developing",
    test: (i) => i.progress.length === 4 && i.progress.every((p) => DEV_PLUS.includes(p.mastery_stage)),
  },
];

/** Returns recognition codes newly earned. Non-repeatable: already earned codes are skipped. */
export function evaluateRecognition(input: RecognitionInput): string[] {
  return RECOGNITION_RULES.filter((r) => !input.alreadyEarned.has(r.code) && r.test(input)).map(
    (r) => r.code,
  );
}
