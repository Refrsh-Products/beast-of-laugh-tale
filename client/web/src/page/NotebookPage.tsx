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

import ChatColumn from "../components/notebook/ChatColumn";
import { type ActiveView } from "../components/notebook/types";
import QuizReviewColumn from "../components/notebook/QuizReviewColumn";
import QuizTakingScreen from "../components/notebook/QuizTakingScreen";
import QuizColumn from "../components/notebook/QuizColumn";
import PresentationColumn from "../components/notebook/PresentationColumn";
import AudioColumn from "../components/notebook/AudioColumn";

import NotebookToolRail from "../components/notebook/NotebookToolRail";
import NotebookTopBar from "../components/notebook/NotebookTopBar";
import NotebookSidebar from "../components/notebook/sidebar/NotebookSidebar";
import ChatSessionsPanel from "../components/notebook/sidebar/ChatSessionsPanel";
import PastQuizzesPanel from "../components/notebook/sidebar/PastQuizzesPanel";
import PresentationsPanel from "../components/notebook/sidebar/PresentationsPanel";
import TranscriptsPanel from "../components/notebook/sidebar/TranscriptsPanel";
import MaterialsPanel, {
  type FileUploadState,
} from "../components/notebook/sidebar/MaterialsPanel";
import useAudioTranscripts from "../hooks/audio/useAudioTranscripts";
import DeleteNotebookModal from "../components/dashboard/DeleteNotebookModal";
import { getAccount as getCachedAccount } from "../storage";
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
  const [panelsDrawerOpen, setPanelsDrawerOpen] = useState(false);
  const [confirmDeleteNotebook, setConfirmDeleteNotebook] = useState(false);
  // Bumped to ask the top bar's title field to open for editing.
  const [titleEditSignal, setTitleEditSignal] = useState(0);
  const account = getCachedAccount();

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

  // Transcript history is owned here rather than inside AudioColumn so the
  // sidebar can render it next to the other tools' histories.
  const audioTranscripts = useAudioTranscripts({
    notebookId,
    listTranscripts: () =>
      transcriptionService.listAudioTranscripts(notebookId),
    deleteTranscript: (transcriptId) =>
      transcriptionService.deleteAudioTranscript(notebookId, transcriptId),
    enabled: activeView === "audio",
  });

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

  /** Notebook-scoped actions behind the rail's settings menu. */
  async function handleToggleArchive() {
    if (!notebook) return;
    try {
      if (notebook.is_archived) {
        await notebookService.unarchive(notebookId);
        setNotebook((prev) => (prev ? { ...prev, is_archived: false } : prev));
        showToast("Notebook restored", "neutral");
      } else {
        await notebookService.archive(notebookId);
        setNotebook((prev) => (prev ? { ...prev, is_archived: true } : prev));
        showToast("Notebook archived", "neutral");
      }
    } catch (err) {
      const code = (err as any)?.response?.data?.code;
      if (code === "notebook_quota_exceeded") {
        setUpgradeModal({
          title: "Notebook limit reached",
          description:
            "You've reached your active notebook limit. Archive another notebook or upgrade to Pro for unlimited notebooks.",
        });
      } else {
        showToast("Couldn't update the notebook", "danger");
      }
    }
  }

  async function handleDeleteNotebook() {
    try {
      await notebookService.delete(notebookId);
      showToast("Notebook deleted", "danger");
      navigate("/dashboard", { replace: true });
    } catch (err) {
      console.error("[NotebookPage] delete notebook failed:", err);
      showToast("Couldn't delete the notebook", "danger");
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
          activeSessionId={chatSessions.activeSessionId}
          onSessionCreated={chatSessions.handleSessionCreated}
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
          onGetTranscript={(transcriptId) =>
            transcriptionService.getAudioTranscript(notebookId, transcriptId)
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
          selectedTranscriptId={audioTranscripts.selectedId}
          onTranscriptStarted={(transcriptId, title) => {
            audioTranscripts.addPending(transcriptId, title);
            audioTranscripts.setSelectedId(transcriptId);
          }}
          onNotesSaved={(transcriptId) =>
            audioTranscripts.markHasNotes(transcriptId)
          }
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

  /**
   * The sidebar's upper region. Unlike the old right column this never shows
   * files — those live in the materials panel below it, on every tool.
   */
  function renderContextPanel() {
    const isArchived = !!notebook?.is_archived;

    if (activeView === "quiz")
      return (
        <PastQuizzesPanel
          quizzes={quizSessions.previousQuizzes}
          selectedQuizId={quizSessions.selectedQuiz?.id ?? null}
          onQuizClick={quizSessions.handleQuizClick}
          onDeleteSelected={quizSessions.handleDeleteQuizSessions}
          disabled={isArchived}
        />
      );
    if (activeView === "presentation")
      return (
        <PresentationsPanel
          presentations={presentationSession.presentations}
          onPresentationClick={presentationSession.handlePresentationClick}
          onDeleteSelected={presentationSession.handleDeletePresentations}
          disabled={isArchived}
        />
      );
    if (activeView === "audio")
      return (
        <TranscriptsPanel
          transcripts={audioTranscripts.transcripts}
          selectedTranscriptId={audioTranscripts.selectedId}
          loading={audioTranscripts.loading}
          onTranscriptClick={(t) => audioTranscripts.setSelectedId(t.id)}
          onDelete={(id) => audioTranscripts.remove(id)}
          disabled={isArchived}
        />
      );
    return (
      <ChatSessionsPanel
        sessions={chatSessions.chatSessions}
        activeSessionId={chatSessions.activeSessionId}
        onSessionSelect={chatSessions.handleSessionSelect}
        onNewSession={() => chatSessions.handleNewSession()}
        onRenameSession={chatSessions.handleRenameSession}
        onDeleteSession={chatSessions.handleDeleteSession}
        disabled={isArchived}
      />
    );
  }

  function renderSidebar(className?: string) {
    return (
      <NotebookSidebar
        className={className}
        contextPanel={renderContextPanel()}
        materialsPanel={
          <MaterialsPanel
            files={files}
            uploadProgress={uploadProgress}
            onUpload={handleUpload}
            onDeleteOne={handleDeleteOneFile}
            onRename={handleRenameFile}
            disabled={!!notebook?.is_archived}
          />
        }
      />
    );
  }

  const userLabel =
    [account?.first_name, account?.last_name]
      .filter(Boolean)
      .join(" ")
      .trim() ||
    (authService.getUser()?.email ?? "Account");

  const settingsActions = {
    onRename: () => setTitleEditSignal((n) => n + 1),
    onArchive: handleToggleArchive,
    onDelete: () => setConfirmDeleteNotebook(true),
    isArchived: !!notebook.is_archived,
  };

  return (
    <div className="bg-background flex h-dvh overflow-hidden">
      {/* Rail and sidebar are fixed columns on desktop and collapse into a
          single drawer below the tablet breakpoint. */}
      {!isCompact && (
        <>
          <NotebookToolRail
            activeView={activeView}
            onViewChange={setActiveView}
            settings={settingsActions}
          />
          {renderSidebar()}
        </>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <NotebookTopBar
          title={notebook.title}
          onTitleSave={handleNotebookTitleSave}
          isArchived={!!notebook.is_archived}
          profilePictureUrl={account?.profile_picture_url ?? ""}
          userLabel={userLabel}
          titleEditSignal={titleEditSignal}
          onOpenSidebar={
            isCompact ? () => setPanelsDrawerOpen(true) : undefined
          }
        />

        {notebook.is_archived && (
          <div className="bg-muted text-muted-foreground border-border shrink-0 border-b px-4 py-2 text-center text-xs">
            This notebook is archived and read-only. Restore it from the
            settings menu to make changes.
          </div>
        )}

        <main className="min-h-0 flex-1 overflow-hidden">
          {renderCenterPanel()}
        </main>
      </div>

      {isCompact && (
        <MobileDrawer
          open={panelsDrawerOpen}
          onClose={() => setPanelsDrawerOpen(false)}
          side="left"
          width="min(340px, 92vw)"
          ariaLabel="Notebook tools and materials"
        >
          <div className="flex h-full">
            <NotebookToolRail
              activeView={activeView}
              onViewChange={(view) => {
                setActiveView(view);
                setPanelsDrawerOpen(false);
              }}
              settings={settingsActions}
            />
            {renderSidebar("min-w-0 flex-1 border-r-0")}
          </div>
        </MobileDrawer>
      )}

      {upgradeModal && (
        <UpgradeModal
          onClose={() => setUpgradeModal(null)}
          title={upgradeModal.title}
          description={upgradeModal.description}
        />
      )}

      {confirmDeleteNotebook && (
        <DeleteNotebookModal
          notebook={notebook}
          onConfirm={handleDeleteNotebook}
          onClose={() => setConfirmDeleteNotebook(false)}
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
