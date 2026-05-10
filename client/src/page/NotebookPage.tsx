import { useState, useEffect } from "react";
import { useParams, useNavigate, Navigate } from "react-router-dom";
import useAuthService from "../services/auth";
import useNotebookService from "../services/notebooks";
import type { Notebook, NotebookFile } from "../storage";

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
import PresentationColumn from "../components/notebook/PresentationColumn";
import PastPresentationsColumn from "../components/notebook/PastPresentationsColumn";
import PresentationViewer from "../components/presentation/PresentationViewer";
import UpgradeModal from "../components/dashboard/UpgradeModal";
import ToastContainer from "../components/ui/ToastContainer";
import { useToast } from "../hooks/useToast";
import useChatService from "../services/chat";

import usePresentationSessions from "../hooks/presentation/usePresentationSessions";
import useChatSessions from "../hooks/chat/useChatSessions";
import useQuizSessions from "../hooks/quiz/useQuizSessions";

const B = "#000000";
const W = "#FFFFFF";

export default function NotebookPage() {
  const { id } = useParams<{ id: string }>();
  const authService = useAuthService();
  const notebookService = useNotebookService();
  const chatService = useChatService();
  const navigate = useNavigate();
  const { toasts, showToast } = useToast();

  const [notebook, setNotebook] = useState<Notebook | null>(null);
  const [files, setFiles] = useState<NotebookFile[]>([]);
  const [activeView, setActiveView] = useState<ActiveView>("chat");
  const [pendingChatInput, setPendingChatInput] = useState<string>("");
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [notebookNotFound, setNotebookNotFound] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<FileUploadState[]>([]);

  const notebookId = id ?? "";
  const hasProcessingFiles = files.some(
    (f) =>
      f.ingestion_status === "pending" || f.ingestion_status === "processing",
  );
  const hasReadyFiles = files.some((f) => f.ingestion_status === "ready");

  const chatSessions = useChatSessions(
    notebookId,
    showToast,
    files,
    hasReadyFiles,
  );
  const quizSessions = useQuizSessions(
    notebookId,
    showToast,
    activeView,
    () => setShowUpgradeModal(true),
    (msg) => {
      setPendingChatInput(msg);
      setActiveView("chat");
    },
  );
  const presentationSession = usePresentationSessions(
    notebookId,
    showToast,
    activeView,
    () => setShowUpgradeModal(true),
  );

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
    async function loadNotebooksAndFiles() {
      try {
        const foundNotebookById = await notebookService.getNotebook(notebookId);
        if (!foundNotebookById) {
          setNotebookNotFound(true);
          return;
        }
        setNotebook(foundNotebookById);

        try {
          const files = await notebookService.listFiles(notebookId);
          setFiles([...files]);
        } catch (err) {
          showToast("Failed to load files", "danger");
        }
      } catch (err) {
        console.error("[NotebookPage] loadNotebooksAndFiles() error:", err);
        setNotebookNotFound(true);
      }
    }
    loadNotebooksAndFiles();
  }, [notebookId]);

  /** Notebook Stuff */
  async function handleNotebookTitleSave(newTitle: string) {
    if (!notebook) return;
    await notebookService.update(notebookId, { title: newTitle });
    setNotebook((prev) => (prev ? { ...prev, title: newTitle } : prev));
    showToast("Notebook renamed", "neutral");
  }

  // this function needs comments and can be refactored better, rename it to have the word file
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
      } catch (err) {
        console.error(
          `[NotebookPage.tsx] Error while listing files for notebook ID: ${notebookId}, error: ${err}`,
        );
      }
    }

    setTimeout(
      () =>
        setUploadProgress((prev) => prev.filter((p) => p.status === "error")),
      2000,
    );
    setTimeout(() => setUploadProgress([]), 6000);
  }

  async function handleDeleteSelectedFiles(ids: string[]) {
    try {
      await Promise.all(
        ids.map((id) => notebookService.deleteFile(notebookId, id)),
      );
      setFiles((prev) => prev.filter((f) => !ids.includes(f.id)));
      showToast(
        `${ids.length} file${ids.length > 1 ? "s" : ""} deleted`,
        "danger",
      );
    } catch (err) {
      console.error(`[NotebookPage.tsx] Error while trying to delete file.`);
    }
  }

  /** NotbookFile Stuff */
  async function handleDeleteOneFile(id: string) {
    try {
      await notebookService.deleteFile(notebookId, id);
      setFiles((prev) => prev.filter((f) => f.id !== id));
      showToast("File deleted", "danger");
    } catch (err) {
      console.error(`[NotebookPage.tsx] Error while deleting a file.`);
    }
  }

  async function handleRenameFile(id: string, newName: string) {
    try {
      await notebookService.renameFile(notebookId, id, newName);
      setFiles((prev) =>
        prev.map((f) => (f.id === id ? { ...f, name: newName } : f)),
      );
      showToast("File renamed", "neutral");
    } catch (err) {
      console.error(`[NotebookPage.tsx] Error while renaming file.`);
    }
  }

  if (!authService.isLoggedIn()) return <Navigate to="/login" replace />;
  if (notebookNotFound) return <Navigate to="/dashboard" replace />;
  if (!notebook) return null; // need to replace this with a loading skeleton screen
  /**
   * Something like so:
   * Option 1: Show a loading state (best UX)
      Add an explicit isLoading boolean state, set it true before the fetch and false after. Then replace return null with a spinner or skeleton screen so the user knows something is happening.

      const [isLoading, setIsLoading] = useState(true);
      // in load():
      // setIsLoading(false) in finally block
      if (isLoading) return <LoadingSpinner />;
   */

  // Right column — Files on chat, Previous Quizzes on quiz, Previous Slides on presentation
  function renderCenterPanel() {
    if (activeView === "chat")
      return (
        <ChatColumn
          onSend={chatSessions.handleSendMessage}
          sessions={chatSessions.chatSessions}
          activeSessionId={chatSessions.activeSessionId}
          onSessionSelect={chatSessions.handleSessionSelect}
          onNewSession={chatSessions.handleNewSession}
          onSessionCreated={chatSessions.handleSessionCreated}
          onRenameSession={chatSessions.handleRenameSession}
          onDeleteSession={chatSessions.handleDeleteSession}
          getChatMessages={chatService.getChatSessionMessages}
          chatDisabled={files.length > 0 && !hasReadyFiles}
          initialInput={pendingChatInput}
          onInitialInputConsumed={() => setPendingChatInput("")}
        />
      );
    if (activeView === "presentation")
      return (
        <PresentationColumn
          topics={presentationSession.presentationTopics}
          isLoadingTopics={presentationSession.isLoadingPresentationTopics}
          onGenerate={presentationSession.handleGeneratePresentation}
          isGenerating={presentationSession.isGeneratingPresentation}
        />
      );
    if (quizSessions.selectedQuiz)
      return (
        <QuizReviewColumn
          quiz={quizSessions.selectedQuiz}
          onBack={quizSessions.handleBackToGenerator}
          onRetake={quizSessions.handleRetakeQuiz}
          onTakeToChat={quizSessions.handleTakeToChat}
        />
      );
    return (
      <QuizColumn
        topics={quizSessions.quizTopics}
        isLoadingTopics={quizSessions.isLoadingTopics}
        onGenerate={quizSessions.handleGenerateQuiz}
        isGenerating={quizSessions.isGeneratingQuiz}
      />
    );
  }

  // Dynamic main window (Chat, Quiz, or Presentation)
  function renderRightPanel() {
    if (activeView === "quiz")
      return (
        <PastQuizColumn
          quizzes={quizSessions.previousQuizzes}
          selectedQuizId={quizSessions.selectedQuiz?.id ?? null}
          onQuizClick={quizSessions.handleQuizClick}
          onDeleteSelected={quizSessions.handleDeleteQuizSessions}
        />
      );
    if (activeView === "presentation")
      return (
        <PastPresentationsColumn
          presentations={presentationSession.presentations}
          onPresentationClick={presentationSession.handlePresentationClick}
          onDeleteSelected={presentationSession.handleDeletePresentations}
        />
      );
    return (
      <FilesColumn
        files={files}
        onUpload={handleUpload}
        onDeleteSelected={handleDeleteSelectedFiles}
        onDeleteOne={handleDeleteOneFile}
        onRename={handleRenameFile}
        uploadProgress={uploadProgress}
      />
    );
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

        <NotebookTitle
          title={notebook.title}
          onSave={handleNotebookTitleSave}
        />

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

        {renderCenterPanel()}
        {renderRightPanel()}
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
      {quizSessions.activeQuiz && (
        <QuizTakingScreen
          quiz={quizSessions.activeQuiz}
          onComplete={quizSessions.handleQuizComplete}
          onExit={quizSessions.handleQuizExit}
          onTakeToChat={quizSessions.handleTakeToChat}
        />
      )}

      {/* Presentation viewer overlay */}
      {presentationSession.activePresentation && (
        <PresentationViewer
          presentation={presentationSession.activePresentation}
          onClose={presentationSession.handleClosePresentation}
          onUpdate={presentationSession.handleUpdatePresentation}
          onRefineSlide={presentationSession.handleRefineSlide}
        />
      )}
    </div>
  );
}
