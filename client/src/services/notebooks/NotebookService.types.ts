import type { Notebook, NotebookFile } from "../../storage";
import type { NotebookFileCreateResponse } from "./NotebookFile.types";
import type { NotebookTopic } from "../quiz/Quiz.types";
import type {
  AudioTranscriptSummary,
  AudioTranscriptDetail,
  TranscribeKickoffResponse,
  TranscriptionStatus,
  NotesStatus,
} from "../../components/notebook/AudioColumn";
export type {
  AudioTranscriptSummary,
  AudioTranscriptDetail,
  TranscribeKickoffResponse,
  TranscriptionStatus,
  NotesStatus,
};

export interface NotebookService {
  list(): Promise<Notebook[]>; // List of all the notebooks for the user
  listArchived(): Promise<Notebook[]>; // List of all the archived notebooks for the user
  getNotebook(notebook_id: string): Promise<Notebook>; // Get the information on the notebook with the given id
  create(title: string): Promise<Notebook>; // Create a notebook for the user
  update(id: string, changes: Partial<Notebook>): Promise<Notebook>; // Update an existing notebook for the user
  delete(id: string): Promise<void>; // Delete an existing notebook for the user
  archive(id: string): Promise<void>;
  unarchive(id: string): Promise<void>;
  listFiles(notebookId: string): Promise<NotebookFile[]>; // List files in a notebook
  createFile(
    notebook_id: string,
    file: File,
  ): Promise<NotebookFileCreateResponse>; // Upload a new file in notebook with the given id
  deleteFile(notebook_id: string, file_id: string): Promise<void>;
  renameFile(
    notebook_id: string,
    file_id: string,
    newName: string,
  ): Promise<void>;
  listTopics(notebook_id: string): Promise<NotebookTopic[]>;
  transcribeAudio(notebookId: string, file: File, title: string): Promise<TranscribeKickoffResponse>;
  listAudioTranscripts(notebookId: string): Promise<AudioTranscriptSummary[]>;
  getAudioTranscript(notebookId: string, transcriptId: string): Promise<AudioTranscriptDetail>;
  updateAudioTranscript(notebookId: string, transcriptId: string, fields: { transcript_text?: string; title?: string }): Promise<void>;
  generateNotesFromTranscript(notebookId: string, transcriptId: string): Promise<{ notes_status: NotesStatus }>;
  deleteAudioTranscript(notebookId: string, transcriptId: string): Promise<void>;
  seed(): Promise<void>;
}
