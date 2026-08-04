import { useCallback, useEffect, useState } from "react";
import type { AudioTranscriptSummary } from "@freshr/shared";

/**
 * Owns the transcript history for a notebook.
 *
 * This list used to live inside AudioColumn, which meant only the audio tool
 * could see it. The sidebar now renders it alongside the other tools'
 * histories, so the state has to sit above both.
 */
export default function useAudioTranscripts({
  notebookId,
  listTranscripts,
  deleteTranscript,
  enabled,
}: {
  notebookId: string;
  listTranscripts: () => Promise<AudioTranscriptSummary[]>;
  deleteTranscript: (transcriptId: string) => Promise<unknown>;
  enabled: boolean;
}) {
  const [transcripts, setTranscripts] = useState<AudioTranscriptSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      setTranscripts(await listTranscripts());
    } catch (err) {
      // A failed history fetch must not take the audio tool down with it; the
      // panel simply renders empty and the next refresh retries.
      console.error("Failed to load transcripts:", err);
    } finally {
      setLoading(false);
    }
    // listTranscripts is rebuilt every render by the page, so keying on the
    // notebook is what actually decides when a refetch is warranted.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notebookId]);

  useEffect(() => {
    if (enabled) refresh();
  }, [enabled, refresh]);

  /** Shows a just-started transcription before the server has caught up. */
  const addPending = useCallback(
    (id: string, title: string) =>
      setTranscripts((prev) => [
        {
          id,
          title,
          has_notes: false,
          transcription_status: "pending",
          notes_status: "not_started",
          created_at: new Date().toISOString(),
        },
        ...prev.filter((t) => t.id !== id),
      ]),
    [],
  );

  const markHasNotes = useCallback(
    (id: string) =>
      setTranscripts((prev) =>
        prev.map((t) => (t.id === id ? { ...t, has_notes: true } : t)),
      ),
    [],
  );

  const remove = useCallback(
    async (id: string) => {
      await deleteTranscript(id);
      setTranscripts((prev) => prev.filter((t) => t.id !== id));
      setSelectedId((current) => (current === id ? null : current));
    },
    [deleteTranscript],
  );

  return {
    transcripts,
    loading,
    selectedId,
    setSelectedId,
    refresh,
    addPending,
    markHasNotes,
    remove,
  };
}
