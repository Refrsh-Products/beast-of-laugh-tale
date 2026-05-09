import type { QuizGenerateOptions } from "../../services/quiz/Quiz.types";
import type { QuizSession } from "../useQuizService.api";

export interface UseQuizSessions {
  handleGenerateQuiz(options: QuizGenerateOptions): Promise<void>;
  handleQuizComplete(
    userAnswers: (number | null)[],
    _timeTaken: number,
    _flaggedQuestions: number[],
  ): Promise<void>;
  handleQuizExit(): void;
  handleTakeToChat(
    questionText: string,
    options: string[],
    topic: string,
  ): void;
  handleQuizClick(quiz: QuizSession): void;
  handleBackToGenerator(): void;
  handleDeleteQuizSessions(ids: string[]): Promise<void>;
  handleRetakeQuiz(): Promise<void>;
}
