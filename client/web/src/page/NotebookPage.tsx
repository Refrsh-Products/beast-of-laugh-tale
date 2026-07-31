import { useState, useEffect } from "react";
import {
  useParams,
  useNavigate,
  Navigate,
  useSearchParams,
} from "react-router-dom";
import useAuthService from "../services/auth";
import useNotebookService from "../services/notebooks";
import useAccountService from "../services/account";
import type { Notebook, NotebookFile } from "@freshr/shared";

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
import AudioColumn from "../components/notebook/AudioColumn";
import PresentationViewer from "../components/presentation/PresentationViewer";
import UpgradeModal from "../components/dashboard/UpgradeModal";
import { useToast } from "../hooks/useToast";
import useChatService from "../services/chat";
import { track } from "../lib/analytics";

import usePresentationSessions from "../hooks/presentation/usePresentationSessions";
import useChatSessions from "../hooks/chat/useChatSessions";
import useQuizSessions from "../hooks/quiz/useQuizSessions";
import MobileDrawer from "../components/ui/MobileDrawer";
import { useMediaQuery } from "../hooks/useMediaQuery";
import { BP_TABLET } from "../constants/breakpoints";
import useTranscriptionService from "../services/transcription";

const B = "#000000";
const W = "#FFFFFF";

export default function NotebookPage() {
  const { id } = useParams<{ id: string }>();
  const authService = useAuthService();
  const notebookService = useNotebookService();
  const transcriptionService = useTranscriptionService();
  const accountService = useAccountService();
  const chatService = useChatService();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [audioFeatureEnabled, setAudioFeatureEnabled] = useState<
    boolean | null
  >(null);

  const [notebook, setNotebook] = useState<Notebook | null>(null);
  const [files, setFiles] = useState<NotebookFile[]>([]);
  const [searchParams, setSearchParams] = useSearchParams();
  const viewParam = searchParams.get("view");
  const activeView: ActiveView =
    viewParam === "quiz" ||
    viewParam === "presentation" ||
    viewParam === "audio"
      ? viewParam
      : "chat";
  const setActiveView = (view: ActiveView) => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (view === "chat") next.delete("view");
        else next.set("view", view);
        return next;
      },
      { replace: true },
    );
  };
  const [pendingChatInput, setPendingChatInput] = useState<string>("");
  const [upgradeModal, setUpgradeModal] = useState<{
    title: string;
    description: string;
  } | null>(null);
  const [notebookNotFound, setNotebookNotFound] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<FileUploadState[]>([]);

  const notebookId = id ?? "";
  const hasProcessingFiles = files.some(
    (f) =>
      f.ingestion_status === "pending" || f.ingestion_status === "processing",
  );
  const hasReadyFiles = files.some((f) => f.ingestion_status === "ready");
  const isCompact = useMediaQuery(BP_TABLET);
  const [toolsDrawerOpen, setToolsDrawerOpen] = useState(false);
  const [filesDrawerOpen, setFilesDrawerOpen] = useState(false);

  const notebookArchivedModal = {
    title: "Notebook is archived",
    description:
      "This notebook is read-only. Go back to the dashboard and unarchive it to make changes.",
  };

  const chatSessions = useChatSessions(
    notebookId,
    showToast,
    files,
    hasReadyFiles,
    () => setUpgradeModal(notebookArchivedModal),
  );

  const quizSessions = useQuizSessions(
    notebookId,
    showToast,
    activeView,
    () =>
      setUpgradeModal({
        title: "Daily quiz limit reached",
        description:
          "You've hit your daily quiz limit on the free plan. Upgrade to Pro for unlimited daily quizzes, more storage, and additional notebooks.",
      }),
    (msg) => {
      setPendingChatInput(msg);
      setActiveView("chat");
    },
    () => setUpgradeModal(notebookArchivedModal),
  );
  const presentationSession = usePresentationSessions(
    notebookId,
    showToast,
    activeView,
    () =>
      setUpgradeModal({
        title: "Daily presentation limit reached",
        description:
          "You've hit your daily presentation limit on the free plan. Upgrade to Pro for unlimited presentations, more storage, and additional notebooks.",
      }),
    () => setUpgradeModal(notebookArchivedModal),
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

  // Fetch plan-level features so we can show + upsell paid-only items (e.g. Audio Notes).
  useEffect(() => {
    let cancelled = false;
    accountService
      .getAccountUsage()
      .then((usage) => {
        if (!cancelled)
          setAudioFeatureEnabled(usage.features?.audio_notes ?? false);
      })
      .catch(() => {
        if (!cancelled) setAudioFeatureEnabled(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

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
            track("file-upload");
            setUploadProgress((prev) =>
              prev.map((p, idx) => (idx === i ? { ...p, status: "done" } : p)),
            );
          }
        } catch (err) {
          const data = (err as any)?.response?.data;
          const code = data?.code;
          const errMsg =
            data?.message ??
            data?.detail ??
            (err instanceof Error ? err.message : "Upload failed");
          setUploadProgress((prev) =>
            prev.map((p, idx) =>
              idx === i ? { ...p, status: "error", error: errMsg } : p,
            ),
          );
          if (code === "notebook_archived") {
            setUpgradeModal(notebookArchivedModal);
          } else if (code === "file_size_exceeded") {
            setUpgradeModal({
              title: "File too large",
              description: `${errMsg} Upgrade to Pro for larger uploads, more storage, and unlimited notebooks.`,
            });
          } else if (code === "storage_quota_exceeded") {
            setUpgradeModal({
              title: "Storage limit reached",
              description:
                "You've hit your storage limit on the free plan. Upgrade to Pro for more storage, larger files, and unlimited notebooks.",
            });
          } else if (code === "file_quota_exceeded") {
            setUpgradeModal({
              title: "File limit reached",
              description:
                "You've hit the file limit for this notebook on the free plan. Upgrade to Pro for more files per notebook.",
            });
          } else {
            showToast(errMsg, "danger");
          }
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
    if (activeView === "audio") {
      // Free / downgraded users can still browse their past transcripts and notes,
      // but the column blocks any mutation (`canMutate=false`) and shows an inline
      // upgrade CTA where the action buttons would normally be.
      const showAudioUpgrade = () =>
        setUpgradeModal({
          title: "Audio Notes is a Pro feature",
          description:
            "Upload lecture recordings, get accurate Bangla + English transcripts, and turn them into structured study notes. Upgrade to Pro to unlock Audio Notes.",
        });
      const interceptPaidOnly = <T,>(promise: Promise<T>): Promise<T> =>
        promise.catch((err) => {
          const code = (err as any)?.response?.data?.code;
          if (code === "paid_only_feature") {
            setAudioFeatureEnabled(false);
            showAudioUpgrade();
          }
          throw err;
        });

      // Backend transcription + notes generation now run in Celery. Kickoff
      // endpoints return 202; we poll the detail endpoint until status is
      // terminal (ready/failed), then resolve the promise the column awaits.
      const POLL_INTERVAL_MS = 2500;
      const POLL_TIMEOUT_MS = 10 * 60 * 1000; // 10 min — covers ~2hr lectures
      async function pollAudioTranscript(
        transcriptId: string,
        isDone: (
          d: Awaited<
            ReturnType<typeof transcriptionService.getAudioTranscript>
          >,
        ) => boolean,
      ) {
        const deadline = Date.now() + POLL_TIMEOUT_MS;
        while (true) {
          const detail = await transcriptionService.getAudioTranscript(
            notebookId,
            transcriptId,
          );
          if (isDone(detail)) return detail;
          if (Date.now() > deadline) {
            throw new Error(
              "Still running — check back in History in a few minutes.",
            );
          }
          await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
        }
      }

      return (
        <AudioColumn
          notebookId={notebookId}
          onTranscribeAudio={async (file, title) => {
            const kickoff = await interceptPaidOnly(
              transcriptionService.transcribeAudio(notebookId, file, title),
            );
            const detail = await pollAudioTranscript(
              kickoff.transcript_id,
              (d) =>
                d.transcription_status === "ready" ||
                d.transcription_status === "failed",
            );
            if (detail.transcription_status === "failed") {
              throw new Error(
                detail.transcription_error || "Transcription failed.",
              );
            }
            return {
              transcript_id: kickoff.transcript_id,
              transcript: detail.transcript_text,
            };
          }}
          onGenerateNotes={async (transcriptId) => {
            await interceptPaidOnly(
              transcriptionService.generateNotesFromTranscript(
                notebookId,
                transcriptId,
              ),
            );
            const detail = await pollAudioTranscript(
              transcriptId,
              (d) => d.notes_status === "ready" || d.notes_status === "failed",
            );
            if (detail.notes_status === "failed") {
              throw new Error(detail.notes_error || "Notes generation failed.");
            }
            showToast("Notes saved to notebook", "success");
            try {
              setFiles(await notebookService.listFiles(notebookId));
            } catch {}
            return detail.notes_text;
          }}
          onUpdateTranscript={(transcriptId, fields) =>
            interceptPaidOnly(
              transcriptionService.updateAudioTranscript(
                notebookId,
                transcriptId,
                fields,
              ),
            )
          }
          onListTranscripts={() =>
            transcriptionService.listAudioTranscripts(notebookId)
          }
          onGetTranscript={(transcriptId) =>
            transcriptionService.getAudioTranscript(notebookId, transcriptId)
          }
          onDeleteTranscript={(transcriptId) =>
            transcriptionService.deleteAudioTranscript(notebookId, transcriptId)
          }
          onNotesGenerated={() => {
            notebookService
              .listFiles(notebookId)
              .then(setFiles)
              .catch(() => {});
          }}
          // null = plan check still loading; treat as paid-optimistic (the backend
          // is the source of truth and will 403 if the user actually isn't paid).
          canMutate={audioFeatureEnabled !== false}
          onUpgrade={showAudioUpgrade}
        />
      );
    }
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
        height: "100dvh",
        overflow: "hidden",
        fontFamily: "'IBM Plex Mono', monospace",
      }}
    >
      {/* Archived banner */}
      {notebook.is_archived && (
        <div
          style={{
            background: "#f5f0e0",
            borderBottom: `2px solid ${B}`,
            padding: "8px 24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 12,
            flexShrink: 0,
          }}
        >
          <span
            style={{
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: "0.75rem",
              fontWeight: 700,
              letterSpacing: "0.08em",
              color: "#7a5c00",
            }}
          >
            ARCHIVED — this notebook is read-only. Go to the dashboard to
            unarchive it.
          </span>
        </div>
      )}

      {/* Top bar */}
      <div
        style={{
          background: W,
          borderBottom: `3px solid ${B}`,
          padding: isCompact ? "0 12px" : "0 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          height: 56,
          flexShrink: 0,
          gap: 8,
        }}
      >
        {isCompact ? (
          <button
            onClick={() => setToolsDrawerOpen(true)}
            aria-label="Open tools"
            style={{
              background: W,
              border: `2px solid ${B}`,
              padding: "4px 10px",
              cursor: "pointer",
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: "1rem",
              lineHeight: 1,
              color: B,
              flexShrink: 0,
            }}
          >
            ☰
          </button>
        ) : (
          <span
            onClick={() => navigate("/dashboard")}
            onMouseEnter={(e) =>
              (e.currentTarget.style.textDecoration = "underline")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.textDecoration = "none")
            }
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
        )}

        <div
          style={{
            flex: 1,
            display: "flex",
            justifyContent: "center",
            minWidth: 0,
          }}
        >
          <NotebookTitle
            title={notebook.title}
            onSave={handleNotebookTitleSave}
          />
        </div>

        {isCompact ? (
          <button
            onClick={() => setFilesDrawerOpen(true)}
            aria-label="Open files / panel"
            style={{
              background: W,
              border: `2px solid ${B}`,
              padding: "4px 10px",
              cursor: "pointer",
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: "0.85rem",
              lineHeight: 1,
              color: B,
              flexShrink: 0,
            }}
          >
            ▦
          </button>
        ) : (
          <div style={{ width: 140, flexShrink: 0 }} />
        )}
      </div>

      {/* 3-column layout (single column on phone) */}
      <div
        style={{
          flex: 1,
          display: "grid",
          gridTemplateColumns: isCompact ? "1fr" : "220px 1fr 260px",
          overflow: "hidden",
          position: "relative",
          minHeight: 0,
        }}
      >
        {/* Options/Tools nav column (inline on desktop, in drawer on phone) */}
        {!isCompact && (
          <OptionsColumn activeView={activeView} onViewChange={setActiveView} />
        )}

        {renderCenterPanel()}

        {!isCompact && renderRightPanel()}
      </div>

      {/* Phone-only drawers */}
      {isCompact && (
        <>
          <MobileDrawer
            open={toolsDrawerOpen}
            onClose={() => setToolsDrawerOpen(false)}
            side="left"
            width="min(240px, 85vw)"
            ariaLabel="Notebook tools"
          >
            <OptionsColumn
              activeView={activeView}
              onViewChange={(v) => {
                setActiveView(v);
                setToolsDrawerOpen(false);
              }}
            />
          </MobileDrawer>

          <MobileDrawer
            open={filesDrawerOpen}
            onClose={() => setFilesDrawerOpen(false)}
            side="right"
            width="min(320px, 90vw)"
            ariaLabel="Files panel"
          >
            <div
              style={{
                height: "100%",
                display: "flex",
                flexDirection: "column",
              }}
            >
              {renderRightPanel()}
            </div>
          </MobileDrawer>
        </>
      )}


      {upgradeModal && (
        <UpgradeModal
          onClose={() => setUpgradeModal(null)}
          title={upgradeModal.title}
          description={upgradeModal.description}
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
