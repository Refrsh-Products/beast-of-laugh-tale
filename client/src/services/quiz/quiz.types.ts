import type { QuizAttempt, QuizDifficulty } from "../../storage";

export interface QuizGenerateOptions {
  topics: string[];
  prompt?: string;
  questionCount: number;
  difficulty: QuizDifficulty;
  timed: boolean;
  timeLimit?: number; // minutes
}

export interface QuizService {
  getTopics: (notebookId: string) => Promise<string[]>;
  getPreviousQuizzes: (notebookId: string) => Promise<QuizAttempt[]>;
  generateQuiz: (
    notebookId: string,
    options: QuizGenerateOptions,
  ) => Promise<QuizAttempt>;
  addAttempt: (notebookId: string, attempt: QuizAttempt) => void;
}
