import type { QuizAttempt, QuizDifficulty, QuizQuestion } from "../../storage";
import { getMockTopics, getQuizAttempts, saveQuizAttempts, addQuizAttempt } from "../../storage";
import type { QuizGenerateOptions, QuizService } from "./quiz.types";

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
    const userAnswers = questions.map((q) =>
      Math.random() > 0.35 ? q.correct_index : (q.correct_index + 1) % 4,
    );
    const score = userAnswers.filter(
      (ans, i) => ans === questions[i].correct_index,
    ).length;
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
      time_taken: Math.floor(Math.random() * 600) + 60,
      score,
      questions,
      user_answers: userAnswers,
    };
    addQuizAttempt(notebookId, attempt);
    return attempt;
  },
};
