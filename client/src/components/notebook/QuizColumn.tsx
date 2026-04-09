import { useState } from "react";
import type { QuizDifficulty } from "../../storage";
import type { QuizGenerateOptions } from "../../services/quiz/quiz.types";

const G = "#84e487";
const B = "#000000";
const W = "#FFFFFF";

const labelStyle: React.CSSProperties = {
  display: "block",
  fontFamily: "'IBM Plex Mono', monospace",
  fontSize: "0.62rem",
  fontWeight: 700,
  letterSpacing: "0.12em",
  color: "#555",
  marginBottom: 6,
};

// ── Topic chip ────────────────────────────────────────────────────────

function TopicChip({
  label,
  selected,
  onToggle,
  compact = false,
}: {
  label: string;
  selected: boolean;
  onToggle: () => void;
  compact?: boolean;
}) {
  const [hovered, setHovered] = useState(false);
  const bg = selected ? (hovered ? "#6dce71" : G) : hovered ? "#f0fdf0" : W;

  return (
    <span
      onClick={onToggle}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "inline-block",
        padding: "4px 10px",
        border: `2px solid ${B}`,
        background: bg,
        fontFamily: "'IBM Plex Mono', monospace",
        fontSize: "0.68rem",
        fontWeight: selected ? 700 : 500,
        letterSpacing: "0.04em",
        cursor: "pointer",
        userSelect: "none",
        transition: "background 0.1s",
        // Compact (collapsed) mode: fixed max-width with truncation
        // Expanded mode: wrap naturally, no max-width
        ...(compact
          ? { maxWidth: 120, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }
          : { whiteSpace: "normal", wordBreak: "break-word" }),
      }}
    >
      {label}
    </span>
  );
}

// ── Styled select dropdown ────────────────────────────────────────────

interface SelectOption {
  value: string;
  label: string;
}

function SelectDropdown({
  value,
  onChange,
  placeholder,
  options,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  options: SelectOption[];
}) {
  return (
    <div style={{ position: "relative" }}>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          width: "100%",
          appearance: "none",
          border: `2px solid ${B}`,
          borderRadius: 0,
          background: W,
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: "0.72rem",
          fontWeight: 600,
          color: value ? B : "#999",
          padding: "9px 32px 9px 12px",
          cursor: "pointer",
          outline: "none",
          boxShadow: `3px 3px 0 ${B}`,
          boxSizing: "border-box",
        }}
      >
        <option value="" disabled hidden>
          {placeholder}
        </option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value} style={{ color: B }}>
            {opt.label}
          </option>
        ))}
      </select>
      <span
        style={{
          position: "absolute",
          right: 10,
          top: "50%",
          transform: "translateY(-50%)",
          pointerEvents: "none",
          fontSize: "0.6rem",
          color: B,
        }}
      >
        ▾
      </span>
    </div>
  );
}

// ── Divider ───────────────────────────────────────────────────────────

function Divider() {
  return <div style={{ borderBottom: "1px solid #ddd", margin: "24px 0" }} />;
}

// ── QuizColumn ────────────────────────────────────────────────────────

interface QuizColumnProps {
  topics: string[];
  isLoadingTopics: boolean;
  onGenerate: (options: QuizGenerateOptions) => Promise<void>;
  isGenerating: boolean;
}

