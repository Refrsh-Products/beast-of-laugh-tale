import type {
  AudioTranscriptSummary,
  AudioTranscriptDetail,
  TranscribeKickoffResponse,
  NotesStatus,
} from "../../components/notebook/AudioColumn";

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
