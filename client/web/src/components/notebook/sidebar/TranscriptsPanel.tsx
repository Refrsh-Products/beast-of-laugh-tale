import type { AudioTranscriptSummary } from "@freshr/shared";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RiDeleteBin6Line, RiLoader4Line } from "@remixicon/react";
import { formatRelativeTime } from "@/lib/formatRelativeTime";
import { SidebarEmpty, SidebarItem, SidebarSection } from "./SidebarSection";

/**
 * Transcript history, lifted out of AudioColumn's internal HistoryPanel so the
 * audio tool matches the other three: history in the sidebar, work in the main
 * area.
 */
export default function TranscriptsPanel({
  transcripts,
  selectedTranscriptId,
  loading = false,
  onTranscriptClick,
  onDelete,
  disabled = false,
}: {
  transcripts: AudioTranscriptSummary[];
  selectedTranscriptId: string | null;
  loading?: boolean;
  onTranscriptClick: (transcript: AudioTranscriptSummary) => void;
  onDelete: (transcriptId: string) => void;
  disabled?: boolean;
}) {
  return (
    <SidebarSection title="Transcripts">
      {loading ? (
        <SidebarEmpty>
          <RiLoader4Line
            className="mx-auto size-4 animate-spin"
            aria-hidden="true"
          />
        </SidebarEmpty>
      ) : transcripts.length === 0 ? (
        <SidebarEmpty>No recordings yet. Upload audio to begin.</SidebarEmpty>
      ) : (
        <ul className="flex flex-col gap-0.5">
          {transcripts.map((transcript) => (
            <li key={transcript.id} className="group/tx relative">
              <SidebarItem
                active={transcript.id === selectedTranscriptId}
                onClick={() => onTranscriptClick(transcript)}
                className="flex-col items-start gap-1 pr-8"
              >
                <span className="w-full truncate">{transcript.title}</span>
                <span className="text-muted-foreground flex items-center gap-2 text-xs font-normal">
                  {transcript.transcription_status !== "ready" && (
                    <Badge variant="outline" className="px-1.5 py-0">
                      {transcript.transcription_status}
                    </Badge>
                  )}
                  {transcript.has_notes && (
                    <Badge variant="secondary" className="px-1.5 py-0">
                      Notes
                    </Badge>
                  )}
                  {formatRelativeTime(transcript.created_at)}
                </span>
              </SidebarItem>

              <Button
                variant="ghost"
                size="icon-xs"
                disabled={disabled}
                aria-label={`Delete ${transcript.title}`}
                onClick={() => onDelete(transcript.id)}
                className="absolute top-2 right-1 z-10 opacity-0 focus-visible:opacity-100 group-hover/tx:opacity-100"
              >
                <RiDeleteBin6Line aria-hidden="true" />
              </Button>
            </li>
          ))}
        </ul>
      )}
    </SidebarSection>
  );
}
