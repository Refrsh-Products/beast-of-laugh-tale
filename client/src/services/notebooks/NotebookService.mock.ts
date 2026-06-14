import {
  getNotebooks,
  getArchivedNotebooks,
  createNotebook,
  updateNotebook,
  deleteNotebook,
  archiveNotebook,
  unarchiveNotebook,
  getNotebook,
  listFiles,
  createFile,
  deleteFile,
  seedNotebooks,
  renameNotebookFile,
} from "../../storage";
import type { NotebookService } from "./NotebookService.types";

const NotebookServiceMock: NotebookService = {
  list: () => Promise.resolve(getNotebooks()),
  listArchived: () => Promise.resolve(getArchivedNotebooks()),
  listFiles: (notebookId) => Promise.resolve(
    listFiles(notebookId).map((f) => ({ ...f, ingestion_status: "ready" as const }))
  ),
  create: (title) => Promise.resolve(createNotebook(title)),
  update: (id, changes) => {
    updateNotebook(id, changes);
    const updated = getNotebooks().find((notebook) => notebook.id === id);
    if (!updated)
      return Promise.reject(new Error(`Notebook with id "${id}" not found`));
    return Promise.resolve(updated);
  },
  delete: (id) => {
    deleteNotebook(id);
    return Promise.resolve();
  },
  archive: (id) => {
    archiveNotebook(id);
    return Promise.resolve();
  },
  unarchive: (id) => {
    unarchiveNotebook(id);
    return Promise.resolve();
  },
  getNotebook: (notebook_id) => {
    return Promise.resolve(getNotebook(notebook_id));
  },
  createFile: (notebookId, file) =>
    Promise.resolve({
      success: true,
      errors: [],
      id: createFile(notebookId, file).id,
      ingestion_status: "ready",
    }),
  deleteFile: (notebookId, fileId) => {
    deleteFile(notebookId, fileId);
    return Promise.resolve();
  },
  renameFile: (notebookId, fileId, newName) => {
    renameNotebookFile(notebookId, fileId, newName);
    return Promise.resolve();
  },
  listTopics: (_notebookId) => Promise.resolve([
    { id: "t1", name: "Introduction & Overview" },
    { id: "t2", name: "Core Concepts" },
    { id: "t3", name: "Key Definitions" },
    { id: "t4", name: "Methods & Techniques" },
    { id: "t5", name: "Case Studies" },
    { id: "t6", name: "Common Mistakes" },
  ]),
  transcribeAudio: (_notebookId, _file, _title) =>
    Promise.resolve({ transcript_id: "mock-id", transcription_status: "ready" as const }),
  listAudioTranscripts: (_notebookId) => Promise.resolve([]),
  getAudioTranscript: (_notebookId, _transcriptId) =>
    Promise.resolve({
      id: "mock-id",
      title: "Mock Lecture",
      transcript_text: "Mock transcript: this is a placeholder transcription for local development.",
      notes_text: "## Mock Notes\n\n- Point 1\n- Point 2",
      has_notes: true,
      transcription_status: "ready" as const,
      transcription_error: "",
      notes_status: "ready" as const,
      notes_error: "",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }),
  updateAudioTranscript: (_notebookId, _transcriptId, _fields) => Promise.resolve(),
  generateNotesFromTranscript: (_notebookId, _transcriptId) =>
    Promise.resolve({ notes_status: "ready" as const }),
  deleteAudioTranscript: (_notebookId, _transcriptId) => Promise.resolve(),
  seed: () => {
    seedNotebooks();
    return Promise.resolve();
  },
};

export default NotebookServiceMock;
