import type { ServiceDeps } from "../platform/deps";
import type { QuizDifficulty } from "../types/entities";
import type { QuizSession } from "../types/quiz";
import { QuizServiceApiEndpoints } from "./endpoints";

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

export function createQuizService(deps: ServiceDeps): QuizService {
  const { http } = deps;

  return {
    createQuizSession: async (payload: QuizCreatePayload) => {
      const { notebook, ...body } = payload;
      return await http.request<QuizSession>(
        QuizServiceApiEndpoints.createQuizSession(notebook),
        "POST",
        body,
        { timeout: 120000 },
      );
    },

    deleteQuizSession: async (quizId: string) => {
      await http.request(
        QuizServiceApiEndpoints.deleteQuizSession(quizId),
        "DELETE",
      );
    },

    fetchQuizSession: async (quizId: string) => {
      return await http.request<QuizSession>(
        QuizServiceApiEndpoints.getQuizSession(quizId),
        "GET",
      );
    },

    submitQuiz: async (quizId: string, answers: QuizAnswerPayload[]) => {
      return await http.request<QuizSession>(
        QuizServiceApiEndpoints.submitQuiz(quizId),
        "POST",
        { answers },
      );
    },

    listFavoriteQuizzes: async () => {
      return await http.request<QuizSession[]>(
        QuizServiceApiEndpoints.listFavouriteQuizzes,
        "GET",
      );
    },

    listQuizSessionsByNotebook: async (notebook_id) => {
      return await http.request<QuizSession[]>(
        QuizServiceApiEndpoints.listQuizSessionsByNotebook(notebook_id),
        "GET",
      );
    },

    retakePastQuiz: async (quizId: string) => {
      return await http.request<QuizSession>(
        QuizServiceApiEndpoints.retakeQuiz(quizId),
        "POST",
      );
    },
  };
}
