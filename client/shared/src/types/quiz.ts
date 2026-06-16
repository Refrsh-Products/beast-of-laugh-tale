/**
 * Quiz API DTOs (server shape). Previously defined inline in
 * `web/src/hooks/useQuizService.api.ts`; that hook now re-exports from here.
 *
 * Note: distinct from the localStorage mock's `QuizQuestion`/`QuizAttempt` in
 * `web/src/storage.ts`, which model the legacy mock DB.
 */

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
