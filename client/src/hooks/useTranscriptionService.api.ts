import { useMemo } from "react";
import type { TranscriptionService } from "../services/transcription/TranscriptionService.types";
import createFreshrApiInstance, {
  TranscriptionServiceEndpoints,
} from "../services/freshr-api";
import useAxiosInterceptor from "./useAxiosInterceptor";
import type {
  AudioTranscriptSummary,
  AudioTranscriptDetail,
  TranscribeKickoffResponse,
  NotesStatus,
} from "../components/notebook/AudioColumn";
import { useFetch } from "./useFetch";

const useTranscriptionServiceApi = (): TranscriptionService => {
  const api = useMemo(() => createFreshrApiInstance(), []);
  const apiWithInterceptor = useAxiosInterceptor(api);
  const { fetchData } = useFetch(apiWithInterceptor);

  return {
    transcribeAudio: async (notebookId, file, title) => {
      try {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("title", title);
        // 60s is more than enough for the upload + 202 — actual transcription
        // happens in a Celery task; the frontend polls for completion.
        const response = await fetchData<TranscribeKickoffResponse>(
          TranscriptionServiceEndpoints.transcribeAudio(notebookId),
          "POST",
          formData,
          { headers: { "Content-Type": undefined }, timeout: 60000 },
        );
        return response;
      } catch (err) {
        throw err;
      }
    },

    listAudioTranscripts: async (notebookId) => {
      try {
        const response = await fetchData<AudioTranscriptSummary[]>(
          TranscriptionServiceEndpoints.listAudioTranscripts(notebookId),
          "GET",
        );
        return response;
      } catch (err) {
        throw err;
      }
    },

    getAudioTranscript: async (notebookId, transcriptId) => {
      try {
        const response = await fetchData<AudioTranscriptDetail>(
          TranscriptionServiceEndpoints.getAudioTranscript(
            notebookId,
            transcriptId,
          ),
          "GET",
        );
        return response;
      } catch (err) {
        throw err;
      }
    },

    updateAudioTranscript: async (notebookId, transcriptId, fields) => {
      try {
        await fetchData(
          TranscriptionServiceEndpoints.updateAudioTranscript(
            notebookId,
            transcriptId,
          ),
          "PATCH",
          fields,
        );
      } catch (err) {
        throw err;
      }
    },

    generateNotesFromTranscript: async (notebookId, transcriptId) => {
      try {
        // Kicks off a Celery task and returns 202 — actual notes are written to
        // the AudioTranscript row; the frontend polls for completion.
        const response = await fetchData<{ notes_status: NotesStatus }>(
          TranscriptionServiceEndpoints.generateNotesFromTranscript(
            notebookId,
            transcriptId,
          ),
          "POST",
          {},
          { timeout: 30000 },
        );
        return response;
      } catch (err) {
        throw err;
      }
    },

    deleteAudioTranscript: async (notebookId, transcriptId) => {
      try {
        await fetchData(
          TranscriptionServiceEndpoints.deleteAudioTranscript(
            notebookId,
            transcriptId,
          ),
          "DELETE",
        );
      } catch (err) {
        throw err;
      }
    },
  };
};

export default useTranscriptionServiceApi;
