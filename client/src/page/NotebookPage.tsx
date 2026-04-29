import { useState, useEffect } from "react";
import axios from "axios";
import {
  useParams,
  useNavigate,
  Navigate,
  useSearchParams,
} from "react-router-dom";
import useAuthService from "../services/auth";
import useNotebookService from "../services/notebooks";
import type { Notebook, NotebookFile } from "../storage";
import type {
  QuizGenerateOptions,
  NotebookTopic,
} from "../services/quiz/Quiz.types";

import NotebookTitle from "../components/notebook/NotebookTitle";
import FilesColumn, {
  type FileUploadState,
} from "../components/notebook/FilesColumn";
import ChatColumn from "../components/notebook/ChatColumn";
import OptionsColumn, {
  type ActiveView,
} from "../components/notebook/OptionsColumn";
import QuizReviewColumn from "../components/notebook/QuizReviewColumn";
import QuizTakingScreen from "../components/notebook/QuizTakingScreen";
import PastQuizColumn from "../components/notebook/PastQuizColumn";
import QuizColumn from "../components/notebook/QuizColumn";
import PresentationColumn, { type PresentationGenerateOptions } from "../components/notebook/PresentationColumn";
import PastPresentationsColumn from "../components/notebook/PastPresentationsColumn";
import UpgradeModal from "../components/dashboard/UpgradeModal";
import ToastContainer from "../components/ui/ToastContainer";
import { useToast } from "../hooks/useToast";
import useChatService from "../services/chat";
import useQuizService from "../services/quiz";
import usePresentationService from "../services/presentation";
import type { QuizSession } from "../hooks/useQuizService.api";
import type { PresentationSession } from "../services/presentation/Presentation.types";

const B = "#000000";
const W = "#FFFFFF";

