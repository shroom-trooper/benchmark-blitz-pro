import type { Question, WeekQuestions } from "./types";
import { q1Questions } from "./q1";
import { q2Questions } from "./q2";
import { q3Questions } from "./q3";
import { q4Questions } from "./q4";

export type { Question, WeekQuestions };

export const questionsByWeek: WeekQuestions = {
  ...q1Questions,
  ...q2Questions,
  ...q3Questions,
  ...q4Questions,
};

export function getQuestionsForWeek(week: number): Question[] {
  return questionsByWeek[week] ?? [];
}
