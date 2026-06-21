import { useState, useRef, useEffect } from "react";
import { Mic, Check, X, Loader2, ChevronRight } from "lucide-react";
import { ACCEPTED_AUDIO_EXTENSIONS, ACCEPTED_AUDIO_TYPES, MAX_AUDIO_BYTES, isAudioFile } from "../../lib/constants";
import MathMarkdown from "../common/MathMarkdown";
import { cn } from "../../lib/utils";
import Button from "../ui/Button";

import type { AudioTranscriptSummary, AudioTranscriptDetail } from "@freshr/shared";

type Tab = "new" | "history";
type NewStep = "upload" | "transcribing" | "review" | "generating";
type DetailTab = "transcript" | "notes";

interface AudioColumnProps {
  notebookId: string;
  onTranscribeAudio: (file: File, title: string) => Promise<{ transcript_id: string; transcript: string }>;
  onGenerateNotes: (transcriptId: string) => Promise<string>;
  onUpdateTranscript: (transcriptId: string, fields: { transcript_text?: string; title?: string }) => Promise<void>;
  onListTranscripts: () => Promise<AudioTranscriptSummary[]>;
  onGetTranscript: (transcriptId: string) => Promise<AudioTranscriptDetail>;
  onDeleteTranscript: (transcriptId: string) => Promise<void>;
  onNotesGenerated?: () => void;
  canMutate?: boolean;
  onUpgrade?: () => void;
}

function formatSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

const acceptedExtList = ACCEPTED_AUDIO_EXTENSIONS.join(", ");

const TIPS = [
  "Record in a quiet room — background noise reduces accuracy.",
  "Hold your phone close to the professor.",
  "Avoid covering the mic during recording.",
  "Start recording before the lecture begins.",
];

const UPSELL_FEATURES = [
  "Upload mp3 / m4a / wav / mp4 lecture audio up to 500 MB",
  "Accurate Bangla + English transcription",
  "Edit transcripts before generating notes",
  "Auto-structured study notes saved to your notebook",
];

const NOTES_MARKDOWN_COMPONENTS = {
  p: ({ children }: { children?: React.ReactNode }) => <p className="mb-2.5 leading-relaxed">{children}</p>,
  strong: ({ children }: { children?: React.ReactNode }) => <strong className="font-semibold">{children}</strong>,
  em: ({ children }: { children?: React.ReactNode }) => <em className="italic">{children}</em>,
  ul: ({ children }: { children?: React.ReactNode }) => <ul className="my-2 pl-5 list-disc">{children}</ul>,
  ol: ({ children }: { children?: React.ReactNode }) => <ol className="my-2 pl-5 list-decimal">{children}</ol>,
  li: ({ children }: { children?: React.ReactNode }) => <li className="mb-1 leading-relaxed">{children}</li>,
  h1: ({ children }: { children?: React.ReactNode }) => <h1 className="text-sm font-semibold mt-4 mb-1.5 text-foreground">{children}</h1>,
  h2: ({ children }: { children?: React.ReactNode }) => <h2 className="text-sm font-semibold mt-4 mb-1.5 text-foreground">{children}</h2>,
  h3: ({ children }: { children?: React.ReactNode }) => <h3 className="text-xs font-semibold mt-3 mb-1 text-foreground">{children}</h3>,
  hr: () => <hr className="border-border my-4" />,
  code: ({ children, className }: { children?: React.ReactNode; className?: string }) => {
    const isBlock = className?.startsWith("language-");
    return isBlock ? (
      <pre className="bg-secondary border border-border rounded-md px-3 py-2 overflow-x-auto my-2 text-xs">
        <code>{children}</code>
      </pre>
    ) : (
      <code className="bg-secondary border border-border rounded px-1 py-px text-xs">{children}</code>
    );
  },
};

function NotesView({ notes }: { notes: string }) {
  return (
    <div className="flex-1 overflow-y-auto rounded-md border border-border bg-secondary/20 px-4 py-3 text-xs text-foreground min-h-60">
      <MathMarkdown components={NOTES_MARKDOWN_COMPONENTS}>{notes}</MathMarkdown>
    </div>
  );
}