export default function NotebookPage() {
  const { id } = useParams<{ id: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const authService = useAuthService();
  const notebookService = useNotebookService();
  const chatService = useChatService();
  const quizService = useQuizService();
  const presentationService = usePresentationService();
  const navigate = useNavigate();
  const { toasts, showToast } = useToast();

  const [notebook, setNotebook] = useState<Notebook | null>(null);
  const [files, setFiles] = useState<NotebookFile[]>([]);
  const [isGeneratingQuiz, setIsGeneratingQuiz] = useState(false);
  const [activeView, setActiveView] = useState<ActiveView>("chat");
  const [quizTopics, setQuizTopics] = useState<NotebookTopic[]>([]);
  const [isLoadingTopics, setIsLoadingTopics] = useState(false);
  const [previousQuizzes, setPreviousQuizzes] = useState<QuizSession[]>([]);
  const [presentationTopics, setPresentationTopics] = useState<NotebookTopic[]>([]);
  const [isLoadingPresentationTopics, setIsLoadingPresentationTopics] = useState(false);
  const [isGeneratingPresentation, setIsGeneratingPresentation] = useState(false);
  const [presentations, setPresentations] = useState<PresentationSession[]>([]);
  const [selectedQuiz, setSelectedQuiz] = useState<QuizSession | null>(null);
  const [activeQuiz, setActiveQuiz] = useState<QuizSession | null>(null);
  const [pendingChatInput, setPendingChatInput] = useState<string>("");
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<FileUploadState[]>([]);
  const [chatSessions, setChatSessions] = useState<
    Awaited<ReturnType<typeof chatService.listChatSessions>>
  >([]);

  const notebookId = id ?? "";

  const hasProcessingFiles = files.some(
    (f) =>
      f.ingestion_status === "pending" || f.ingestion_status === "processing",
  );
  const hasReadyFiles = files.some((f) => f.ingestion_status === "ready");

  // Poll file list every 3s while any file is still being ingested
  useEffect(() => {
    if (!hasProcessingFiles) return;
    const interval = setInterval(async () => {
      try {
        const updated = await notebookService.listFiles(notebookId);
        setFiles([...updated]);
      } catch {}
    }, 3000);
    return () => clearInterval(interval);
  }, [hasProcessingFiles, notebookId]);

  useEffect(() => {
    async function load() {
      try {
        const found = await notebookService.getNotebook(notebookId);
        if (!found) {
          setNotFound(true);
          return;
        }
        setNotebook(found);

        try {
          const files = await notebookService.listFiles(notebookId);
          setFiles([...files]);
        } catch (err) {
          showToast("Failed to load files", "danger");
        }
      } catch (err) {
        console.error("[NotebookPage] load() error:", err);
        setNotFound(true);
      }

      try {
        const sessions = await chatService.listChatSessions(notebookId);
        setChatSessions(sessions);
      } catch (err) {
        showToast("Failed to load chat sessions", "danger");
      }
    }
    load();
  }, [notebookId]);

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

  useEffect(() => {
    if (activeView !== "presentation") return;
    async function loadPresentationData() {
      if (presentationTopics.length === 0) {
        setIsLoadingPresentationTopics(true);
        try {
          const topics = await notebookService.listTopics(notebookId);
          setPresentationTopics(topics);
        } catch (err) {
          console.error(err);
          setPresentationTopics([]);
        } finally {
          setIsLoadingPresentationTopics(false);
        }
      }
      try {
        const existing = await presentationService.listPresentations(notebookId);
        setPresentations(existing);
      } catch (err) {
        console.error(err);
      }
    }
    loadPresentationData();
  }, [activeView, notebookId]);

  if (!authService.isLoggedIn()) return <Navigate to="/login" replace />;

  if (notFound) return <Navigate to="/dashboard" replace />;

  async function handleTitleSave(newTitle: string) {
    if (!notebook) return;
    await notebookService.update(notebookId, { title: newTitle });
    setNotebook((prev) => (prev ? { ...prev, title: newTitle } : prev));
    showToast("Notebook renamed", "neutral");
  }

  async function handleUpload(uploaded: File[]) {
    setUploadProgress(
      uploaded.map((f) => ({ name: f.name, status: "uploading" })),
    );

    let successCount = 0;

    await Promise.all(
      uploaded.map(async (file, i) => {
        try {
          const response = await notebookService.createFile(notebookId, file);
          if (!response.success) {
            const errMsg =
              Array.isArray(response.errors) && response.errors.length
                ? (response.errors as string[]).join(", ")
                : "Upload failed";
            setUploadProgress((prev) =>
              prev.map((p, idx) =>
                idx === i ? { ...p, status: "error", error: errMsg } : p,
              ),
            );
            showToast(`${file.name}: ${errMsg}`, "danger");
          } else {
            successCount++;
            setUploadProgress((prev) =>
              prev.map((p, idx) => (idx === i ? { ...p, status: "done" } : p)),
            );
          }
        } catch (err) {
          const errMsg =
            (err as any)?.response?.data?.detail ??
            (err instanceof Error ? err.message : "Upload failed");
          setUploadProgress((prev) =>
            prev.map((p, idx) =>
              idx === i ? { ...p, status: "error", error: errMsg } : p,
            ),
          );
          showToast(errMsg, "danger");
        }
      }),
    );

    if (successCount > 0) {
      showToast(
        `${successCount} file${successCount > 1 ? "s" : ""} uploaded`,
        "success",
      );
      try {
        setFiles(await notebookService.listFiles(notebookId));
      } catch {}
    }

    setTimeout(
      () =>
        setUploadProgress((prev) => prev.filter((p) => p.status === "error")),
      2000,
    );
    setTimeout(() => setUploadProgress([]), 6000);
  }

  async function handleDeleteSelected(ids: string[]) {
    try {
      await Promise.all(
        ids.map((id) => notebookService.deleteFile(notebookId, id)),
      );
      setFiles((prev) => prev.filter((f) => !ids.includes(f.id)));
      showToast(
        `${ids.length} file${ids.length > 1 ? "s" : ""} deleted`,
        "danger",
      );
    } catch {}
  }

  async function handleSendMessage(
    message: string,
    onChunk?: (text: string) => void,
  ): Promise<{ reply: string; sessionId: string }> {
    if (files.length === 0) {
      showToast("Upload lecture notes before chatting", "danger");
      throw new Error("no files");
    }
    if (!hasReadyFiles) {
      showToast("Your files are still being indexed. Please wait...", "danger");
      throw new Error("files processing");
    }
    {
      let sessionId = activeSessionId;
      const sessionExists = chatSessions.some((s) => s.id === sessionId);

      if (!sessionId || !sessionExists) {
        const session = await chatService.createChatSession(notebookId);
        sessionId = session.id;
        setChatSessions((prev) => [...prev, session]);
        // URL update is intentionally left to ChatColumn via onSessionCreated
      }

      await chatService.createChatSessionMessage(sessionId, message);

      // Stream AI response
      let fullReply = "";
      await chatService.streamChatReply(sessionId, (chunk) => {
        fullReply += chunk;
        onChunk?.(chunk);
      });

      return {
        reply: fullReply,
        sessionId,
      };
    }
  }

  const activeSessionId = searchParams.get("session");

  function handleSessionSelect(sessionId: string) {
    setSearchParams({ session: sessionId });
  }

  function handleSessionCreated(sessionId: string) {
    setSearchParams({ session: sessionId }, { replace: true });
  }

  async function handleNewSession(title?: string): Promise<string> {
    const session = await chatService.createChatSession(notebookId, title);
    setChatSessions((prev) => [...prev, session]);
    return session.id;
    // URL update is intentionally left to ChatColumn via onSessionCreated
  }

  async function handleRenameSession(chatId: string, title: string) {
    await chatService.updateChatSession(chatId, title);
    setChatSessions((prev) =>
      prev.map((s) => (s.id === chatId ? { ...s, title } : s)),
    );
  }

  async function handleDeleteSession(chatId: string) {
    await chatService.deleteChatSession(chatId);
    setChatSessions((prev) => prev.filter((s) => s.id !== chatId));
    if (activeSessionId === chatId) {
      setSearchParams({});
    }
  }

  async function handleGenerateQuiz(options: QuizGenerateOptions) {
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
        setShowUpgradeModal(true);
      } else {
        showToast("Failed to generate quiz", "danger");
      }
    } finally {
      setIsGeneratingQuiz(false);
    }
  }

  async function handleGeneratePresentation(options: PresentationGenerateOptions) {
    setIsGeneratingPresentation(true);
    const isAllTopics = options.topics.length === 0 && !options.customTopic;
    const payload = {
      notebook: notebookId,
      topic: isAllTopics ? "All Topics" : options.topics.map((t) => t.name).join(", "),
      topic_id: isAllTopics ? undefined : options.topics[0]?.id,
      custom_prompt: options.customTopic || undefined,
      slide_count: options.numSlides,
      text_length: options.textLength.toUpperCase() as "BRIEF" | "BALANCED" | "DETAILED",
    };

    try {
      const session = await presentationService.createPresentation(payload);
      setPresentations((prev) => [session, ...prev]);

      const intervalId = setInterval(async () => {
        try {
          const updated = await presentationService.getPresentation(session.id);
          setPresentations((prev) =>
            prev.map((p) => (p.id === session.id ? updated : p))
          );
          if (updated.status === "COMPLETED") {
            clearInterval(intervalId);
            setIsGeneratingPresentation(false);
            showToast("Presentation ready", "neutral");
          } else if (updated.status === "FAILED") {
            clearInterval(intervalId);
            setIsGeneratingPresentation(false);
            showToast("Presentation generation failed", "danger");
          }
        } catch {
          clearInterval(intervalId);
          setIsGeneratingPresentation(false);
        }
      }, 2000);
    } catch (err) {
      showToast("Failed to generate presentation", "danger");
      setIsGeneratingPresentation(false);
    }
  }

  function handlePresentationClick(_presentation: PresentationSession) {
    // Step 4: open presentation viewer
  }

  async function handleQuizComplete(
    userAnswers: (number | null)[],
    _timeTaken: number,
    _flaggedQuestions: number[],
  ) {
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
      const quizzes = await quizService.listQuizSessionsByNotebook(notebookId);
      setPreviousQuizzes(quizzes);
      setActiveQuiz(null);
      setSelectedQuiz(completedQuiz);
    } catch {
      showToast("Failed to submit quiz", "danger");
    }
  }

  function handleQuizExit() {
    navigate(`/notebook/${notebookId}`, { replace: true });
  }

  function handleTakeToChat(
    questionText: string,
    options: string[],
    topic: string,
  ) {
    const formatted = [
      `I'm studying ${topic} and I need help with this question:`,
      "",
      `"${questionText}"`,
      "",
      "Options were:",
      ...options.map((opt, i) => `${String.fromCharCode(65 + i)}) ${opt}`),
    ].join("\n");
    setActiveQuiz(null);
    setPendingChatInput(formatted);
    setActiveView("chat");
  }

  function handleQuizClick(quiz: QuizSession) {
    setSelectedQuiz(quiz);
  }

  function handleBackToGenerator() {
    setSelectedQuiz(null);
  }

  async function handleDeleteQuizSessions(ids: string[]) {
    try {
      await Promise.all(ids.map((id) => quizService.deleteQuizSession(id)));
      setPreviousQuizzes((prev) => prev.filter((q) => !ids.includes(q.id!)));
      if (selectedQuiz && ids.includes(selectedQuiz.id!)) {
        setSelectedQuiz(null);
      }
    } catch {
      showToast("Failed to delete quiz sessions", "danger");
    }
  }

  async function handleRetakeQuiz() {
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
  }

  if (!notebook) return null;

  async function handleDeleteOne(id: string) {
    try {
      await notebookService.deleteFile(notebookId, id);
      setFiles((prev) => prev.filter((f) => f.id !== id));
      showToast("File deleted", "danger");
    } catch {}
  }

  async function handleRenameFile(id: string, newName: string) {
    try {
      await notebookService.renameFile(notebookId, id, newName);
      setFiles((prev) =>
        prev.map((f) => (f.id === id ? { ...f, name: newName } : f)),
      );
      showToast("File renamed", "neutral");
    } catch {}
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        overflow: "hidden",
        fontFamily: "'IBM Plex Mono', monospace",
      }}
    >
      {/* Top bar */}
      <div
        style={{
          background: W,
          borderBottom: `3px solid ${B}`,
          padding: "0 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          height: 56,
          flexShrink: 0,
        }}
      >
        <span
          onClick={() => navigate("/dashboard")}
          onMouseEnter={(e) =>
            (e.currentTarget.style.textDecoration = "underline")
          }
          onMouseLeave={(e) => (e.currentTarget.style.textDecoration = "none")}
          style={{
            fontSize: "0.78rem",
            fontWeight: 700,
            color: B,
            cursor: "pointer",
            letterSpacing: "0.04em",
            flexShrink: 0,
            textDecoration: "none",
            textUnderlineOffset: "3px",
          }}
        >
          ← Back to dashboard
        </span>

        <NotebookTitle title={notebook.title} onSave={handleTitleSave} />

        {/* Spacer to keep title centered */}
        <div style={{ width: 140, flexShrink: 0 }} />
      </div>

      {/* 3-column layout */}
      <div
        style={{
          flex: 1,
          display: "grid",
          gridTemplateColumns: "220px 1fr 260px",
          overflow: "hidden",
          position: "relative",
        }}
      >
        {/* Options/Tools nav column (left) */}
        <OptionsColumn activeView={activeView} onViewChange={setActiveView} />

        {/* Dynamic main window (Chat, Quiz, or Presentation) */}
        {activeView === "chat" ? (
          <ChatColumn
            onSend={handleSendMessage}
            sessions={chatSessions}
            activeSessionId={activeSessionId}
            onSessionSelect={handleSessionSelect}
            onNewSession={handleNewSession}
            onSessionCreated={handleSessionCreated}
            onRenameSession={handleRenameSession}
            onDeleteSession={handleDeleteSession}
            getChatMessages={chatService.getChatSessionMessages}
            chatDisabled={files.length > 0 && !hasReadyFiles}
            initialInput={pendingChatInput}
            onInitialInputConsumed={() => setPendingChatInput("")}
          />
        ) : activeView === "presentation" ? (
          <PresentationColumn
            topics={presentationTopics}
            isLoadingTopics={isLoadingPresentationTopics}
            onGenerate={handleGeneratePresentation}
            isGenerating={isGeneratingPresentation}
          />
        ) : selectedQuiz ? (
          <QuizReviewColumn
            quiz={selectedQuiz}
            onBack={handleBackToGenerator}
            onRetake={handleRetakeQuiz}
            onTakeToChat={handleTakeToChat}
          />
        ) : (
          <QuizColumn
            topics={quizTopics}
            isLoadingTopics={isLoadingTopics}
            onGenerate={handleGenerateQuiz}
            isGenerating={isGeneratingQuiz}
          />
        )}

        {/* Right column — Files on chat, Previous Quizzes on quiz, Previous Slides on presentation */}
        {activeView === "quiz" ? (
          <PastQuizColumn
            quizzes={previousQuizzes}
            selectedQuizId={selectedQuiz?.id ?? null}
            onQuizClick={handleQuizClick}
            onDeleteSelected={handleDeleteQuizSessions}
          />
        ) : activeView === "presentation" ? (
          <PastPresentationsColumn
            presentations={presentations}
            onPresentationClick={handlePresentationClick}
          />
        ) : (
          <FilesColumn
            files={files}
            onUpload={handleUpload}
            onDeleteSelected={handleDeleteSelected}
            onDeleteOne={handleDeleteOne}
            onRename={handleRenameFile}
            uploadProgress={uploadProgress}
          />
        )}
      </div>

      <ToastContainer toasts={toasts} />

      {showUpgradeModal && (
        <UpgradeModal
          onClose={() => setShowUpgradeModal(false)}
          title="Daily quiz limit reached"
          description="You've hit your daily quiz limit on the free plan. Upgrade to Pro for unlimited daily quizzes, more storage, and additional notebooks."
        />
      )}

      {/* Quiz-taking overlay — sits on top of everything */}
      {activeQuiz && (
        <QuizTakingScreen
          quiz={activeQuiz}
          onComplete={handleQuizComplete}
          onExit={handleQuizExit}
          onTakeToChat={handleTakeToChat}
        />
      )}
    </div>
  );
}
