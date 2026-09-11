import type { Question, WeekQuestions } from "../types";
import { recruiterQ1 } from "./q1";
import { recruiterQ2 } from "./q2";
import { recruiterQ3 } from "./q3";
import { recruiterQ4 } from "./q4";

export const recruiterQuestionsByWeek: WeekQuestions = {
  ...recruiterQ1,
  ...recruiterQ2,
  ...recruiterQ3,
  ...recruiterQ4,
};

export function getRecruiterQuestionsForWeek(week: number): Question[] {
  return recruiterQuestionsByWeek[week] ?? [];
}
