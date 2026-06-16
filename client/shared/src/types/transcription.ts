/**
 * Audio transcription DTOs. Previously declared inside the React component
 * `web/src/components/notebook/AudioColumn.tsx`; that component now re-exports
 * these so existing imports keep working.
 */

export type TranscriptionStatus = "pending" | "processing" | "ready" | "failed";
export type NotesStatus = "not_started" | "processing" | "ready" | "failed";

export interface AudioTranscriptSummary {
  id: string;
  title: string;
  has_notes: boolean;
  transcription_status: TranscriptionStatus;
  notes_status: NotesStatus;
  created_at: string;
}

export interface AudioTranscriptDetail {
  id: string;
  title: string;
  transcript_text: string;
  notes_text: string;
  has_notes: boolean;
  transcription_status: TranscriptionStatus;
  transcription_error: string;
  notes_status: NotesStatus;
  notes_error: string;
  created_at: string;
  updated_at: string;
}

export interface TranscribeKickoffResponse {
  transcript_id: string;
  transcription_status: TranscriptionStatus;
}
