import { useState, useRef, useEffect } from "react";
import { ACCEPTED_AUDIO_EXTENSIONS, ACCEPTED_AUDIO_TYPES, MAX_AUDIO_BYTES, isAudioFile } from "../../lib/constants";
import MathMarkdown from "../common/MathMarkdown";

const B = "#000000";
const W = "#FFFFFF";
const G = "#84e487";
const R = "#FF4D4D";

// ─── Types ───────────────────────────────────────────────────────────────────
// Transcription DTOs live in @freshr/shared; imported here for local use.
import type {
  AudioTranscriptSummary,
  AudioTranscriptDetail,
} from "@freshr/shared";

type Tab = "new" | "history";
type NewStep = "upload" | "transcribing" | "review" | "generating";
type DetailTab = "transcript" | "notes";

interface AudioColumnProps {
  notebookId: string;
  // These functions return the final result — the parent hides any task-polling
  // behind the promise resolution. The column doesn't know whether the backend
  // is sync or async.
  onTranscribeAudio: (file: File, title: string) => Promise<{ transcript_id: string; transcript: string }>;
  onGenerateNotes: (transcriptId: string) => Promise<string>;
  onUpdateTranscript: (transcriptId: string, fields: { transcript_text?: string; title?: string }) => Promise<void>;
  onListTranscripts: () => Promise<AudioTranscriptSummary[]>;
  onGetTranscript: (transcriptId: string) => Promise<AudioTranscriptDetail>;
  onDeleteTranscript: (transcriptId: string) => Promise<void>;
  onNotesGenerated?: () => void;
  // When false the user is on a plan that doesn't include audio. They can still
  // view past transcripts + notes (read-only) but can't create or edit any.
  canMutate?: boolean;
  // Triggered when a user on a read-only view clicks any upgrade CTA.
  onUpgrade?: () => void;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

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

const labelStyle: React.CSSProperties = {
  display: "block",
  fontFamily: "'IBM Plex Mono', monospace",
  fontSize: "0.68rem",
  fontWeight: 700,
  letterSpacing: "0.12em",
  color: "#555",
  marginBottom: 6,
};

// ─── Small components ─────────────────────────────────────────────────────────

function SpinnerIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20">
      <circle cx="10" cy="10" r="8" fill="none" stroke="#ddd" strokeWidth="2.5" />
      <path d="M10 2 A8 8 0 0 1 18 10" fill="none" stroke={B} strokeWidth="2.5" strokeLinecap="round">
        <animateTransform attributeName="transform" type="rotate" from="0 10 10" to="360 10 10" dur="0.7s" repeatCount="indefinite" />
      </path>
    </svg>
  );
}

const NOTES_MARKDOWN_COMPONENTS = {
  p: ({ children }: { children?: React.ReactNode }) => (
    <p style={{ margin: "0 0 0.6em", lineHeight: 1.7 }}>{children}</p>
  ),
  strong: ({ children }: { children?: React.ReactNode }) => (
    <strong style={{ fontWeight: 700 }}>{children}</strong>
  ),
  em: ({ children }: { children?: React.ReactNode }) => (
    <em style={{ fontStyle: "italic" }}>{children}</em>
  ),
  ul: ({ children }: { children?: React.ReactNode }) => (
    <ul style={{ margin: "0.4em 0 0.6em", paddingLeft: "1.4em" }}>{children}</ul>
  ),
  ol: ({ children }: { children?: React.ReactNode }) => (
    <ol style={{ margin: "0.4em 0 0.6em", paddingLeft: "1.4em" }}>{children}</ol>
  ),
  li: ({ children }: { children?: React.ReactNode }) => (
    <li style={{ marginBottom: "0.25em", lineHeight: 1.6 }}>{children}</li>
  ),
  h1: ({ children }: { children?: React.ReactNode }) => (
    <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: "1.05rem", fontWeight: 800, margin: "0.8em 0 0.4em", color: B }}>{children}</h1>
  ),
  h2: ({ children }: { children?: React.ReactNode }) => (
    <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: "0.95rem", fontWeight: 800, margin: "0.9em 0 0.4em", color: B }}>{children}</h2>
  ),
  h3: ({ children }: { children?: React.ReactNode }) => (
    <h3 style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "0.78rem", fontWeight: 700, margin: "0.7em 0 0.3em", letterSpacing: "0.04em", color: B }}>{children}</h3>
  ),
  hr: () => <hr style={{ border: "none", borderTop: `1px solid #ddd`, margin: "1em 0" }} />,
  code: ({ children, className }: { children?: React.ReactNode; className?: string }) => {
    const isBlock = className?.startsWith("language-");
    return isBlock ? (
      <pre style={{ background: "#f0f0eb", border: "1px solid #ccc", padding: "8px 10px", overflowX: "auto", margin: "0.5em 0", fontSize: "0.72rem" }}>
        <code>{children}</code>
      </pre>
    ) : (
      <code style={{ background: "#f0f0eb", border: "1px solid #ddd", padding: "1px 4px", fontSize: "0.72rem" }}>{children}</code>
    );
  },
};

