import { QuizServiceMock } from "./quiz.mock";
import type { QuizService } from "./quiz.types";

const useMock = import.meta.env.VITE_USE_MOCK === "true";

export default function useQuizService(): QuizService {
  if (useMock) return QuizServiceMock;
  return QuizServiceMock; // TODO: replace with real API service when backend is ready
}

export type { QuizGenerateOptions } from "./quiz.types";