function InlineUpsell({ onUpgrade }: { onUpgrade?: () => void }) {
  return (
    <div className="flex flex-col gap-4 flex-1">
      <span className="inline-flex self-start rounded-full bg-primary/20 border border-primary/30 px-2.5 py-0.5 text-xs font-medium text-primary">
        PRO FEATURE
      </span>
      <h3 className="text-base font-semibold text-foreground leading-snug">
        Turn your lecture recordings into ready-to-study notes
      </h3>
      <p className="text-xs text-muted-foreground leading-relaxed">
        Record your professor, drop the file here, and Freshr handles the rest — transcription in Bangla and
        English, then structured notes you can study from.
      </p>
      <ul className="flex flex-col gap-2">
        {UPSELL_FEATURES.map((f, i) => (
          <li key={i} className="flex items-start gap-2 text-xs text-foreground leading-relaxed">
            <Check className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
            {f}
          </li>
        ))}
      </ul>
      {onUpgrade && (
        <button
          onClick={onUpgrade}
          className="rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 self-start"
        >
          Upgrade to Pro
        </button>
      )}
    </div>
  );
}

function NewTranscriptionPanel({
  onTranscribed,
  onTranscribeAudio,
  canMutate,
  onUpgrade,
}: {
  onTranscribed: (id: string, transcript: string, title: string) => void;
  onTranscribeAudio: (file: File, title: string) => Promise<{ transcript_id: string; transcript: string }>;
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

  if (!canMutate) return <InlineUpsell onUpgrade={onUpgrade} />;

  const fileTooLarge = file ? file.size > MAX_AUDIO_BYTES : false;
  const canTranscribe = !!file && !fileTooLarge && !!title.trim();

  function pickFile(f: File) {
    setFile(f);
    setTitle(f.name.replace(/\.[^.]+$/, "").replace(/[-_]/g, " "));
    setError(null);
  }

  function rejectNonAudio(files: File[]) {
    const first = files[0];
    const ext = first?.name.includes(".") ? first.name.split(".").pop()!.toLowerCase() : "unknown";
    setError(`.${ext} is not a supported audio format. Use ${acceptedExtList}.`);
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
      const { transcript_id, transcript } = await onTranscribeAudio(file, title || file.name.replace(/\.[^.]+$/, ""));
      onTranscribed(transcript_id, transcript, title);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Transcription failed. Please try again.");
      setStep("upload");
    }
  }

  return (
    <div className="flex flex-col gap-4 flex-1">
      {step === "upload" && (
        <>
          <div
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={cn(
              "rounded-md border-2 border-dashed flex flex-col items-center gap-2 py-6 cursor-pointer transition-all text-center",
              isDragging ? "border-primary bg-primary/5" : "border-border hover:border-primary/40 hover:bg-secondary/20",
            )}
          >
            <Mic className={cn("h-6 w-6", isDragging ? "text-primary" : "text-muted-foreground")} />
            <span className={cn("text-xs leading-relaxed", isDragging ? "text-primary" : "text-muted-foreground")}>
              Drop audio file here<br />or click to upload
            </span>
            <span className="text-xs text-muted-foreground/60">{acceptedExtList}</span>
            <input ref={fileInputRef} type="file" accept={ACCEPTED_AUDIO_TYPES} onChange={(e) => { selectFromList(Array.from(e.target.files ?? [])); e.target.value = ""; }} className="hidden" />
          </div>

          {file && (
            <div className={cn("flex items-center gap-2 rounded-md border px-3 py-2.5", fileTooLarge ? "border-destructive/40 bg-destructive/5" : "border-border bg-secondary/20")}>
              <Mic className="h-4 w-4 text-primary shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-xs font-medium text-foreground truncate">{file.name}</div>
                <div className={cn("text-xs mt-0.5", fileTooLarge ? "text-destructive" : "text-muted-foreground")}>
                  {formatSize(file.size)}{fileTooLarge ? " · exceeds 500 MB" : ""}
                </div>
              </div>
              <button onClick={(e) => { e.stopPropagation(); setFile(null); setTitle(""); }} className="text-muted-foreground hover:text-foreground p-0.5">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

          {file && !fileTooLarge && (
            <div>
              <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5">Lecture title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Data Structures — Lecture 5"
                className="w-full rounded-md border border-border bg-input px-3 py-2 text-sm text-foreground outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
          )}

          {error && (
            <div className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2.5 text-xs text-destructive leading-relaxed">
              {error}
            </div>
          )}

          <div className="rounded-md border border-border bg-secondary/20 px-4 py-3">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Tips for better transcription</p>
            <ul className="flex flex-col gap-1.5 pl-4 list-disc">
              {TIPS.map((tip, i) => <li key={i} className="text-xs text-muted-foreground leading-relaxed">{tip}</li>)}
            </ul>
          </div>

          <div className="border-t border-border pt-4 flex justify-center">
            <button
              onClick={handleTranscribe}
              disabled={!canTranscribe}
              className="rounded-md bg-primary px-8 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Transcribe →
            </button>
          </div>
        </>
      )}

      {step === "transcribing" && (
        <div className="flex flex-col items-center justify-center gap-5 flex-1 min-h-56 text-center">
          <Loader2 className="h-10 w-10 text-muted-foreground animate-spin" />
          <div>
            <p className="text-sm font-semibold text-foreground mb-2">Transcribing your lecture…</p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              This may take a minute for longer recordings.<br />Please keep this window open.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

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
  onSaveTranscript: (transcriptId: string, fields: { transcript_text?: string; title?: string }) => Promise<void>;
  onBack: () => void;
  onNotesGenerated?: () => void;
  canMutate: boolean;
  onUpgrade?: () => void;
}) {
  const [detailTab, setDetailTab] = useState<DetailTab>(detail.has_notes ? "notes" : "transcript");
  const [transcript, setTranscript] = useState(detail.transcript_text);
  const [title, setTitle] = useState(detail.title);
  const [savedTranscript, setSavedTranscript] = useState(detail.transcript_text);
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
      setSaveError(err instanceof Error ? err.message : "Save failed. Please try again.");
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
      setGenerateError(err instanceof Error ? err.message : "Notes generation failed.");
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <div className="flex items-center gap-2 mb-3">
        <button onClick={onBack} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
          <ChevronRight className="h-3 w-3 rotate-180" />
          Back
        </button>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          readOnly={!canMutate}
          className="flex-1 min-w-0 bg-transparent border-none outline-none text-sm font-semibold text-foreground cursor-text"
        />
      </div>

      <div className="flex border-b border-border mb-3">
        {(["transcript", "notes"] as DetailTab[]).map((t) => {
          const isActive = detailTab === t;
          return (
            <button
              key={t}
              onClick={() => setDetailTab(t)}
              className={cn(
                "px-3 py-2 text-xs transition-colors border-b-2 -mb-px",
                isActive ? "font-medium text-foreground border-primary" : "text-muted-foreground border-transparent hover:text-foreground",
              )}
            >
              {t === "transcript" ? "Transcript" : `Notes${!hasNotes ? " (none yet)" : ""}`}
            </button>
          );
        })}
      </div>

      <div className="flex flex-col flex-1 min-h-0">
        {detailTab === "transcript" && (
          <>
            <textarea
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              readOnly={!canMutate}
              className="flex-1 min-h-64 w-full rounded-md border border-border bg-secondary/20 px-3 py-2.5 text-xs text-foreground resize-y outline-none focus:ring-1 focus:ring-ring leading-relaxed"
            />
            <div className="flex items-center justify-between mt-1.5">
              <span className="text-xs text-muted-foreground">
                {transcript.trim().split(/\s+/).filter(Boolean).length.toLocaleString()} words
              </span>
              {canMutate && isDirty && (
                <Button variant="default" onClick={handleSave} disabled={saving}>
                  {saving ? "Saving…" : saveSuccess ? "Saved ✓" : "Save changes"}
                </Button>
              )}
            </div>
          </>
        )}

        {detailTab === "notes" && (
          hasNotes ? (
            <NotesView notes={notes} />
          ) : (
            <div className="flex items-center justify-center flex-1 min-h-44 text-center">
              <p className="text-xs text-muted-foreground leading-relaxed">
                No notes generated yet.{" "}
                {canMutate ? "Generate notes from the transcript." : "Upgrade to Pro to generate notes."}
              </p>
            </div>
          )
        )}
      </div>

      {(generateError || saveError) && (
        <div className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2.5 text-xs text-destructive mt-3">
          {generateError || saveError}
        </div>
      )}

      <div className="pt-3 flex gap-2">
        {canMutate ? (
          <Button variant="green" fullWidth onClick={handleGenerateNotes} disabled={generating}>
            {generating ? "Generating…" : hasNotes ? "Regenerate notes" : "Generate notes"}
          </Button>
        ) : (
          onUpgrade && (
            <Button variant="green" fullWidth onClick={onUpgrade}>
              Upgrade to Pro to {hasNotes ? "regenerate" : "generate"} notes
            </Button>
          )
        )}
      </div>
    </div>
  );
}

function HistoryPanel({
  transcripts, loading, onSelect, onDelete,
}: {
  transcripts: AudioTranscriptSummary[];
  loading: boolean;
  onSelect: (id: string) => void;
  onDelete: (id: string) => Promise<void>;
}) {
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleDelete(e: React.MouseEvent, id: string) {
    e.stopPropagation();
    setDeletingId(id);
    try { await onDelete(id); } finally { setDeletingId(null); }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center flex-1 gap-2 text-muted-foreground text-xs">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading…
      </div>
    );
  }

  if (transcripts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center flex-1 gap-2 text-center py-5">
        <Mic className="h-8 w-8 text-border" />
        <span className="text-xs text-muted-foreground">No transcriptions yet</span>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto flex flex-col">
      {transcripts.map((t) => (
        <div
          key={t.id}
          onClick={() => onSelect(t.id)}
          className="flex items-center gap-3 px-2 py-3 border-b border-border hover:bg-secondary/30 cursor-pointer transition-colors"
        >
          <div className={cn("h-5 w-5 rounded-sm flex items-center justify-center shrink-0 border border-border", t.has_notes ? "bg-primary/20" : "bg-secondary")}>
            <Mic className="h-3 w-3 text-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-medium text-foreground truncate">{t.title}</div>
            <div className="text-xs text-muted-foreground mt-0.5">
              {formatDate(t.created_at)} · {t.has_notes ? "notes generated" : "transcript only"}
            </div>
          </div>
          <button
            onClick={(e) => handleDelete(e, t.id)}
            disabled={deletingId === t.id}
            className="text-muted-foreground hover:text-destructive transition-colors p-1 shrink-0"
            aria-label="Delete"
          >
            {deletingId === t.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <X className="h-3.5 w-3.5" />}
          </button>
          <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
        </div>
      ))}
    </div>
  );
}

function ReviewPanel({
  transcriptId, initialTranscript, initialTitle, onGenerateNotes, onSaveTranscript, onNotesGenerated, onReset,
}: {
  transcriptId: string;
  initialTranscript: string;
  initialTitle: string;
  onGenerateNotes: (transcriptId: string) => Promise<string>;
  onSaveTranscript: (transcriptId: string, fields: { transcript_text?: string; title?: string }) => Promise<void>;
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
      await onSaveTranscript(transcriptId, { transcript_text: transcript, title });
      const notesText = await onGenerateNotes(transcriptId);
      setNotes(notesText);
      setDetailTab("notes");
      onNotesGenerated?.();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Notes generation failed. Please try again.");
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <div className="mb-3">
        <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5">Lecture title</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full rounded-md border border-border bg-input px-3 py-2 text-sm text-foreground outline-none focus:ring-1 focus:ring-ring"
        />
      </div>

      <div className="flex border-b border-border mb-3">
        {(["transcript", "notes"] as DetailTab[]).map((t) => {
          const isActive = detailTab === t;
          return (
            <button
              key={t}
              onClick={() => setDetailTab(t)}
              className={cn(
                "px-3 py-2 text-xs transition-colors border-b-2 -mb-px",
                isActive ? "font-medium text-foreground border-primary" : "text-muted-foreground border-transparent hover:text-foreground",
              )}
            >
              {t === "transcript" ? "Transcript" : `Notes${notes ? "" : " (not yet)"}`}
            </button>
          );
        })}
      </div>

      <div className="flex flex-col flex-1 min-h-0">
        {detailTab === "transcript" && (
          <>
            <textarea
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              className="flex-1 min-h-60 w-full rounded-md border border-border bg-secondary/20 px-3 py-2.5 text-xs text-foreground resize-y outline-none focus:ring-1 focus:ring-ring leading-relaxed"
            />
            <p className="text-xs text-muted-foreground mt-1.5">
              {transcript.trim().split(/\s+/).filter(Boolean).length.toLocaleString()} words · edit any mistakes before generating
            </p>
          </>
        )}
        {detailTab === "notes" && notes && <NotesView notes={notes} />}
        {detailTab === "notes" && !notes && (
          <div className="flex items-center justify-center flex-1 text-xs text-muted-foreground">
            Generate notes to see them here.
          </div>
        )}
      </div>

      {error && (
        <div className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2.5 text-xs text-destructive mt-3">{error}</div>
      )}

      <div className="pt-3 flex gap-2">
        <Button variant="default" onClick={onReset} disabled={generating}>Start over</Button>
        <Button variant="green" fullWidth onClick={handleGenerateNotes} disabled={generating || !transcript.trim()}>
          {generating ? "Generating…" : notes ? "Regenerate notes" : "Generate notes"}
        </Button>
      </div>
    </div>
  );
}

export default function AudioColumn({
  onTranscribeAudio,
  onGenerateNotes,
  onUpdateTranscript,
  onListTranscripts,
  onGetTranscript,
  onDeleteTranscript,
  onNotesGenerated,
  canMutate = true,
  onUpgrade,
}: AudioColumnProps) {
  const [tab, setTab] = useState<Tab>("new");
  const [transcripts, setTranscripts] = useState<AudioTranscriptSummary[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [reviewState, setReviewState] = useState<{ id: string; transcript: string; title: string } | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [selectedDetail, setSelectedDetail] = useState<AudioTranscriptDetail | null>(null);

  async function loadHistory() {
    setHistoryLoading(true);
    try { setTranscripts(await onListTranscripts()); }
    finally { setHistoryLoading(false); }
  }

  useEffect(() => {
    if (tab === "history") loadHistory();
  }, [tab]);

  function handleTranscribed(id: string, transcript: string, title: string) {
    setReviewState({ id, transcript, title });
    setTranscripts((prev) => [{
      id, title, has_notes: false, transcription_status: "pending",
      notes_status: "not_started", created_at: new Date().toISOString(),
    }, ...prev]);
  }

  async function handleSelectTranscript(id: string) {
    setDetailLoading(true);
    setSelectedDetail(null);
    try { setSelectedDetail(await onGetTranscript(id)); }
    finally { setDetailLoading(false); }
  }

  async function handleDeleteTranscript(id: string) {
    await onDeleteTranscript(id);
    setTranscripts((prev) => prev.filter((t) => t.id !== id));
    if (selectedDetail?.id === id) setSelectedDetail(null);
  }

  function handleNotesGenerated() {
    setTranscripts((prev) => prev.map((t) =>
      t.id === (reviewState?.id ?? selectedDetail?.id) ? { ...t, has_notes: true } : t,
    ));
    onNotesGenerated?.();
  }

  return (
    <div className="flex flex-col h-full bg-card border-r border-border overflow-hidden">
      <div className="h-11 flex items-center gap-2 px-4 border-b border-border shrink-0">
        <Mic className="h-4 w-4 text-muted-foreground" />
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Audio Notes</span>
      </div>

      <div className="flex border-b border-border shrink-0">
        {(["new", "history"] as Tab[]).map((t) => {
          const isActive = tab === t;
          return (
            <button
              key={t}
              onClick={() => { setTab(t); if (t === "new") setSelectedDetail(null); }}
              className={cn(
                "px-4 py-2.5 text-xs transition-colors border-b-2 -mb-px",
                isActive ? "font-medium text-foreground border-primary" : "text-muted-foreground border-transparent hover:text-foreground",
              )}
            >
              {t === "new" ? "New" : `History${transcripts.length > 0 ? ` (${transcripts.length})` : ""}`}
            </button>
          );
        })}
      </div>

      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-0 min-h-0">
        {tab === "new" && (
          reviewState ? (
            <ReviewPanel
              transcriptId={reviewState.id}
              initialTranscript={reviewState.transcript}
              initialTitle={reviewState.title}
              onGenerateNotes={onGenerateNotes}
              onSaveTranscript={onUpdateTranscript}
              onNotesGenerated={handleNotesGenerated}
              onReset={() => setReviewState(null)}
            />
          ) : (
            <NewTranscriptionPanel
              onTranscribeAudio={onTranscribeAudio}
              onTranscribed={handleTranscribed}
              canMutate={canMutate}
              onUpgrade={onUpgrade}
            />
          )
        )}

        {tab === "history" && (
          detailLoading ? (
            <div className="flex items-center justify-center flex-1 gap-2 text-muted-foreground text-xs">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading…
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
            <HistoryPanel
              transcripts={transcripts}
              loading={historyLoading}
              onSelect={handleSelectTranscript}
              onDelete={handleDeleteTranscript}
            />
          )
        )}
      </div>
    </div>
  );
}
