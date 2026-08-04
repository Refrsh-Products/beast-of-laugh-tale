import { useState, useRef, useEffect } from "react";
import {
  ACCEPTED_AUDIO_EXTENSIONS,
  ACCEPTED_AUDIO_TYPES,
  MAX_AUDIO_BYTES,
  isAudioFile,
} from "../../lib/constants";
import MathMarkdown from "../common/MathMarkdown";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import {
  RiMicLine,
  RiAddLine,
  RiLoader4Line,
  RiArrowLeftLine,
  RiUploadCloud2Line,
  RiCloseLine,
  RiCheckLine,
  RiSparkling2Line,
} from "@remixicon/react";

// ─── Types ───────────────────────────────────────────────────────────────────
// Transcription DTOs live in @freshr/shared; imported here for local use.
import type { AudioTranscriptDetail } from "@freshr/shared";

type Tab = "new" | "history";
type NewStep = "upload" | "transcribing" | "review" | "generating";
type DetailTab = "transcript" | "notes";

interface AudioColumnProps {
  notebookId: string;
  // These functions return the final result — the parent hides any task-polling
  // behind the promise resolution. The column doesn't know whether the backend
  // is sync or async.
  onTranscribeAudio: (
    file: File,
    title: string,
  ) => Promise<{ transcript_id: string; transcript: string }>;
  onGenerateNotes: (transcriptId: string) => Promise<string>;
  onUpdateTranscript: (
    transcriptId: string,
    fields: { transcript_text?: string; title?: string },
  ) => Promise<void>;
  onGetTranscript: (transcriptId: string) => Promise<AudioTranscriptDetail>;
  onNotesGenerated?: () => void;
  // When false the user is on a plan that doesn't include audio. They can still
  // view past transcripts + notes (read-only) but can't create or edit any.
  canMutate?: boolean;
  onUpgrade?: () => void;
  selectedTranscriptId?: string | null;
  onTranscriptStarted?: (id: string, title: string) => void;
  onNotesSaved?: (id: string) => void;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

const acceptedExtList = ACCEPTED_AUDIO_EXTENSIONS.join(", ");

const TIPS = [
  "Record in a quiet room — background noise reduces accuracy.",
  "Hold your phone close to the professor.",
  "Avoid covering the mic during recording.",
  "Start recording before the lecture begins.",
];

// ─── Small components ─────────────────────────────────────────────────────────

/** Kept as a component because the panels pass a pixel size. */
function SpinnerIcon({ size = 18 }: { size?: number }) {
  return (
    <RiLoader4Line
      className="animate-spin"
      style={{ width: size, height: size }} // eslint-disable-line no-restricted-syntax -- caller-supplied pixel size
      aria-hidden="true"
    />
  );
}

/** Markdown overrides for generated study notes. Mirrors ChatMessage's set. */
const NOTES_MARKDOWN_COMPONENTS = {
  p: ({ children }: { children?: React.ReactNode }) => (
    <p className="mb-2 leading-relaxed last:mb-0">{children}</p>
  ),
  strong: ({ children }: { children?: React.ReactNode }) => (
    <strong className="font-semibold">{children}</strong>
  ),
  em: ({ children }: { children?: React.ReactNode }) => (
    <em className="italic">{children}</em>
  ),
  ul: ({ children }: { children?: React.ReactNode }) => (
    <ul className="my-2 list-disc pl-5">{children}</ul>
  ),
  ol: ({ children }: { children?: React.ReactNode }) => (
    <ol className="my-2 list-decimal pl-5">{children}</ol>
  ),
  li: ({ children }: { children?: React.ReactNode }) => (
    <li className="mb-1 leading-relaxed">{children}</li>
  ),
  h1: ({ children }: { children?: React.ReactNode }) => (
    <h1 className="mt-4 mb-2 text-lg font-bold tracking-[-0.01em]">
      {children}
    </h1>
  ),
  h2: ({ children }: { children?: React.ReactNode }) => (
    <h2 className="mt-4 mb-2 text-base font-bold">{children}</h2>
  ),
  h3: ({ children }: { children?: React.ReactNode }) => (
    <h3 className="mt-3 mb-1 text-sm font-semibold">{children}</h3>
  ),
  hr: () => <hr className="border-border my-4" />,
  table: ({ children }: { children?: React.ReactNode }) => (
    <div className="my-2 overflow-x-auto">
      <table className="w-full text-left text-sm">{children}</table>
    </div>
  ),
  th: ({ children }: { children?: React.ReactNode }) => (
    <th className="border-border border-b px-2 py-1 font-semibold">
      {children}
    </th>
  ),
  td: ({ children }: { children?: React.ReactNode }) => (
    <td className="border-border border-b px-2 py-1">{children}</td>
  ),
  code: ({
    children,
    className,
  }: {
    children?: React.ReactNode;
    className?: string;
  }) => {
    const isBlock = className?.startsWith("language-");
    return isBlock ? (
      <pre className="bg-muted border-border my-2 overflow-x-auto rounded-md border p-3">
        <code className="font-mono text-xs">{children}</code>
      </pre>
    ) : (
      <code className="bg-muted border-border rounded border px-1 py-0.5 font-mono text-xs">
        {children}
      </code>
    );
  },
};

function NotesView({ notes }: { notes: string }) {
  return (
    <div className="bg-card border-border freshr-scroll min-h-60 flex-1 overflow-y-auto rounded-lg border px-4 py-3.5 text-sm">
      <MathMarkdown components={NOTES_MARKDOWN_COMPONENTS}>
        {notes}
      </MathMarkdown>
    </div>
  );
}

/**
 * Adapter over the shadcn Button, keeping the primary/danger/fullWidth prop
 * shape the audio panels already use so they didn't all need rewriting.
 */
function ActionButton({
  onClick,
  disabled,
  primary,
  danger,
  fullWidth,
  children,
}: {
  onClick: () => void;
  disabled?: boolean;
  primary?: boolean;
  danger?: boolean;
  fullWidth?: boolean;
  children: React.ReactNode;
}) {
  return (
    <Button
      onClick={onClick}
      disabled={disabled}
      variant={danger ? "destructive" : primary ? "default" : "outline"}
      size="sm"
      className={cn("whitespace-nowrap", fullWidth && "flex-1")}
    >
      {children}
    </Button>
  );
}

// ─── Inline upsell (used inside the column for free / downgraded users) ──────

const UPSELL_FEATURES = [
  "Upload mp3 / m4a / wav / mp4 lecture audio up to 500 MB",
  "Accurate Bangla + English transcription",
  "Edit transcripts before generating notes",
  "Auto-structured study notes saved to your notebook",
];

function InlineUpsell({ onUpgrade }: { onUpgrade?: () => void }) {
  return (
    <div className="flex flex-1 flex-col gap-4">
      <Badge variant="secondary" className="self-start">
        Pro feature
      </Badge>

      <h3 className="text-2xl font-bold tracking-[-0.02em]">
        Turn your lecture recordings into ready-to-study notes
      </h3>
      <p className="text-muted-foreground leading-relaxed">
        Record your professor, drop the file here, and Freshr handles the rest —
        transcription in Bangla and English, then structured notes you can study
        from.
      </p>

      <ul className="flex flex-col gap-2">
        {UPSELL_FEATURES.map((feature) => (
          <li key={feature} className="flex items-start gap-2 text-sm">
            <RiCheckLine
              className="text-primary mt-0.5 size-4 shrink-0"
              aria-hidden="true"
            />
            {feature}
          </li>
        ))}
      </ul>

      <Button onClick={onUpgrade} className="self-start">
        <RiSparkling2Line aria-hidden="true" />
        Upgrade to Pro
      </Button>
    </div>
  );
}

// ─── New transcription flow ───────────────────────────────────────────────────

function NewTranscriptionPanel({
  onTranscribed,
  onTranscribeAudio,
  canMutate,
  onUpgrade,
}: {
  onTranscribed: (id: string, transcript: string, title: string) => void;
  onTranscribeAudio: (
    file: File,
    title: string,
  ) => Promise<{ transcript_id: string; transcript: string }>;
  canMutate: boolean;
  onUpgrade?: () => void;
}) {
  // NOTE: All hooks must come before any conditional return — toggling `canMutate`
  // would otherwise change the hook count between renders and crash React.
  const [step, setStep] = useState<NewStep>("upload");
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Read-only / non-paid users get the upsell content instead of the upload form.
  if (!canMutate) {
    return <InlineUpsell onUpgrade={onUpgrade} />;
  }

  const fileTooLarge = file ? file.size > MAX_AUDIO_BYTES : false;
  const canTranscribe = !!file && !fileTooLarge && !!title.trim();

  function pickFile(f: File) {
    setFile(f);
    setTitle(f.name.replace(/\.[^.]+$/, "").replace(/[-_]/g, " "));
    setError(null);
  }

  function rejectNonAudio(files: File[]) {
    const first = files[0];
    const ext = first?.name.includes(".")
      ? first.name.split(".").pop()!.toLowerCase()
      : "unknown";
    setError(
      `.${ext} is not a supported audio format. Use ${acceptedExtList}.`,
    );
    setFile(null);
    setTitle("");
  }

  function selectFromList(files: File[]) {
    if (files.length === 0) return;
    const audio = files.find(isAudioFile);
    if (audio) pickFile(audio);
    else rejectNonAudio(files);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
    selectFromList(Array.from(e.dataTransfer.files));
  }

  async function handleTranscribe() {
    if (!file) return;
    setStep("transcribing");
    setError(null);
    try {
      const { transcript_id, transcript } = await onTranscribeAudio(
        file,
        title || file.name.replace(/\.[^.]+$/, ""),
      );
      onTranscribed(transcript_id, transcript, title);
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : "Transcription failed. Please try again.",
      );
      setStep("upload");
    }
  }

