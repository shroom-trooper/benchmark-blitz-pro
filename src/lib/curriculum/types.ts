export type Question = {
  scenario: string;
  options: string[];
  correctIndex: number;
  explanation: string;
};

export type WeekQuestions = Record<number, [Question, Question, Question]>;
