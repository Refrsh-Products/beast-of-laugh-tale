import type { QuizSession, QuizQuestion } from "@freshr/shared";
import type {
  QuizAnswerPayload,
  QuizCreatePayload,
  QuizService,
} from "@freshr/shared";

// In-memory store keyed by session id
const mockStore = new Map<string, QuizSession>();
let seeded = false;

function makeChoices(topic: string): string[] {
  return [
    `${topic} — definition A`,
    `${topic} — definition B`,
    `${topic} — definition C`,
    `${topic} — definition D`,
  ];
}

function generateFakeQuestions(topic: string, count: number, score?: number): QuizQuestion[] {
  const correctCount = score !== undefined ? Math.round(score * count) : 0;
  const correctIndices = new Set<number>();
  while (correctIndices.size < correctCount) {
    correctIndices.add(Math.floor(Math.random() * count));
  }

  const questions: QuizQuestion[] = [];
  for (let i = 0; i < count; i++) {
    const choices = makeChoices(topic);
    const correctIndex = Math.floor(Math.random() * 4);
    const correctAnswer = choices[correctIndex];
    const isCorrect = correctIndices.has(i);
    const wrongChoices = choices.filter((_, ci) => ci !== correctIndex);
    const userAnswer = isCorrect
      ? correctAnswer
      : wrongChoices[Math.floor(Math.random() * wrongChoices.length)];

    questions.push({
      id: crypto.randomUUID(),
      question_text: `Sample question ${i + 1}: Which best describes a key concept in ${topic}?`,
      question_type: "multiple_choice",
      choices,
      correct_answer: correctAnswer,
      explanation: `The correct answer is "${correctAnswer}". This is the most accurate description of the core principle in ${topic}.`,
      user_answer: userAnswer,
      is_correct: isCorrect,
      time_taken: 0,
      order_index: i,
    });
  }
  return questions;
}

function daysAgo(n: number): string {
  return new Date(Date.now() - n * 86_400_000).toISOString();
}

function makeSeedSession(
  notebookId: string,
  topic: string,
  difficulty: string,
  quizType: string,
  numQuestions: number,
  timeLimit: number | undefined,
  score: number,
  isFavourite: boolean,
  generatedAt: string,
): QuizSession {
  const id = crypto.randomUUID();
  const questions = generateFakeQuestions(topic, numQuestions, score);
  return {
    id,
    notebook: notebookId,
    topic,
    difficulty,
    quiz_type: quizType,
    num_questions: numQuestions,
    time_limit: timeLimit,
    score,
    status: "completed",
    is_favourite: isFavourite,
    generated_at: generatedAt,
    completed_at: generatedAt,
    questions,
  };
}

function seedIfEmpty(notebookId: string): void {
  if (seeded) return;
  seeded = true;

  const sessions: QuizSession[] = [
    makeSeedSession(
      notebookId,
      "Machine Learning",
      "hard",
      "standard",
      10,
      900,
      0.7,
      true,
      daysAgo(2),
    ),
    makeSeedSession(
      notebookId,
      "Linear Algebra",
      "medium",
      "standard",
      5,
      undefined,
      0.8,
      false,
      daysAgo(5),
    ),
    makeSeedSession(
      notebookId,
      "Cell Biology",
      "easy",
      "standard",
      15,
      1200,
      0.867,
      true,
      daysAgo(10),
    ),
    makeSeedSession(
      notebookId,
      "World War II",
      "medium",
      "standard",
      10,
      undefined,
      0.6,
      false,
      daysAgo(18),
    ),
  ];

  for (const s of sessions) {
    mockStore.set(s.id!, s);
  }
}

export const QuizServiceMock: QuizService = {
  async listQuizSessionsByNotebook(): Promise<QuizSession[]> {
    seedIfEmpty("mock-notebook-id");
    await delay(300);
    return [...mockStore.values()];
  },

  async createQuizSession(payload: QuizCreatePayload): Promise<QuizSession> {
    await delay(1200);
    const id = crypto.randomUUID();
    const questions = generateFakeQuestions(
      payload.topic,
      payload.num_questions,
    );
    const session: QuizSession = {
      id,
      notebook: payload.notebook,
      topic: payload.topic,
      topics: ["topic 1", "topic 2", "topic 3"],
      difficulty: payload.difficulty,
      quiz_type: payload.quiz_type,
      num_questions: payload.num_questions,
      time_limit: payload.time_limit,
      score: 0,
      status: "pending",
      // Ready immediately in the mock — the async poll resolves on first tick.
      generation_status: "COMPLETED",
      is_favourite: false,
      generated_at: new Date().toISOString(),
      questions,
    };
    mockStore.set(id, session);
    return session;
  },

  async fetchQuizSession(quizId: string): Promise<QuizSession> {
    await delay(200);
    const session = mockStore.get(quizId);
    if (!session) throw new Error(`Quiz session ${quizId} not found`);
    return session;
  },

  async submitQuiz(
    quizId: string,
    answers: QuizAnswerPayload[],
  ): Promise<QuizSession> {
    await delay(400);
    const session = mockStore.get(quizId);
    if (!session) throw new Error(`Quiz session ${quizId} not found`);

    const answerMap = new Map(
      answers.map((a) => [a.question_id, a.user_answer]),
    );
    let correct = 0;

    const updatedQuestions = (session.questions ?? []).map((q) => {
      const userAnswer = answerMap.get(q.id) ?? "";
      const isCorrect = userAnswer === q.correct_answer;
      if (isCorrect) correct++;
      return { ...q, user_answer: userAnswer, is_correct: isCorrect };
    });

    const updated: QuizSession = {
      ...session,
      questions: updatedQuestions,
      score: correct / (session.num_questions ?? 1),
      status: "completed",
      completed_at: new Date().toISOString(),
    };
    mockStore.set(quizId, updated);
    return updated;
  },

  async listFavoriteQuizzes(): Promise<QuizSession[]> {
    await delay(300);
    return [...mockStore.values()].filter((s) => s.is_favourite);
  },

  async deleteQuizSession(quizId: string): Promise<void> {
    await delay(200);
    mockStore.delete(quizId);
  },

  async retakePastQuiz(quizId: string): Promise<QuizSession> {
    await delay(800);
    const original = mockStore.get(quizId);
    if (!original) throw new Error(`Quiz session ${quizId} not found`);

    const id = crypto.randomUUID();
    const questions = generateFakeQuestions(
      original.topic ?? "General",
      original.num_questions ?? 5,
    );
    const retake: QuizSession = {
      ...original,
      id,
      source_session: quizId,
      score: 0,
      status: "pending",
      generated_at: new Date().toISOString(),
      completed_at: undefined,
      questions: questions.map((q) => ({
        ...q,
        user_answer: "",
        is_correct: false,
      })),
    };
    mockStore.set(id, retake);
    return retake;
  },
};

function delay(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}
