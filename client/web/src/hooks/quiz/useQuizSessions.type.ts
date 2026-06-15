import type { QuizGenerateOptions } from "@freshr/shared";
import type { QuizSession } from "@freshr/shared";

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
