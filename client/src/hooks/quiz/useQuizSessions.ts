import { useState, useEffect } from "react";
import useQuizService from "../../services/quiz";
import useNotebookService from "../../services/notebooks";
import type { ToastVariant } from "../useToast";
import type { UseQuizSessions } from "./useQuizSessions.type";
import type { QuizSession } from "../useQuizService.api";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import type { ActiveView } from "../../components/notebook/OptionsColumn";
import type { NotebookTopic } from "../../services/quiz/Quiz.types";

const useQuizSessions = (
  notebookId: string,
  showToast: (msg: string, variant: ToastVariant) => void,
  activeView: ActiveView,
  onUpgradeRequired: () => void,
  onTakeToChat: (formattedMessage: string) => void,
): UseQuizSessions & {
  quizTopics: NotebookTopic[];
  isLoadingTopics: boolean;
  previousQuizzes: QuizSession[];
  selectedQuiz: QuizSession | null;
  activeQuiz: QuizSession | null;
  isGeneratingQuiz: boolean;
} => {
  const quizService = useQuizService();
  const notebookService = useNotebookService();
  const navigate = useNavigate();

  const [isGeneratingQuiz, setIsGeneratingQuiz] = useState(false);
  const [quizTopics, setQuizTopics] = useState<NotebookTopic[]>([]);
  const [isLoadingTopics, setIsLoadingTopics] = useState(false);
  const [previousQuizzes, setPreviousQuizzes] = useState<QuizSession[]>([]);
  const [selectedQuiz, setSelectedQuiz] = useState<QuizSession | null>(null);
  const [activeQuiz, setActiveQuiz] = useState<QuizSession | null>(null);

  useEffect(() => {
    if (activeView !== "quiz") return;
    async function loadQuizData() {
      if (quizTopics.length === 0) {
        setIsLoadingTopics(true);
        try {
          const topics = await notebookService.listTopics(notebookId);
          setQuizTopics(topics);
        } catch (err) {
          console.error(err);
          setQuizTopics([]);
        } finally {
          setIsLoadingTopics(false);
        }
      }
      const quizzes = await quizService.listQuizSessionsByNotebook(notebookId);
      setPreviousQuizzes(quizzes);
    }
    loadQuizData();
  }, [activeView, notebookId]);

  return {
    quizTopics,
    isLoadingTopics,
    previousQuizzes,
    selectedQuiz,
    activeQuiz,
    isGeneratingQuiz,
    handleGenerateQuiz: async (options) => {
      setIsGeneratingQuiz(true);
      const isAllTopics = options.topics.length === 0 && !options.prompt;
      const payload = {
        notebook: notebookId,
        topic: isAllTopics
          ? "All Topics"
          : options.topics.map((t) => t.name).join(", "),
        topic_id: isAllTopics ? undefined : options.topics[0]?.id,
        difficulty: options.difficulty,
        quiz_type: options.quizType,
        time_limit: options.timeLimit ? options.timeLimit * 60 : undefined,
        num_questions: options.questionCount,
      };

      try {
        const quiz = await quizService.createQuizSession(payload);
        setSelectedQuiz(null);
        setActiveQuiz(quiz);
      } catch (err) {
        if (axios.isAxiosError(err) && err.response?.status === 403) {
          onUpgradeRequired();
        } else {
          showToast("Failed to generate quiz", "danger");
        }
      } finally {
        setIsGeneratingQuiz(false);
      }
    },

    handleQuizComplete: async (userAnswers, _timeTaken, _flaggedQuestions) => {
      if (!activeQuiz) return;
      const questions = activeQuiz.questions ?? [];
      const answers = questions
        .map((q, i) => {
          const selectedIndex = userAnswers[i];
          if (selectedIndex === null) return null;
          const resolvedChoices =
            q.choices.length > 0 ? q.choices : ["True", "False"];
          return {
            question_id: q.id,
            user_answer: resolvedChoices[selectedIndex],
          };
        })
        .filter(
          (a): a is { question_id: string; user_answer: string } => a !== null,
        );
      try {
        const completedQuiz = await quizService.submitQuiz(
          activeQuiz.id!,
          answers,
        );
        const quizzes =
          await quizService.listQuizSessionsByNotebook(notebookId);
        setPreviousQuizzes(quizzes);
        setActiveQuiz(null);
        setSelectedQuiz(completedQuiz);
      } catch {
        showToast("Failed to submit quiz", "danger");
      }
    },

    handleQuizExit: () => {
      navigate(`/notebook/${notebookId}`, { replace: true });
    },

    handleTakeToChat: (questionText, options, topic) => {
      const formatted = [
        `I'm studying ${topic} and I need help with this question:`,
        "",
        `"${questionText}"`,
        "",
        "Options were:",
        ...options.map((opt, i) => `${String.fromCharCode(65 + i)}) ${opt}`),
      ].join("\n");
      setActiveQuiz(null);
      onTakeToChat(formatted);
    },

    handleQuizClick: (quiz) => {
      setSelectedQuiz(quiz);
    },

    handleBackToGenerator: () => {
      setSelectedQuiz(null);
    },

    handleDeleteQuizSessions: async (ids) => {
      try {
        await Promise.all(ids.map((id) => quizService.deleteQuizSession(id)));
        setPreviousQuizzes((prev) => prev.filter((q) => !ids.includes(q.id!)));
        if (selectedQuiz && ids.includes(selectedQuiz.id!)) {
          setSelectedQuiz(null);
        }
      } catch {
        showToast("Failed to delete quiz sessions", "danger");
      }
    },

    handleRetakeQuiz: async () => {
      if (!selectedQuiz) return;
      setIsGeneratingQuiz(true);
      try {
        const quiz = await quizService.retakePastQuiz(selectedQuiz.id!);
        setSelectedQuiz(null);
        setActiveQuiz(quiz);
      } catch {
        showToast("Failed to generate quiz", "danger");
      } finally {
        setIsGeneratingQuiz(false);
      }
    },
  };
};

export default useQuizSessions;
