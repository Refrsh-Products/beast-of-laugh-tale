import { useMemo } from "react";
import createFreshrApiInstance, {
  QuizServiceApiEndpoints,
} from "../services/freshr-api";
import type {
  QuizService,
  QuizCreatePayload,
  QuizAnswerPayload,
} from "../services/quiz/Quiz.types";
import useAxiosInterceptor from "./useAxiosInterceptor";
import { useFetch } from "./useFetch";

export interface QuizQuestion {
  id: string;
  question_text: string;
  question_type: string;
  choices: string[];
  correct_answer: string;
  explanation: string;
  user_answer: string;
  is_correct: boolean;
  time_taken: number;
  order_index: number;
}

export interface QuizSession {
  id?: string;
  notebook?: string;
  source_session?: string;
  title?: string;
  topic?: string;
  topics?: string[];
  difficulty?: string;
  quiz_type?: string;
  num_questions?: number;
  time_limit?: number;
  score?: number;
  status?: string;
  is_favourite?: boolean;
  started_at?: string;
  completed_at?: string;
  generated_at?: string;
  questions?: QuizQuestion[];
}

const useQuizServiceApi = (): QuizService => {
  const api = useMemo(() => createFreshrApiInstance(), []);
  const apiWithInterceptor = useAxiosInterceptor(api);
  const { fetchData } = useFetch(apiWithInterceptor);

  return {
    createQuizSession: async (payload: QuizCreatePayload) => {
      try {
        const { notebook, ...body } = payload;
        const response = await fetchData<QuizSession>(
          QuizServiceApiEndpoints.createQuizSession(notebook),
          "POST",
          body,
          { timeout: 120000 },
        );
        return response;
      } catch (err) {
        throw err;
      }
    },

    deleteQuizSession: async (quizId: string) => {
      try {
        await fetchData(
          QuizServiceApiEndpoints.deleteQuizSession(quizId),
          "DELETE",
        );
      } catch (err) {
        throw err;
      }
    },

    fetchQuizSession: async (quizId: string) => {
      try {
        const response = await fetchData<QuizSession>(
          QuizServiceApiEndpoints.getQuizSession(quizId),
          "GET",
        );
        return response;
      } catch (err) {
        throw err;
      }
    },

    submitQuiz: async (quizId: string, answers: QuizAnswerPayload[]) => {
      try {
        const response = await fetchData<QuizSession>(
          QuizServiceApiEndpoints.submitQuiz(quizId),
          "POST",
          { answers },
        );
        return response;
      } catch (err) {
        throw err;
      }
    },

    listFavoriteQuizzes: async () => {
      try {
        const response = await fetchData<QuizSession[]>(
          QuizServiceApiEndpoints.listFavouriteQuizzes,
          "GET",
        );
        return response;
      } catch (err) {
        throw err;
      }
    },

    listQuizSessionsByNotebook: async (notebook_id) => {
      try {
        const response = await fetchData<QuizSession[]>(
          QuizServiceApiEndpoints.listQuizSessionsByNotebook(notebook_id),
          "GET",
        );
        return response;
      } catch (err) {
        throw err;
      }
    },

    retakePastQuiz: async (quizId: string) => {
      try {
        const response = await fetchData<QuizSession>(
          QuizServiceApiEndpoints.retakeQuiz(quizId),
          "POST",
        );
        return response;
      } catch (err) {
        throw err;
      }
    },
  };
};

export default useQuizServiceApi;
