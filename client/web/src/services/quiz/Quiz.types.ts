import type { QuizSession } from "../../hooks/useQuizService.api";
import type { QuizDifficulty } from "../../storage";

export interface NotebookTopic {
  id: string;
  name: string;
}

export interface QuizGenerateOptions {
  topics: NotebookTopic[];
  prompt?: string;
  questionCount: number;
  difficulty: QuizDifficulty;
  quizType: string;
  timeLimit?: number; // minutes
}

export interface QuizCreatePayload {
  notebook: string; // notebook UUID
  topic: string;
  topic_id?: string; // UUID of the selected NotebookTopic
  difficulty: string;
  quiz_type: string;
  num_questions: number;
  time_limit?: number; // seconds
}

export interface QuizAnswerPayload {
  question_id: string;
  user_answer: string;
}

export interface QuizService {
  createQuizSession: (payload: QuizCreatePayload) => Promise<QuizSession>;
  deleteQuizSession: (quizId: string) => Promise<void>;
  fetchQuizSession: (quizId: string) => Promise<QuizSession>;
  submitQuiz: (
    quizId: string,
    answers: QuizAnswerPayload[],
  ) => Promise<QuizSession>;
  listFavoriteQuizzes: () => Promise<QuizSession[]>;
  listQuizSessionsByNotebook: (notebookId: string) => Promise<QuizSession[]>;
  retakePastQuiz: (quizId: string) => Promise<QuizSession>;
}