  return (
    <div className="flex flex-1 flex-col gap-4">
      {step === "upload" && (
        <>
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={cn(
              "flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-dashed px-3 py-6 text-center transition-colors",
              isDragging
                ? "border-primary bg-accent"
                : "border-input bg-card hover:bg-accent/50",
            )}
          >
            <RiUploadCloud2Line
              className="text-muted-foreground size-7"
              aria-hidden="true"
            />
            <span className="text-sm leading-relaxed">
              Drop audio file here
              <br />
              or click to upload
            </span>
            <span className="text-muted-foreground text-xs">
              {acceptedExtList}
            </span>
            <input
              ref={fileInputRef}
              type="file"
              hidden
              accept={ACCEPTED_AUDIO_TYPES}
              onChange={(e) => {
                selectFromList(Array.from(e.target.files ?? []));
                e.target.value = "";
              }}
            />
          </div>

          {file && (
            <div
              className={cn(
                "flex items-center gap-3 rounded-lg border px-3 py-2.5",
                fileTooLarge
                  ? "border-destructive bg-destructive/10"
                  : "border-border bg-card",
              )}
            >
              <RiMicLine
                className="text-primary size-5 shrink-0"
                aria-hidden="true"
              />
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-semibold">
                  {file.name}
                </div>
                <div
                  className={cn(
                    "text-xs",
                    fileTooLarge ? "text-destructive" : "text-muted-foreground",
                  )}
                >
                  {formatSize(file.size)}
                  {fileTooLarge ? " · exceeds 500 MB" : ""}
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="Remove file"
                onClick={(e) => {
                  e.stopPropagation();
                  setFile(null);
                  setTitle("");
                }}
              >
                <RiCloseLine aria-hidden="true" />
              </Button>
            </div>
          )}

          {file && !fileTooLarge && (
            <div className="flex flex-col gap-2">
              <label
                htmlFor="lecture-title"
                className="text-xs font-semibold tracking-widest uppercase"
              >
                Lecture title
              </label>
              <Input
                id="lecture-title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Data Structures — Lecture 5"
              />
            </div>
          )}

          {error && (
            <p
              role="alert"
              className="border-destructive bg-destructive/10 text-destructive rounded-lg border px-3 py-2.5 text-sm"
            >
              {error}
            </p>
          )}

          <div className="bg-muted border-border rounded-lg border px-3.5 py-3">
            <div className="mb-2 text-xs font-semibold tracking-widest uppercase">
              Tips for better transcription
            </div>
            <ul className="text-muted-foreground list-disc pl-4 text-sm">
              {TIPS.map((tip) => (
                <li key={tip} className="mb-1 leading-relaxed last:mb-0">
                  {tip}
                </li>
              ))}
            </ul>
          </div>

          <div className="border-border mt-1 flex justify-center border-t pt-4">
            <Button
              size="lg"
              onClick={handleTranscribe}
              disabled={!canTranscribe}
            >
              Transcribe
            </Button>
          </div>
        </>
      )}

      {step === "transcribing" && (
        <div className="flex min-h-56 flex-1 flex-col items-center justify-center gap-4 text-center">
          <RiLoader4Line
            className="text-primary size-10 animate-spin"
            aria-hidden="true"
          />
          <div>
            <div className="mb-2 text-lg font-bold tracking-[-0.01em]">
              Transcribing your lecture…
            </div>
            <p className="text-muted-foreground text-sm leading-relaxed">
              This may take a minute for longer recordings.
              <br />
              Please keep this window open.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Transcript detail view ───────────────────────────────────────────────────

function TranscriptDetailView({
  detail,
  onGenerateNotes,
  onSaveTranscript,
  onBack,
  onNotesGenerated,
  canMutate,
  onUpgrade,
}: {
  detail: AudioTranscriptDetail;
  onGenerateNotes: (transcriptId: string) => Promise<string>;
  onSaveTranscript: (
    transcriptId: string,
    fields: { transcript_text?: string; title?: string },
  ) => Promise<void>;
  onBack: () => void;
  onNotesGenerated?: () => void;
  canMutate: boolean;
  onUpgrade?: () => void;
}) {
  const [detailTab, setDetailTab] = useState<DetailTab>(
    detail.has_notes ? "notes" : "transcript",
  );
  const [transcript, setTranscript] = useState(detail.transcript_text);
  const [title, setTitle] = useState(detail.title);
  const [savedTranscript, setSavedTranscript] = useState(
    detail.transcript_text,
  );
  const [savedTitle, setSavedTitle] = useState(detail.title);
  const [notes, setNotes] = useState(detail.notes_text);
  const [hasNotes, setHasNotes] = useState(detail.has_notes);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const isDirty = transcript !== savedTranscript || title !== savedTitle;

  // Clear the "Saved ✓" indicator after 2.5s, with cleanup on unmount or re-save
  useEffect(() => {
    if (!saveSuccess) return;
    const t = setTimeout(() => setSaveSuccess(false), 2500);
    return () => clearTimeout(t);
  }, [saveSuccess]);

  async function handleSave() {
    setSaving(true);
    setSaveSuccess(false);
    setSaveError(null);
    try {
      await onSaveTranscript(detail.id, { transcript_text: transcript, title });
      setSavedTranscript(transcript);
      setSavedTitle(title);
      setSaveSuccess(true);
    } catch (err: unknown) {
      setSaveError(
        err instanceof Error ? err.message : "Save failed. Please try again.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleGenerateNotes() {
    setGenerating(true);
    setGenerateError(null);
    try {
      const notesText = await onGenerateNotes(detail.id);
      setNotes(notesText);
      setHasNotes(true);
      setDetailTab("notes");
      onNotesGenerated?.();
    } catch (err: unknown) {
      setGenerateError(
        err instanceof Error ? err.message : "Notes generation failed.",
      );
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="mb-3 flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <RiArrowLeftLine aria-hidden="true" />
          Back
        </Button>
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          readOnly={!canMutate}
          aria-label="Transcript title"
          className="border-transparent bg-transparent text-base font-bold shadow-none"
        />
      </div>

      <Tabs
        value={detailTab}
        onValueChange={(value) => setDetailTab(value as DetailTab)}
        className="min-h-0 flex-1 gap-3"
      >
        <TabsList>
          <TabsTrigger value="transcript">Transcript</TabsTrigger>
          <TabsTrigger value="notes">
            Notes{!hasNotes ? " (none yet)" : ""}
          </TabsTrigger>
        </TabsList>

        <TabsContent
          value="transcript"
          className="flex min-h-0 flex-1 flex-col gap-1.5"
        >
          <Textarea
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
            readOnly={!canMutate}
            aria-label="Transcript text"
            className="min-h-64 flex-1 resize-y font-mono text-xs leading-relaxed"
          />
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground text-xs">
              {transcript
                .trim()
                .split(/\s+/)
                .filter(Boolean)
                .length.toLocaleString()}{" "}
              words
            </span>
            {canMutate && isDirty && (
              <ActionButton onClick={handleSave} disabled={saving}>
                {saving ? (
                  <>
                    <SpinnerIcon size={13} /> Saving…
                  </>
                ) : saveSuccess ? (
                  <>
                    <RiCheckLine aria-hidden="true" /> Saved
                  </>
                ) : (
                  "Save changes"
                )}
              </ActionButton>
            )}
          </div>
        </TabsContent>

        <TabsContent value="notes" className="flex min-h-0 flex-1 flex-col">
          {hasNotes ? (
            <NotesView notes={notes} />
          ) : (
            <div className="text-muted-foreground flex min-h-44 flex-1 flex-col items-center justify-center gap-3 text-center text-sm leading-relaxed">
              <p>
                No notes generated yet.
                <br />
                {canMutate
                  ? "Generate notes from the transcript."
                  : "Upgrade to Pro to generate notes from this transcript."}
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {(generateError || saveError) && (
        <p
          role="alert"
          className="border-destructive bg-destructive/10 text-destructive mt-2 rounded-lg border px-3 py-2 text-sm"
        >
          {generateError || saveError}
        </p>
      )}

      <div className="flex gap-2 pt-3">
        {canMutate ? (
          <ActionButton
            onClick={handleGenerateNotes}
            disabled={generating}
            primary
            fullWidth
          >
            {generating ? (
              <>
                <SpinnerIcon size={13} />
                Generating…
              </>
            ) : hasNotes ? (
              "Regenerate notes"
            ) : (
              "Generate notes"
            )}
          </ActionButton>
        ) : (
          onUpgrade && (
            <ActionButton onClick={onUpgrade} primary fullWidth>
              Upgrade to Pro to {hasNotes ? "regenerate" : "generate"} notes
            </ActionButton>
          )
        )}
      </div>
    </div>
  );
}

// The history list lived here as HistoryPanel. It now renders in the
// notebook sidebar (sidebar/TranscriptsPanel) alongside the other tools'
// histories, and selection arrives through the selectedTranscriptId prop.
// ─── Review panel (after transcription, before generating notes) ──────────────

function ReviewPanel({
  transcriptId,
  initialTranscript,
  initialTitle,
  onGenerateNotes,
  onSaveTranscript,
  onNotesGenerated,
  onReset,
}: {
  transcriptId: string;
  initialTranscript: string;
  initialTitle: string;
  onGenerateNotes: (transcriptId: string) => Promise<string>;
  onSaveTranscript: (
    transcriptId: string,
    fields: { transcript_text?: string; title?: string },
  ) => Promise<void>;
  onNotesGenerated?: () => void;
  onReset: () => void;
}) {
  const [transcript, setTranscript] = useState(initialTranscript);
  const [title, setTitle] = useState(initialTitle);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notes, setNotes] = useState<string | null>(null);
  const [detailTab, setDetailTab] = useState<DetailTab>("transcript");

  async function handleGenerateNotes() {
    setGenerating(true);
    setError(null);
    try {
      // Save any edits first so the task generates notes from the latest text.
      await onSaveTranscript(transcriptId, {
        transcript_text: transcript,
        title,
      });
      const notesText = await onGenerateNotes(transcriptId);
      setNotes(notesText);
      setDetailTab("notes");
      onNotesGenerated?.();
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : "Notes generation failed. Please try again.",
      );
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="mb-3 flex flex-col gap-2">
        <label
          htmlFor="review-title"
          className="text-xs font-semibold tracking-widest uppercase"
        >
          Lecture title
        </label>
        <Input
          id="review-title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </div>

      <Tabs
        value={detailTab}
        onValueChange={(value) => setDetailTab(value as DetailTab)}
        className="min-h-0 flex-1 gap-3"
      >
        <TabsList>
          <TabsTrigger value="transcript">Transcript</TabsTrigger>
          <TabsTrigger value="notes">
            Notes{notes ? "" : " (not yet)"}
          </TabsTrigger>
        </TabsList>

        <TabsContent
          value="transcript"
          className="flex min-h-0 flex-1 flex-col gap-1.5"
        >
          <Textarea
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
            aria-label="Transcript text"
            className="min-h-60 flex-1 resize-y font-mono text-xs leading-relaxed"
          />
          <p className="text-muted-foreground text-xs">
            {transcript
              .trim()
              .split(/\s+/)
              .filter(Boolean)
              .length.toLocaleString()}{" "}
            words · edit any mistakes before generating
          </p>
        </TabsContent>

        <TabsContent value="notes" className="flex min-h-0 flex-1 flex-col">
          {notes ? (
            <NotesView notes={notes} />
          ) : (
            <div className="text-muted-foreground flex flex-1 items-center justify-center text-sm">
              Generate notes to see them here.
            </div>
          )}
        </TabsContent>
      </Tabs>

      {error && (
        <p
          role="alert"
          className="border-destructive bg-destructive/10 text-destructive mt-2 rounded-lg border px-3 py-2 text-sm"
        >
          {error}
        </p>
      )}

      <div className="flex gap-2 pt-3">
        <ActionButton onClick={onReset} disabled={generating}>
          Start over
        </ActionButton>
        <ActionButton
          onClick={handleGenerateNotes}
          disabled={generating || !transcript.trim()}
          primary
          fullWidth
        >
          {generating ? (
            <>
              <SpinnerIcon size={13} />
              Generating…
            </>
          ) : notes ? (
            "Regenerate notes"
          ) : (
            "Generate notes"
          )}
        </ActionButton>
      </div>
    </div>
  );
}

// ─── Main AudioColumn ─────────────────────────────────────────────────────────

export default function AudioColumn({
  onTranscribeAudio,
  onGenerateNotes,
  onUpdateTranscript,
  onGetTranscript,
  onNotesGenerated,
  canMutate = true,
  onUpgrade,
  selectedTranscriptId = null,
  onTranscriptStarted,
  onNotesSaved,
}: AudioColumnProps) {
  // `tab` now only distinguishes the capture flow from a transcript opened in
  // the sidebar; the history list itself moved out to NotebookSidebar.
  const [tab, setTab] = useState<Tab>("new");

  // After a successful transcription, we hold the ID + text to show the review panel
  const [reviewState, setReviewState] = useState<{
    id: string;
    transcript: string;
    title: string;
  } | null>(null);

  // History detail
  const [detailLoading, setDetailLoading] = useState(false);
  const [selectedDetail, setSelectedDetail] =
    useState<AudioTranscriptDetail | null>(null);

  // The sidebar owns selection now; opening one there switches this panel to
  // the matching detail view.
  useEffect(() => {
    if (!selectedTranscriptId) return;
    setTab("history");
    handleSelectTranscript(selectedTranscriptId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTranscriptId]);

  function handleTranscribed(id: string, transcript: string, title: string) {
    setReviewState({ id, transcript, title });
    // The sidebar shows the optimistic row; this panel just opens the review.
    onTranscriptStarted?.(id, title);
  }

  function handleReset() {
    setReviewState(null);
  }

  async function handleSelectTranscript(id: string) {
    setDetailLoading(true);
    setSelectedDetail(null);
    try {
      const detail = await onGetTranscript(id);
      setSelectedDetail(detail);
    } finally {
      setDetailLoading(false);
    }
  }

  function handleNotesGenerated() {
    const notedId = reviewState?.id ?? selectedDetail?.id;
    // The sidebar owns the "has notes" badge.
    if (notedId) onNotesSaved?.(notedId);
    onNotesGenerated?.();
  }

  return (
    <div className="bg-background flex h-full flex-col overflow-hidden">
      <div className="bg-card border-border flex h-11 shrink-0 items-center gap-2 border-b px-4">
        <RiMicLine className="text-primary size-4" aria-hidden="true" />
        <span className="text-muted-foreground text-xs font-semibold tracking-[0.12em] uppercase">
          Audio notes
        </span>
        {tab === "history" && (
          <Button
            variant="ghost"
            size="xs"
            className="ml-auto"
            onClick={() => {
              setTab("new");
              setSelectedDetail(null);
            }}
          >
            <RiAddLine aria-hidden="true" />
            New recording
          </Button>
        )}
      </div>

      {/* Body */}
      <div className="freshr-scroll flex min-h-0 flex-1 flex-col overflow-y-auto p-4">
        {tab === "new" &&
          (reviewState ? (
            <ReviewPanel
              transcriptId={reviewState.id}
              initialTranscript={reviewState.transcript}
              initialTitle={reviewState.title}
              onGenerateNotes={onGenerateNotes}
              onSaveTranscript={onUpdateTranscript}
              onNotesGenerated={handleNotesGenerated}
              onReset={handleReset}
            />
          ) : (
            <NewTranscriptionPanel
              onTranscribeAudio={onTranscribeAudio}
              onTranscribed={handleTranscribed}
              canMutate={canMutate}
              onUpgrade={onUpgrade}
            />
          ))}

        {tab === "history" &&
          (detailLoading ? (
            <div className="text-muted-foreground flex flex-1 items-center justify-center gap-2 text-sm">
              <SpinnerIcon size={16} /> Loading…
            </div>
          ) : selectedDetail ? (
            <TranscriptDetailView
              detail={selectedDetail}
              onGenerateNotes={onGenerateNotes}
              onSaveTranscript={onUpdateTranscript}
              onBack={() => setSelectedDetail(null)}
              onNotesGenerated={handleNotesGenerated}
              canMutate={canMutate}
              onUpgrade={onUpgrade}
            />
          ) : (
            // Nothing selected in the sidebar yet.
            <div className="text-muted-foreground flex flex-1 items-center justify-center text-sm">
              Pick a transcript from the sidebar to read it.
            </div>
          ))}
      </div>
    </div>
  );
}