function NotesView({ notes }: { notes: string }) {
  return (
    <div
      style={{
        flex: 1,
        overflowY: "auto",
        fontFamily: "'IBM Plex Mono', monospace",
        fontSize: "0.74rem",
        color: B,
        background: "#fafafa",
        border: `2px solid ${B}`,
        padding: "14px 16px",
        minHeight: 240,
      }}
    >
      <MathMarkdown components={NOTES_MARKDOWN_COMPONENTS}>{notes}</MathMarkdown>
    </div>
  );
}

function AudioWaveIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 18 18" fill="none">
      <path d="M3 9h1M5 6v6M7 4v10M9 7v4M11 5v8M13 6v6M15 9h1" stroke={B} strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function ActionButton({
  onClick, disabled, primary, danger, fullWidth, children,
}: {
  onClick: () => void; disabled?: boolean; primary?: boolean; danger?: boolean; fullWidth?: boolean; children: React.ReactNode;
}) {
  const bg = disabled ? "#e0e0e0" : danger ? R : primary ? G : W;
  const border = disabled ? "#ccc" : B;
  const color = disabled ? "#888" : danger ? W : B;
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={(e) => { if (!disabled) { e.currentTarget.style.transform = "translate(-2px,-2px)"; e.currentTarget.style.boxShadow = `4px 4px 0 ${B}`; } }}
      onMouseLeave={(e) => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = primary && !disabled ? `3px 3px 0 ${B}` : "none"; }}
      style={{ flex: fullWidth ? 1 : undefined, background: bg, color, border: `2px solid ${border}`, boxShadow: primary && !disabled ? `3px 3px 0 ${B}` : "none", padding: "9px 14px", fontFamily: "'IBM Plex Mono', monospace", fontWeight: 700, fontSize: "0.72rem", cursor: disabled ? "not-allowed" : "pointer", transition: "transform 0.15s, box-shadow 0.15s", whiteSpace: "nowrap", display: "flex", alignItems: "center", gap: 6 }}
    >
      {children}
    </button>
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
    <div style={{ display: "flex", flexDirection: "column", gap: 14, flex: 1 }}>
      <div
        style={{
          display: "inline-flex",
          alignSelf: "flex-start",
          background: G,
          border: `1.5px solid ${B}`,
          padding: "3px 10px",
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: "0.62rem",
          fontWeight: 700,
          letterSpacing: "0.1em",
          color: B,
        }}
      >
        PRO FEATURE
      </div>
      <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: "1.25rem", lineHeight: 1.25, color: B }}>
        Turn your lecture recordings into ready-to-study notes
      </div>
      <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "0.74rem", color: "#555", lineHeight: 1.65 }}>
        Record your professor, drop the file here, and Freshr handles the rest — transcription in Bangla and
        English, then structured notes you can study from.
      </div>
      <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 8 }}>
        {UPSELL_FEATURES.map((f, i) => (
          <li
            key={i}
            style={{
              display: "flex",
              gap: 10,
              alignItems: "flex-start",
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: "0.72rem",
              color: B,
              lineHeight: 1.5,
            }}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0, marginTop: 2 }}>
              <circle cx="7" cy="7" r="6" fill={G} stroke={B} strokeWidth="1.4" />
              <path d="M4 7l2 2 4-4" stroke={B} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {f}
          </li>
        ))}
      </ul>
      {onUpgrade && (
        <button
          onClick={onUpgrade}
          onMouseEnter={(e) => { e.currentTarget.style.transform = "translate(-3px,-3px)"; e.currentTarget.style.boxShadow = `6px 6px 0 ${B}`; }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = `3px 3px 0 ${B}`; }}
          style={{
            background: G,
            color: B,
            border: `2px solid ${B}`,
            boxShadow: `3px 3px 0 ${B}`,
            padding: "11px 16px",
            fontFamily: "'IBM Plex Mono', monospace",
            fontWeight: 700,
            fontSize: "0.78rem",
            cursor: "pointer",
            transition: "transform 0.15s, box-shadow 0.15s",
            letterSpacing: "0.04em",
          }}
        >
          Upgrade to Pro
        </button>
      )}
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
    <div style={{ display: "flex", flexDirection: "column", gap: 14, flex: 1 }}>
      {step === "upload" && (
        <>
          {/* Drop zone */}
          <div
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            onMouseEnter={(e) => { if (!isDragging) (e.currentTarget as HTMLElement).style.background = "#f0f0eb"; }}
            onMouseLeave={(e) => { if (!isDragging) (e.currentTarget as HTMLElement).style.background = "#fafafa"; }}
            style={{ border: `2px dashed ${isDragging ? G : "#ccc"}`, background: isDragging ? "#f0fff0" : "#fafafa", padding: "20px 12px", display: "flex", flexDirection: "column", alignItems: "center", gap: 8, cursor: "pointer", transition: "border-color 0.15s, background 0.15s", textAlign: "center" }}
          >
            <svg width="26" height="26" viewBox="0 0 28 28" fill="none">
              <path d="M4 20v3a1 1 0 0 0 1 1h18a1 1 0 0 0 1-1v-3" stroke={isDragging ? G : "#aaa"} strokeWidth="1.8" strokeLinecap="round" />
              <path d="M14 18V8M14 8l-4 4M14 8l4 4" stroke={isDragging ? G : "#aaa"} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "0.75rem", color: isDragging ? G : B, lineHeight: 1.5 }}>
              Drop audio file here<br />or click to upload
            </span>
            <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "0.62rem", color: "#888" }}>{acceptedExtList}</span>
            <input ref={fileInputRef} type="file" accept={ACCEPTED_AUDIO_TYPES} onChange={(e) => { selectFromList(Array.from(e.target.files ?? [])); e.target.value = ""; }} style={{ display: "none" }} />
          </div>

          {/* Selected file */}
          {file && (
            <div style={{ border: `1.5px solid ${fileTooLarge ? R : B}`, padding: "10px 12px", background: fileTooLarge ? "#fff5f5" : "#fafafa", display: "flex", gap: 10, alignItems: "center" }}>
              <svg width="20" height="20" viewBox="0 0 22 22" fill="none"><rect x="1" y="1" width="20" height="20" rx="1" fill={G} stroke={B} strokeWidth="1.5" /><path d="M7 15V7M11 15V5M15 15V10" stroke={B} strokeWidth="1.8" strokeLinecap="round" /></svg>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "0.72rem", fontWeight: 700, color: B, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{file.name}</div>
                <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "0.65rem", color: fileTooLarge ? R : "#555", marginTop: 2 }}>{formatSize(file.size)}{fileTooLarge ? " · exceeds 500 MB" : ""}</div>
              </div>
              <button onClick={(e) => { e.stopPropagation(); setFile(null); setTitle(""); }} style={{ background: "none", border: "none", cursor: "pointer", padding: 2 }}>
                <svg width="13" height="13" viewBox="0 0 14 14" fill="none"><path d="M3 3l8 8M11 3L3 11" stroke={B} strokeWidth="1.8" strokeLinecap="round" /></svg>
              </button>
            </div>
          )}

          {file && !fileTooLarge && (
            <div>
              <label style={labelStyle}>LECTURE TITLE</label>
              <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Data Structures — Lecture 5" style={{ width: "100%", fontFamily: "'IBM Plex Mono', monospace", fontSize: "0.75rem", color: B, background: W, border: `2px solid ${B}`, padding: "8px 10px", outline: "none", boxSizing: "border-box" }} />
            </div>
          )}

          {error && <div style={{ border: `1.5px solid ${R}`, background: "#fff5f5", padding: "10px 12px", fontFamily: "'IBM Plex Mono', monospace", fontSize: "0.72rem", color: R, lineHeight: 1.5 }}>{error}</div>}

          {/* Tips */}
          <div style={{ border: `1.5px solid ${B}`, padding: "12px 14px", background: "#fffef0" }}>
            <div style={{ ...labelStyle, marginBottom: 8 }}>TIPS FOR BETTER TRANSCRIPTION</div>
            <ul style={{ margin: 0, paddingLeft: 16, display: "flex", flexDirection: "column", gap: 4 }}>
              {TIPS.map((tip, i) => <li key={i} style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "0.7rem", color: B, lineHeight: 1.5 }}>{tip}</li>)}
            </ul>
          </div>

          <div style={{ borderTop: `2px solid ${B}`, marginTop: 6, paddingTop: 16, paddingBottom: 4, display: "flex", justifyContent: "center" }}>
            <button
              onClick={handleTranscribe}
              disabled={!canTranscribe}
              onMouseEnter={(e) => { if (canTranscribe) { e.currentTarget.style.transform = "translate(-3px,-3px)"; e.currentTarget.style.boxShadow = `7px 7px 0 ${B}`; } }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = canTranscribe ? `4px 4px 0 ${B}` : "none"; }}
              onMouseDown={(e) => { if (canTranscribe) { e.currentTarget.style.transform = "translate(2px,2px)"; e.currentTarget.style.boxShadow = `2px 2px 0 ${B}`; } }}
              onMouseUp={(e) => { if (canTranscribe) { e.currentTarget.style.transform = "translate(-3px,-3px)"; e.currentTarget.style.boxShadow = `7px 7px 0 ${B}`; } }}
              style={{
                background: canTranscribe ? G : "#eee",
                color: B,
                border: `2px solid ${canTranscribe ? B : "#ccc"}`,
                boxShadow: canTranscribe ? `4px 4px 0 ${B}` : "none",
                padding: "14px 40px",
                fontFamily: "'IBM Plex Mono', monospace",
                fontWeight: 700,
                fontSize: "0.82rem",
                letterSpacing: "0.06em",
                cursor: canTranscribe ? "pointer" : "not-allowed",
                transition: "transform 0.15s, box-shadow 0.15s",
              }}
            >
              Transcribe →
            </button>
          </div>
        </>
      )}

      {step === "transcribing" && (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 18, flex: 1, minHeight: 220, textAlign: "center" }}>
          <SpinnerIcon size={40} />
          <div>
            <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: "1rem", color: B, marginBottom: 8 }}>Transcribing your lecture…</div>
            <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "0.72rem", color: "#555", lineHeight: 1.6 }}>This may take a minute for longer recordings.<br />Please keep this window open.</div>
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
    <div style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}>
      {/* Back + title row */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
        <button onClick={onBack} style={{ background: "none", border: "none", cursor: "pointer", padding: "2px 4px", fontFamily: "'IBM Plex Mono', monospace", fontSize: "0.72rem", color: "#555", display: "flex", alignItems: "center", gap: 4 }}>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M8 2L4 6l4 4" stroke={B} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
          Back
        </button>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          readOnly={!canMutate}
          style={{ flex: 1, fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: "0.88rem", color: B, background: "transparent", border: "none", outline: "none", minWidth: 0, cursor: canMutate ? "text" : "default" }}
        />
      </div>

      {/* Tab bar */}
      <div style={{ display: "flex", borderBottom: `2px solid ${B}`, marginBottom: 12, gap: 0 }}>
        {(["transcript", "notes"] as DetailTab[]).map((t) => {
          const isActive = detailTab === t;
          return (
            <button
              key={t}
              onClick={() => setDetailTab(t)}
              style={{ padding: "7px 14px", fontFamily: "'IBM Plex Mono', monospace", fontSize: "0.72rem", fontWeight: isActive ? 700 : 400, color: isActive ? W : B, background: isActive ? B : "transparent", border: "none", cursor: "pointer", borderBottom: "none" }}
            >
              {t === "transcript" ? "Transcript" : `Notes${!hasNotes ? " (none yet)" : ""}`}
            </button>
          );
        })}
      </div>

      {/* Content area */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
        {detailTab === "transcript" && (
          <>
            <textarea
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              readOnly={!canMutate}
              style={{ flex: 1, minHeight: 260, width: "100%", fontFamily: "'IBM Plex Mono', monospace", fontSize: "0.72rem", color: B, background: "#fafafa", border: `2px solid ${B}`, padding: "10px 12px", resize: "vertical", outline: "none", boxSizing: "border-box", lineHeight: 1.6, cursor: canMutate ? "text" : "default" }}
            />
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 6 }}>
              <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "0.62rem", color: "#888" }}>
                {transcript.trim().split(/\s+/).filter(Boolean).length.toLocaleString()} words
              </span>
              {canMutate && isDirty && (
                <ActionButton onClick={handleSave} disabled={saving}>
                  {saving ? <><SpinnerIcon size={13} /> Saving…</> : saveSuccess ? "Saved ✓" : "Save changes"}
                </ActionButton>
              )}
            </div>
          </>
        )}

        {detailTab === "notes" && (
          <>
            {hasNotes ? (
              <NotesView notes={notes} />
            ) : (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 14, flex: 1, minHeight: 180, textAlign: "center" }}>
                <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "0.75rem", color: "#555", lineHeight: 1.6 }}>
                  No notes generated yet.
                  {canMutate ? <><br />Generate notes from the transcript below.</> : <><br />Upgrade to Pro to generate notes from this transcript.</>}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {(generateError || saveError) && (
        <div style={{ border: `1.5px solid ${R}`, background: "#fff5f5", padding: "9px 12px", fontFamily: "'IBM Plex Mono', monospace", fontSize: "0.7rem", color: R, marginTop: 8 }}>
          {generateError || saveError}
        </div>
      )}

      {/* Footer */}
      <div style={{ paddingTop: 12, display: "flex", gap: 8 }}>
        {canMutate ? (
          <ActionButton onClick={handleGenerateNotes} disabled={generating} primary fullWidth>
            {generating ? <><SpinnerIcon size={13} />Generating…</> : hasNotes ? "Regenerate notes" : "Generate notes"}
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

// ─── History list ─────────────────────────────────────────────────────────────

function HistoryPanel({
  transcripts,
  loading,
  onSelect,
  onDelete,
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
    try {
      await onDelete(id);
    } finally {
      setDeletingId(null);
    }
  }

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", flex: 1, gap: 10, color: "#888", fontFamily: "'IBM Plex Mono', monospace", fontSize: "0.72rem" }}>
        <SpinnerIcon size={16} /> Loading…
      </div>
    );
  }

  if (transcripts.length === 0) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flex: 1, gap: 8, textAlign: "center", padding: "20px 0" }}>
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none"><rect x="2" y="2" width="28" height="28" rx="2" stroke="#ccc" strokeWidth="1.5" /><path d="M8 16h5M12 11v10M17 13v6M22 11v10" stroke="#ccc" strokeWidth="1.5" strokeLinecap="round" /></svg>
        <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "0.72rem", color: "#aaa" }}>No transcriptions yet</span>
      </div>
    );
  }

  return (
    <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 0 }}>
      {transcripts.map((t) => (
        <div
          key={t.id}
          onClick={() => onSelect(t.id)}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "#f0f0eb"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = W; }}
          style={{ padding: "11px 14px", borderBottom: "1px solid #e0e0e0", background: W, cursor: "pointer", display: "flex", alignItems: "center", gap: 10, transition: "background 0.1s" }}
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" style={{ flexShrink: 0 }}>
            <rect x="1" y="1" width="16" height="16" rx="1" fill={t.has_notes ? G : "#f0f0f0"} stroke={B} strokeWidth="1.3" />
            <path d="M4 9h2M7 6v6M9.5 7.5v3M12 6v6M14 9h1" stroke={B} strokeWidth="1.3" strokeLinecap="round" />
          </svg>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "0.75rem", fontWeight: 700, color: B, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.title}</div>
            <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "0.65rem", color: "#777", marginTop: 2 }}>
              {formatDate(t.created_at)} · {t.has_notes ? "notes generated" : "transcript only"}
            </div>
          </div>
          <button
            onClick={(e) => handleDelete(e, t.id)}
            disabled={deletingId === t.id}
            style={{ background: "none", border: "none", cursor: "pointer", padding: 4, flexShrink: 0, opacity: 0.5 }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.opacity = "1"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.opacity = "0.5"; }}
            aria-label="Delete"
          >
            {deletingId === t.id ? <SpinnerIcon size={13} /> : (
              <svg width="13" height="13" viewBox="0 0 14 14" fill="none"><path d="M3 3l8 8M11 3L3 11" stroke={R} strokeWidth="1.8" strokeLinecap="round" /></svg>
            )}
          </button>
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none" style={{ flexShrink: 0 }}><path d="M3 2l4 3-4 3" stroke="#aaa" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </div>
      ))}
    </div>
  );
}

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
    <div style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}>
      <div style={{ marginBottom: 10 }}>
        <label style={labelStyle}>LECTURE TITLE</label>
        <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} style={{ width: "100%", fontFamily: "'IBM Plex Mono', monospace", fontSize: "0.75rem", color: B, background: W, border: `2px solid ${B}`, padding: "7px 10px", outline: "none", boxSizing: "border-box" }} />
      </div>

      {/* Tab bar */}
      <div style={{ display: "flex", borderBottom: `2px solid ${B}`, marginBottom: 10 }}>
        {(["transcript", "notes"] as DetailTab[]).map((t) => {
          const isActive = detailTab === t;
          return (
            <button key={t} onClick={() => setDetailTab(t)} style={{ padding: "7px 14px", fontFamily: "'IBM Plex Mono', monospace", fontSize: "0.72rem", fontWeight: isActive ? 700 : 400, color: isActive ? W : B, background: isActive ? B : "transparent", border: "none", cursor: "pointer" }}>
              {t === "transcript" ? "Transcript" : `Notes${notes ? "" : " (not yet)"}`}
            </button>
          );
        })}
      </div>

      <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
        {detailTab === "transcript" && (
          <>
            <textarea
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              style={{ flex: 1, minHeight: 240, width: "100%", fontFamily: "'IBM Plex Mono', monospace", fontSize: "0.72rem", color: B, background: "#fafafa", border: `2px solid ${B}`, padding: "10px 12px", resize: "vertical", outline: "none", boxSizing: "border-box", lineHeight: 1.6 }}
            />
            <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "0.62rem", color: "#888", marginTop: 4 }}>
              {transcript.trim().split(/\s+/).filter(Boolean).length.toLocaleString()} words · edit any mistakes before generating
            </div>
          </>
        )}

        {detailTab === "notes" && notes && <NotesView notes={notes} />}

        {detailTab === "notes" && !notes && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", flex: 1, fontFamily: "'IBM Plex Mono', monospace", fontSize: "0.72rem", color: "#aaa" }}>
            Generate notes to see them here.
          </div>
        )}
      </div>

      {error && <div style={{ border: `1.5px solid ${R}`, background: "#fff5f5", padding: "9px 12px", fontFamily: "'IBM Plex Mono', monospace", fontSize: "0.7rem", color: R, marginTop: 8 }}>{error}</div>}

      <div style={{ paddingTop: 12, display: "flex", gap: 8 }}>
        <ActionButton onClick={onReset} disabled={generating}>Start over</ActionButton>
        <ActionButton onClick={handleGenerateNotes} disabled={generating || !transcript.trim()} primary fullWidth>
          {generating ? <><SpinnerIcon size={13} />Generating…</> : notes ? "Regenerate notes" : "Generate notes"}
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

  // After a successful transcription, we hold the ID + text to show the review panel
  const [reviewState, setReviewState] = useState<{ id: string; transcript: string; title: string } | null>(null);

  // History detail
  const [detailLoading, setDetailLoading] = useState(false);
  const [selectedDetail, setSelectedDetail] = useState<AudioTranscriptDetail | null>(null);

  async function loadHistory() {
    setHistoryLoading(true);
    try {
      const list = await onListTranscripts();
      setTranscripts(list);
    } finally {
      setHistoryLoading(false);
    }
  }

  useEffect(() => {
    if (tab === "history") loadHistory();
  }, [tab]);

  function handleTranscribed(id: string, transcript: string, title: string) {
    setReviewState({ id, transcript, title });
    // Optimistically add to history list
    setTranscripts((prev) => [{
      id,
      title,
      has_notes: false,
      transcription_status: "pending",
      notes_status: "not_started",
      created_at: new Date().toISOString(),
    }, ...prev]);
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

  async function handleDeleteTranscript(id: string) {
    await onDeleteTranscript(id);
    setTranscripts((prev) => prev.filter((t) => t.id !== id));
    if (selectedDetail?.id === id) setSelectedDetail(null);
  }

  function handleNotesGenerated() {
    // Refresh history list so the "notes generated" badge updates
    setTranscripts((prev) => prev.map((t) => t.id === (reviewState?.id ?? selectedDetail?.id) ? { ...t, has_notes: true } : t));
    onNotesGenerated?.();
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", background: W, overflow: "hidden", borderRight: `2px solid ${B}` }}>
      {/* Header */}
      <div style={{ height: 44, padding: "0 14px", borderBottom: `2px solid ${B}`, display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
        <AudioWaveIcon />
        <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.14em", color: B }}>AUDIO NOTES</span>
      </div>

      {/* Tab bar */}
      <div style={{ display: "flex", borderBottom: `2px solid ${B}`, flexShrink: 0 }}>
        {(["new", "history"] as Tab[]).map((t) => {
          const isActive = tab === t;
          return (
            <button
              key={t}
              onClick={() => { setTab(t); if (t === "new") setSelectedDetail(null); }}
              style={{ padding: "9px 18px", fontFamily: "'IBM Plex Mono', monospace", fontSize: "0.72rem", fontWeight: isActive ? 700 : 400, color: isActive ? B : "#777", background: isActive ? G : "transparent", border: "none", borderBottom: isActive ? `2px solid ${B}` : "none", marginBottom: isActive ? -2 : 0, cursor: "pointer", letterSpacing: "0.04em" }}
            >
              {t === "new" ? "New" : `History${transcripts.length > 0 ? ` (${transcripts.length})` : ""}`}
            </button>
          );
        })}
      </div>

      {/* Body */}
      <div style={{ flex: 1, overflowY: "auto", padding: 16, display: "flex", flexDirection: "column", gap: 0, minHeight: 0 }}>
        {tab === "new" && (
          reviewState ? (
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
          )
        )}

        {tab === "history" && (
          detailLoading ? (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", flex: 1, gap: 10, fontFamily: "'IBM Plex Mono', monospace", fontSize: "0.72rem", color: "#888" }}>
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
