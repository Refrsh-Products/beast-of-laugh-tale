import { useState, useEffect } from "react";
import {
  useParams,
  useNavigate,
  Navigate,
  useSearchParams,
} from "react-router-dom";
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
import QuizColumn from "../components/notebook/QuizColumn";
import ToastContainer from "../components/ui/ToastContainer";
import { useToast } from "../hooks/useToast";
import useChatService from "../services/chat";

const B = "#000000";
const W = "#FFFFFF";

export default function NotebookPage() {
  const { id } = useParams<{ id: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const authService = useAuthService();
  const notebookService = useNotebookService();
  const chatService = useChatService();
  const navigate = useNavigate();
  const { toasts, showToast } = useToast();

  const [notebook, setNotebook] = useState<Notebook | null>(null);
  const [files, setFiles] = useState<NotebookFile[]>([]);
  const [isGeneratingQuiz, setIsGeneratingQuiz] = useState(false);
  const [activeView, setActiveView] = useState<ActiveView>("chat");
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
          const errMsg = err instanceof Error ? err.message : "Upload failed";
          setUploadProgress((prev) =>
            prev.map((p, idx) =>
              idx === i ? { ...p, status: "error", error: errMsg } : p,
            ),
          );
          showToast(`${file.name}: ${errMsg}`, "danger");
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

  async function handleGenerateQuiz() {
    setIsGeneratingQuiz(true);
    try {
      // TODO: wire up quiz generation API when Safwan is ready
      await new Promise((resolve) => setTimeout(resolve, 1500));
      showToast("Quiz generated", "success");
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
          style={{
            fontSize: "0.78rem",
            fontWeight: 700,
            color: B,
            cursor: "pointer",
            letterSpacing: "0.04em",
            flexShrink: 0,
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

        {/* Dynamic main window (Chat or Quiz) */}
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
          />
        ) : (
          <QuizColumn
            onGenerateQuiz={handleGenerateQuiz}
            isGenerating={isGeneratingQuiz}
          />
        )}

        {/* Files column (right) */}
        <FilesColumn
          files={files}
          onUpload={handleUpload}
          onDeleteSelected={handleDeleteSelected}
          onDeleteOne={handleDeleteOne}
          onRename={handleRenameFile}
          uploadProgress={uploadProgress}
        />
      </div>

      <ToastContainer toasts={toasts} />
    </div>
  );
}
