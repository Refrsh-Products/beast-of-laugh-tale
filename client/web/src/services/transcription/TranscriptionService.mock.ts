import type { TranscriptionService } from "@freshr/shared";

const TranscriptionServiceMock: TranscriptionService = {
  transcribeAudio: (_notebookId, _file, _title) =>
    Promise.resolve({
      transcript_id: "mock-id",
      transcription_status: "ready" as const,
    }),
  listAudioTranscripts: (_notebookId) => Promise.resolve([]),
  getAudioTranscript: (_notebookId, _transcriptId) =>
    Promise.resolve({
      id: "mock-id",
      title: "Mock Lecture",
      transcript_text:
        "Mock transcript: this is a placeholder transcription for local development.",
      notes_text: "## Mock Notes\n\n- Point 1\n- Point 2",
      has_notes: true,
      transcription_status: "ready" as const,
      transcription_error: "",
      notes_status: "ready" as const,
      notes_error: "",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }),
  updateAudioTranscript: (_notebookId, _transcriptId, _fields) =>
    Promise.resolve(),
  generateNotesFromTranscript: (_notebookId, _transcriptId) =>
    Promise.resolve({ notes_status: "ready" as const }),
  deleteAudioTranscript: (_notebookId, _transcriptId) => Promise.resolve(),
};

export default TranscriptionServiceMock;
