import { useEffect, useState } from "react";
import axios from "axios";
import type { AudioTranscriptDetail } from "@freshr/shared";
import useTranscriptionService from "../../services/transcription";
import useAccountService from "../../services/account";
import type { ToastVariant } from "../useToast";

// Backend transcription + notes generation run in Celery. Kickoff endpoints
// return 202; we poll the detail endpoint until status is terminal
// (ready/failed), then resolve the promise the column awaits.
const POLL_INTERVAL_MS = 2500;
const POLL_TIMEOUT_MS = 10 * 60 * 1000; // 10 min — covers ~2hr lectures

/** Pulls the DRF error code out of an axios failure, if there is one. */
function getErrorCode(err: unknown): string | undefined {
  if (!axios.isAxiosError(err)) return undefined;
  return (err.response?.data as { code?: string } | undefined)?.code;
}

/**
 * Owns the audio tool's write operations: kicking off a transcription or a
 * notes generation, then polling the job to completion.
 *
 * Sits alongside `useAudioTranscripts`, which owns the transcript *history*
 * list. The split is by ownership, not by feature: the history has to live
 * above the column because the sidebar renders it too, whereas these
 * operations are only ever driven by AudioColumn.
 *
 * The upgrade modal and the notebook's file list belong to the page, so those
 * arrive as callbacks rather than being reached for directly.
 */
export default function useAudioTranscription({
  notebookId,
  showToast,
  onFilesChanged,
  onPaidOnlyBlocked,
}: {
  notebookId: string;
  showToast: (msg: string, variant: ToastVariant) => void;
  /** Called after a notes generation adds a file to the notebook. */
  onFilesChanged: () => void;
  /** Called when the backend rejects a write because the plan excludes audio. */
  onPaidOnlyBlocked: () => void;
}) {
  const transcriptionService = useTranscriptionService();
  const accountService = useAccountService();

  // null = plan check still in flight; treated as paid-optimistic below (the
  // backend is the source of truth and will 403 if the user actually isn't paid).
  const [featureEnabled, setFeatureEnabled] = useState<boolean | null>(null);

  // Plan-level features decide whether we show the tool or upsell it.
  useEffect(() => {
    let cancelled = false;
    accountService
      .getAccountUsage()
      .then((usage) => {
        if (!cancelled) setFeatureEnabled(usage.features?.audio_notes ?? false);
      })
      .catch(() => {
        if (!cancelled) setFeatureEnabled(false);
      });
    return () => {
      cancelled = true;
    };
    // accountService is rebuilt every render; the check only needs to run once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * Flips the tool read-only and upsells when the backend says the plan
   * doesn't include audio. Every other failure passes through untouched so the
   * column can surface it inline.
   */
  const interceptPaidOnly = <T,>(promise: Promise<T>): Promise<T> =>
    promise.catch((err) => {
      if (getErrorCode(err) === "paid_only_feature") {
        setFeatureEnabled(false);
        onPaidOnlyBlocked();
      }
      throw err;
    });

  const pollTranscript = async (
    transcriptId: string,
    isDone: (detail: AudioTranscriptDetail) => boolean,
  ): Promise<AudioTranscriptDetail> => {
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
  };

  const transcribeAudio = async (file: File, title: string) => {
    const kickoff = await interceptPaidOnly(
      transcriptionService.transcribeAudio(notebookId, file, title),
    );
    const detail = await pollTranscript(
      kickoff.transcript_id,
      (d) =>
        d.transcription_status === "ready" ||
        d.transcription_status === "failed",
    );
    if (detail.transcription_status === "failed") {
      throw new Error(detail.transcription_error || "Transcription failed.");
    }
    return {
      transcript_id: kickoff.transcript_id,
      transcript: detail.transcript_text,
    };
  };

  const generateNotes = async (transcriptId: string) => {
    await interceptPaidOnly(
      transcriptionService.generateNotesFromTranscript(
        notebookId,
        transcriptId,
      ),
    );
    const detail = await pollTranscript(
      transcriptId,
      (d) => d.notes_status === "ready" || d.notes_status === "failed",
    );
    if (detail.notes_status === "failed") {
      throw new Error(detail.notes_error || "Notes generation failed.");
    }
    showToast("Notes saved to notebook", "success");
    // Notes land in the notebook as a file, so the Materials list is now stale.
    onFilesChanged();
    return detail.notes_text;
  };

  const updateTranscript = (
    transcriptId: string,
    fields: { transcript_text?: string; title?: string },
  ) =>
    interceptPaidOnly(
      transcriptionService.updateAudioTranscript(
        notebookId,
        transcriptId,
        fields,
      ),
    );

  const getTranscript = (transcriptId: string) =>
    transcriptionService.getAudioTranscript(notebookId, transcriptId);

  return {
    /** False only once the plan check has come back negative. */
    canMutate: featureEnabled !== false,
    transcribeAudio,
    generateNotes,
    updateTranscript,
    getTranscript,
  };
}