export default function QuizColumn({
  topics,
  isLoadingTopics,
  onGenerate,
  isGenerating,
}: QuizColumnProps) {
  const [topicsExpanded, setTopicsExpanded] = useState(false);
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [prompt, setPrompt] = useState("");
  const [questionCount, setQuestionCount] = useState<number | null>(null);
  const [difficulty, setDifficulty] = useState<QuizDifficulty | null>(null);
  const [timed, setTimed] = useState<boolean | null>(null);
  const [timeLimit, setTimeLimit] = useState<number | null>(null);

  const canGenerate =
    (selectedTopics.length > 0 || prompt.trim().length > 0) &&
    questionCount !== null &&
    difficulty !== null &&
    timed !== null &&
    (timed === false || timeLimit !== null) &&
    !isGenerating;

  function toggleTopic(topic: string) {
    setSelectedTopics((prev) =>
      prev.includes(topic) ? prev.filter((t) => t !== topic) : [...prev, topic],
    );
  }

  async function handleGenerate() {
    if (!canGenerate || difficulty === null || questionCount === null || timed === null) return;
    await onGenerate({
      topics: selectedTopics,
      prompt: prompt.trim() || undefined,
      questionCount,
      difficulty,
      timed,
      timeLimit: timeLimit ?? undefined,
    });
  }

  const COLLAPSED_MAX = 8;

  // Collapsed preview: selected topics first, then unselected, up to 8
  const previewTopics = [
    ...selectedTopics.filter((t) => topics.includes(t)),
    ...topics.filter((t) => !selectedTopics.includes(t)),
  ].slice(0, COLLAPSED_MAX);

  const hiddenCount = topics.length - COLLAPSED_MAX;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        background: "#f5f5f0",
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <div
        style={{
          height: 44,
          padding: "0 16px",
          borderBottom: `2px solid ${B}`,
          background: W,
          display: "flex",
          alignItems: "center",
          flexShrink: 0,
        }}
      >
        <span
          style={{
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: "0.62rem",
            fontWeight: 700,
            letterSpacing: "0.14em",
            color: "#555",
          }}
        >
          QUIZ GENERATOR
        </span>
      </div>

      {/* Scrollable content */}
      <div style={{ flex: 1, overflowY: "auto", padding: "36px 32px 24px" }}>
        <div style={{ maxWidth: 580, margin: "0 auto" }}>

          {/* Title */}
          <h2
            style={{
              fontFamily: "'Syne', sans-serif",
              fontWeight: 800,
              fontSize: "1.4rem",
              color: B,
              margin: "0 0 28px",
              letterSpacing: "-0.02em",
            }}
          >
            Generate a Quiz
          </h2>

          {/* Topics section */}
          <div style={{ marginBottom: 4 }}>
            {/* Label row — shows × Collapse only when expanded */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 10,
              }}
            >
              <span style={labelStyle}>TOPICS</span>
              {topicsExpanded && (
                <span
                  onClick={() => setTopicsExpanded(false)}
                  onMouseEnter={(e) => (e.currentTarget.style.color = B)}
                  onMouseLeave={(e) => (e.currentTarget.style.color = "#888")}
                  style={{
                    fontFamily: "'IBM Plex Mono', monospace",
                    fontSize: "0.68rem",
                    color: "#888",
                    cursor: "pointer",
                    userSelect: "none",
                  }}
                >
                  × Collapse
                </span>
              )}
            </div>

            {isLoadingTopics ? (
              <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "0.7rem", color: "#aaa", margin: 0 }}>
                Loading topics...
              </p>
            ) : topics.length === 0 ? (
              <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "0.7rem", color: "#aaa", margin: 0, lineHeight: 1.6 }}>
                No topics found. Upload files to your notebook first.
              </p>
            ) : topicsExpanded ? (
              // Expanded: scrollable box, full chip labels, no max-width
              <div
                style={{
                  border: `2px solid ${B}`,
                  background: W,
                  maxHeight: 130,
                  overflowY: "auto",
                  padding: "10px 12px",
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 6,
                }}
              >
                {topics.map((topic) => (
                  <TopicChip
                    key={topic}
                    label={topic}
                    selected={selectedTopics.includes(topic)}
                    onToggle={() => toggleTopic(topic)}
                    compact={false}
                  />
                ))}
              </div>
            ) : (
              // Collapsed: up to 8 compact chips, then +x more button
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center" }}>
                {previewTopics.map((topic) => (
                  <TopicChip
                    key={topic}
                    label={topic}
                    selected={selectedTopics.includes(topic)}
                    onToggle={() => toggleTopic(topic)}
                    compact={true}
                  />
                ))}
                {hiddenCount > 0 && (
                  <span
                    onClick={() => setTopicsExpanded(true)}
                    onMouseEnter={(e) => (e.currentTarget.style.color = "#444")}
                    onMouseLeave={(e) => (e.currentTarget.style.color = "#666")}
                    style={{
                      fontFamily: "'IBM Plex Mono', monospace",
                      fontSize: "0.65rem",
                      color: "#666",
                      textDecoration: "underline",
                      textUnderlineOffset: "3px",
                      cursor: "pointer",
                      userSelect: "none",
                    }}
                  >
                    +{hiddenCount} more
                  </span>
                )}
              </div>
            )}

            {selectedTopics.length > 0 && (
              <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "0.62rem", color: "#888", margin: "8px 0 0" }}>
                {selectedTopics.length} topic{selectedTopics.length > 1 ? "s" : ""} selected
              </p>
            )}
          </div>

          <Divider />

          {/* Prompt section */}
          <div>
            <label style={labelStyle}>OR DESCRIBE WHAT YOU WANT TO BE QUIZZED ON</label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g. Focus on the differences between mitosis and meiosis..."
              rows={3}
              onMouseEnter={(e) => {
                if (document.activeElement !== e.currentTarget)
                  e.currentTarget.style.borderColor = G;
              }}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = B)}
              onFocus={(e) => (e.currentTarget.style.borderColor = B)}
              style={{
                width: "100%",
                border: `2px solid ${B}`,
                borderRadius: 0,
                padding: "10px 12px",
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: "0.78rem",
                background: W,
                outline: "none",
                resize: "vertical",
                boxSizing: "border-box",
                transition: "border-color 0.15s",
                lineHeight: 1.6,
                color: B,
              }}
            />
          </div>

          <Divider />

          {/* Settings */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr 1fr",
              gap: 16,
            }}
          >
            {/* Questions */}
            <div>
              <label style={labelStyle}>QUESTIONS</label>
              <SelectDropdown
                value={questionCount !== null ? String(questionCount) : ""}
                onChange={(v) => setQuestionCount(v === "" ? null : Number(v))}
                placeholder="Select..."
                options={[
                  { value: "5", label: "5" },
                  { value: "10", label: "10" },
                  { value: "15", label: "15" },
                  { value: "20", label: "20" },
                ]}
              />
            </div>

            {/* Difficulty */}
            <div>
              <label style={labelStyle}>DIFFICULTY</label>
              <SelectDropdown
                value={difficulty ?? ""}
                onChange={(v) =>
                  setDifficulty(v === "" ? null : (v as QuizDifficulty))
                }
                placeholder="Select..."
                options={[
                  { value: "easy", label: "Easy" },
                  { value: "medium", label: "Medium" },
                  { value: "hard", label: "Hard" },
                ]}
              />
            </div>

            {/* Timer */}
            <div>
              <label style={labelStyle}>TIMER</label>
              <SelectDropdown
                value={timed !== null ? (timed ? "yes" : "no") : ""}
                onChange={(v) => {
                  if (v === "yes") setTimed(true);
                  else if (v === "no") {
                    setTimed(false);
                    setTimeLimit(null);
                  } else setTimed(null);
                }}
                placeholder="Select..."
                options={[
                  { value: "yes", label: "Yes" },
                  { value: "no", label: "No" },
                ]}
              />
              {timed === true && (
                <div style={{ marginTop: 12 }}>
                  <label style={labelStyle}>TIME LIMIT</label>
                  <SelectDropdown
                    value={timeLimit !== null ? String(timeLimit) : ""}
                    onChange={(v) => setTimeLimit(v === "" ? null : Number(v))}
                    placeholder="Select..."
                    options={[
                      { value: "5", label: "5 min" },
                      { value: "10", label: "10 min" },
                      { value: "15", label: "15 min" },
                      { value: "20", label: "20 min" },
                    ]}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom bar — pinned Generate button */}
      <div
        style={{
          borderTop: `2px solid ${B}`,
          padding: "16px 32px",
          background: W,
          display: "flex",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <button
          onClick={handleGenerate}
          disabled={!canGenerate}
          onMouseEnter={(e) => {
            if (canGenerate) {
              e.currentTarget.style.transform = "translate(-3px, -3px)";
              e.currentTarget.style.boxShadow = `7px 7px 0 ${B}`;
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "none";
            e.currentTarget.style.boxShadow = canGenerate ? `4px 4px 0 ${B}` : "none";
          }}
          onMouseDown={(e) => {
            if (canGenerate) {
              e.currentTarget.style.transform = "translate(2px, 2px)";
              e.currentTarget.style.boxShadow = `2px 2px 0 ${B}`;
            }
          }}
          onMouseUp={(e) => {
            if (canGenerate) {
              e.currentTarget.style.transform = "translate(-3px, -3px)";
              e.currentTarget.style.boxShadow = `7px 7px 0 ${B}`;
            }
          }}
          style={{
            background: canGenerate ? G : "#eee",
            color: canGenerate ? B : "#aaa",
            border: `2px solid ${canGenerate ? B : "#ccc"}`,
            boxShadow: canGenerate ? `4px 4px 0 ${B}` : "none",
            padding: "14px 40px",
            fontFamily: "'IBM Plex Mono', monospace",
            fontWeight: 700,
            fontSize: "0.82rem",
            letterSpacing: "0.06em",
            cursor: canGenerate ? "pointer" : "not-allowed",
            transition: "transform 0.15s, box-shadow 0.15s",
          }}
        >
          {isGenerating ? "Generating..." : "Generate Quiz →"}
        </button>
      </div>
    </div>
  );
}
