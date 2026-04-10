import type { QuizAttempt, QuizDifficulty, QuizQuestion } from "../../storage";
import { getMockTopics, getQuizAttempts, saveQuizAttempts, addQuizAttempt } from "../../storage";
import type { QuizGenerateOptions, QuizService } from "./quiz.types";

const LETTER = ["A", "B", "C", "D"];

function generateFakeQuestions(topics: string[], count: number): QuizQuestion[] {
  const questions: QuizQuestion[] = [];
  for (let i = 0; i < count; i++) {
    const topic = topics[i % Math.max(topics.length, 1)];
    const correctIndex = Math.floor(Math.random() * 4);
    questions.push({
      id: crypto.randomUUID(),
      question: `Sample question ${i + 1}: Which of the following best describes a key concept in ${topic}?`,
      options: [
        `${topic} — definition A`,
        `${topic} — definition B`,
        `${topic} — definition C`,
        `${topic} — definition D`,
      ],
      correct_index: correctIndex,
      // TODO(backend): real explanation is AI-generated during quiz creation
      explanation: `The correct answer is ${LETTER[correctIndex]}. In the context of ${topic}, definition ${LETTER[correctIndex]} most accurately captures the core principle as covered in your study materials. The other options describe related but distinct concepts that are often confused with this one.`,
    });
  }
  return questions;
}

function daysAgo(n: number): string {
  return new Date(Date.now() - n * 86400000).toISOString();
}

function makeSeedAttempt(
  notebookId: string,
  topics: string[],
  questionCount: number,
  difficulty: QuizDifficulty,
  score: number,
  timed: boolean,
  timeLimit: number | undefined,
  timeTaken: number,
  createdAt: string,
): QuizAttempt {
  const questions = generateFakeQuestions(topics, questionCount);
  const userAnswers = questions.map((q, i) =>
    i < score ? q.correct_index : (q.correct_index + 1) % 4,
  );
  return {
    id: crypto.randomUUID(),
    notebook_id: notebookId,
    created_at: createdAt,
    topics,
    question_count: questionCount,
    difficulty,
    timed,
    time_limit: timeLimit,
    time_taken: timeTaken,
    score,
    questions,
    user_answers: userAnswers,
    flagged_questions: [],
  };
}

function seedQuizzes(notebookId: string): void {
  if (getQuizAttempts(notebookId).length > 0) return;
  const seed: QuizAttempt[] = [
    makeSeedAttempt(notebookId, ["Machine Learning", "Neural Networks"], 10, "hard", 7, true, 15, 720, daysAgo(2)),
    makeSeedAttempt(notebookId, ["Calculus Derivatives", "Linear Algebra"], 5, "medium", 4, false, undefined, 310, daysAgo(5)),
    makeSeedAttempt(notebookId, ["DNA Replication", "Cell Division", "Photosynthesis"], 15, "easy", 13, true, 20, 840, daysAgo(10)),
    makeSeedAttempt(notebookId, ["World War II"], 10, "medium", 6, false, undefined, 540, daysAgo(18)),
  ];
  saveQuizAttempts(notebookId, seed);
}

export const QuizServiceMock: QuizService = {
  addAttempt(notebookId: string, attempt: QuizAttempt): void {
    addQuizAttempt(notebookId, attempt);
  },

  async getTopics(_notebookId: string): Promise<string[]> {
    await new Promise((r) => setTimeout(r, 300));
    return getMockTopics();
  },

  async getPreviousQuizzes(notebookId: string): Promise<QuizAttempt[]> {
    seedQuizzes(notebookId);
    return getQuizAttempts(notebookId);
  },

  async generateQuiz(
    notebookId: string,
    options: QuizGenerateOptions,
  ): Promise<QuizAttempt> {
    await new Promise((r) => setTimeout(r, 1200));
    const topicsForQuestions =
      options.topics.length > 0 ? options.topics : ["General"];
    const questions = generateFakeQuestions(topicsForQuestions, options.questionCount);
    const attempt: QuizAttempt = {
      id: crypto.randomUUID(),
      notebook_id: notebookId,
      created_at: new Date().toISOString(),
      topics: options.topics,
      prompt: options.prompt,
      question_count: options.questionCount,
      difficulty: options.difficulty,
      timed: options.timed,
      time_limit: options.timeLimit,
      time_taken: 0,
      score: 0,
      questions,
      user_answers: [],
      flagged_questions: [],
    };
    // Do NOT save yet — the quiz-taking screen will save on completion
    return attempt;
  },
};
