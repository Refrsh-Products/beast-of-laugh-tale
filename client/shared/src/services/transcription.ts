import type { ServiceDeps } from "../platform/deps";
import type {
  AudioTranscriptSummary,
  AudioTranscriptDetail,
  TranscribeKickoffResponse,
  NotesStatus,
} from "../types/transcription";
import { TranscriptionServiceEndpoints } from "./endpoints";

export interface TranscriptionService {
  transcribeAudio(
    notebookId: string,
    file: File,
    title: string,
  ): Promise<TranscribeKickoffResponse>;
  listAudioTranscripts(notebookId: string): Promise<AudioTranscriptSummary[]>;
  getAudioTranscript(
    notebookId: string,
    transcriptId: string,
  ): Promise<AudioTranscriptDetail>;
  updateAudioTranscript(
    notebookId: string,
    transcriptId: string,
    fields: { transcript_text?: string; title?: string },
  ): Promise<void>;
  generateNotesFromTranscript(
    notebookId: string,
    transcriptId: string,
  ): Promise<{ notes_status: NotesStatus }>;
  deleteAudioTranscript(
    notebookId: string,
    transcriptId: string,
  ): Promise<void>;
}

export function createTranscriptionService(
  deps: ServiceDeps,
): TranscriptionService {
  const { http } = deps;

  return {
    transcribeAudio: async (notebookId, file, title) => {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("title", title);
      // 60s is more than enough for the upload + 202 — actual transcription
      // happens in a Celery task; the frontend polls for completion.
      return await http.request<TranscribeKickoffResponse>(
        TranscriptionServiceEndpoints.transcribeAudio(notebookId),
        "POST",
        formData,
        { headers: { "Content-Type": undefined }, timeout: 60000 },
      );
    },

    listAudioTranscripts: async (notebookId) => {
      return await http.request<AudioTranscriptSummary[]>(
        TranscriptionServiceEndpoints.listAudioTranscripts(notebookId),
        "GET",
      );
    },

    getAudioTranscript: async (notebookId, transcriptId) => {
      return await http.request<AudioTranscriptDetail>(
        TranscriptionServiceEndpoints.getAudioTranscript(
          notebookId,
          transcriptId,
        ),
        "GET",
      );
    },

    updateAudioTranscript: async (notebookId, transcriptId, fields) => {
      await http.request(
        TranscriptionServiceEndpoints.updateAudioTranscript(
          notebookId,
          transcriptId,
        ),
        "PATCH",
        fields,
      );
    },

    generateNotesFromTranscript: async (notebookId, transcriptId) => {
      // Kicks off a Celery task and returns 202 — actual notes are written to
      // the AudioTranscript row; the frontend polls for completion.
      return await http.request<{ notes_status: NotesStatus }>(
        TranscriptionServiceEndpoints.generateNotesFromTranscript(
          notebookId,
          transcriptId,
        ),
        "POST",
        {},
        { timeout: 30000 },
      );
    },

    deleteAudioTranscript: async (notebookId, transcriptId) => {
      await http.request(
        TranscriptionServiceEndpoints.deleteAudioTranscript(
          notebookId,
          transcriptId,
        ),
        "DELETE",
      );
    },
  };
}
