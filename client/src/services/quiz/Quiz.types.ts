import type { QuizSession } from "../../hooks/useQuizService.api";
import type { QuizDifficulty } from "../../storage";

/**
 * createQuizSession() - Take {topic, #ofQuestions, difficulty, quizType, timeLim} send to
 * POST /quizzes/ to generate a quiz session
 *
 * fetchQuizSession(quizID) - Get the information with questions for a specific quiz
 * GET /quizzes/[quizID], use this info to generate quiz modal
 *
 * submitQuiz(quizID) - Submit the quiz with quiz id, get the result and display it in the
 * results page
 * POST /quizzes/[quizID]/submit
 *
 * listFavoriteQuizzes(notebookID?) - List all the favourite quiz, optionally filter by NB
 * GET /quizzes/favourite
 *
 * listQuizSessions() - List all the quiz sessions
 * GET /quizzes/
 *
 * retakePastQuiz(quizID) - Retake a specific past quiz with id: quizID
 * POST /quizzes/[quizID]/retake
 */

export interface QuizGenerateOptions {
  topics: string[];
  prompt?: string;
  questionCount: number;
  difficulty: QuizDifficulty;
  quizType: string;
  timeLimit?: number; // minutes
}

export interface QuizCreatePayload {
  notebook: string; // notebook UUID
  topic: string;
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
  fetchQuizSession: (quizId: string) => Promise<QuizSession>;
  submitQuiz: (
    quizId: string,
    answers: QuizAnswerPayload[],
  ) => Promise<QuizSession>;
  listFavoriteQuizzes: () => Promise<QuizSession[]>;
  listQuizSessionsByNotebook: (notebookId: string) => Promise<QuizSession[]>;
  retakePastQuiz: (quizId: string) => Promise<QuizSession>;
}
