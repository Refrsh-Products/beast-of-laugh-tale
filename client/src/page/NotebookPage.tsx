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
  const [uploadProgress, setUploadProgress] = useState<FileUploadState[]>([]);

  const notebookId = id ?? "";

  useEffect(() => {
    async function load() {
      const found = await notebookService.getNotebook(notebookId);
      if (!found) {
        setNotFound(true);
        return;
      }
      console.log(found);
      setNotebook(found);

      try {
        const files = await notebookService.listFiles(notebookId);
        setFiles([...files]);
      } catch (err) {
        showToast("Failed to load files", "danger");
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
          uploadProgress={uploadProgress}
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
