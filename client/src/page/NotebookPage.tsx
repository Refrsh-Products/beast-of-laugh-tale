import { useState, useEffect } from "react";
import { useParams, useNavigate, Navigate } from "react-router-dom";
import useAuthService from "../services/auth";
import useNotebookService from "../services/notebooks";
import type { Notebook, NotebookFile } from "../storage";

import NotebookTitle from "../components/notebook/NotebookTitle";
import FilesColumn from "../components/notebook/FilesColumn";
import ChatColumn from "../components/notebook/ChatColumn";
import OptionsColumn from "../components/notebook/OptionsColumn";
import ToastContainer from "../components/ui/ToastContainer";
import { useToast } from "../hooks/useToast";

const B = "#000000";
const W = "#FFFFFF";

export default function NotebookPage() {
  const { id } = useParams<{ id: string }>();
  const authService = useAuthService();
  const notebookService = useNotebookService();
  const navigate = useNavigate();
  const { toasts, showToast } = useToast();

  const [notebook, setNotebook] = useState<Notebook | null>(null);
  const [files, setFiles] = useState<NotebookFile[]>([]);
  const [isGeneratingQuiz, setIsGeneratingQuiz] = useState(false);
  const [notFound, setNotFound] = useState(false);

  const notebookId = id ?? "";

  useEffect(() => {
    async function load() {
      const all = await notebookService.list();
      const found = all.find((n) => n.id === notebookId) ?? null;
      if (!found) {
        setNotFound(true);
        return;
      }
      setNotebook(found);
      // TODO: load files via notebookService.listFiles(notebookId) when Safwan wires it up
      setFiles([]);
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

  function handleUpload(uploaded: File[]) {
    // TODO: wire up file upload API when Safwan is ready
    showToast(
      `${uploaded.length} file${uploaded.length > 1 ? "s" : ""} uploaded`,
      "success",
    );
  }

  function handleDeleteSelected(ids: number[]) {
    // TODO: wire up file delete API when Safwan is ready
    setFiles((prev) => prev.filter((f) => !ids.includes(f.id)));
    showToast(
      `${ids.length} file${ids.length > 1 ? "s" : ""} deleted`,
      "danger",
    );
  }

  async function handleSendMessage(message: string): Promise<string> {
    // TODO: wire up RAG query via notebookService when Safwan is ready
    return `This is a placeholder response to: "${message}"`;
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
          gridTemplateColumns: "1fr 2fr 1fr",
          overflow: "hidden",
          position: "relative",
        }}
      >
        {/* Files column */}
        <FilesColumn
          files={files}
          onUpload={handleUpload}
          onDeleteSelected={handleDeleteSelected}
        />

        {/* Chat column (spans 2 grid columns) */}
        <ChatColumn onSend={handleSendMessage} />

        {/* Options column */}
        <OptionsColumn
          onGenerateQuiz={handleGenerateQuiz}
          isGenerating={isGeneratingQuiz}
        />
      </div>

      <ToastContainer toasts={toasts} />
    </div>
  );
}
