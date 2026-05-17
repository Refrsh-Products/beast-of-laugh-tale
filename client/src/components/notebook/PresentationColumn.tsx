import { useState } from "react";
import type { NotebookTopic } from "../../services/quiz/Quiz.types";
import QuizTopicChip from "../quiz/QuizTopicChip";
import Dropdown from "../ui/Dropdown";

const G = "#84e487";
const B = "#000000";
const W = "#FFFFFF";
const COLLAPSED_MAX = 4;

type PresentationTheme = "freshr" | "minimal" | "dark" | "academic" | "serif";

const THEMES: Record<PresentationTheme, { label: string; bg: string; text: string; accent: string }> = {
  freshr:   { label: "Freshr",   bg: "#ffffff", text: "#000000", accent: "#84e487" },
  minimal:  { label: "Minimal",  bg: "#ffffff", text: "#333333", accent: "#cccccc" },
  dark:     { label: "Dark",     bg: "#1a1a1a", text: "#ffffff", accent: "#84e487" },
  academic: { label: "Academic", bg: "#eef3f8", text: "#1e3a5f", accent: "#2a72b5" },
  serif:    { label: "Serif",    bg: "#faf7f2", text: "#3b2f1e", accent: "#8b6a1f" },
};

const labelStyle: React.CSSProperties = {
  display: "block",
  fontFamily: "'IBM Plex Mono', monospace",
  fontSize: "0.75rem",
  fontWeight: 700,
  letterSpacing: "0.12em",
  color: "#000000",
  marginBottom: 6,
};

function ThemeCard({
  themeKey,
  selected,
  onClick,
}: {
  themeKey: PresentationTheme;
  selected: boolean;
  onClick: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  const t = THEMES[themeKey];
  const isFreshr = themeKey === "freshr";
  const isDark = themeKey === "dark";

  const shadow = selected
    ? hovered ? `6px 6px 0 ${B}` : `4px 4px 0 ${B}`
    : hovered ? `4px 4px 0 ${B}` : "none";

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ cursor: "pointer", userSelect: "none" }}
    >
      <div
        style={{
          width: "100%",
          aspectRatio: "16 / 9",
          border: `2px solid ${selected || hovered ? B : "#d0d0d0"}`,
          background: t.bg,
          boxSizing: "border-box",
          display: "flex",
          overflow: "hidden",
          boxShadow: shadow,
          transform: hovered ? "translate(-2px, -2px)" : "none",
          transition: "transform 0.1s, box-shadow 0.1s, border-color 0.1s",
        }}
      >
        {isFreshr && (
          <div style={{ width: 7, background: t.accent, flexShrink: 0 }} />
        )}
        <div style={{ flex: 1, padding: "8px 10px", display: "flex", flexDirection: "column", gap: 4 }}>
          <div
            style={{
              height: 4,
              width: "55%",
              background: isDark ? t.accent : isFreshr ? B : t.accent,
              borderRadius: 1,
            }}
          />
          {[78, 62, 70].map((w, i) => (
            <div
              key={i}
              style={{
                height: 3,
                width: `${w}%`,
                background: t.text,
                opacity: isDark ? 0.5 : 0.22,
                borderRadius: 1,
              }}
            />
          ))}
        </div>
      </div>

      <span
        style={{
          display: "block",
          marginTop: 6,
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: "0.75rem",
          fontWeight: selected ? 700 : 400,
          color: B,
        }}
      >
        {t.label}
      </span>
    </div>
  );
}

export interface PresentationGenerateOptions {
  topics: NotebookTopic[];
  customTopic: string;
  numSlides: number;
  textLength: "brief" | "balanced" | "detailed";
  theme: PresentationTheme;
}

interface PresentationColumnProps {
  topics: NotebookTopic[];
  isLoadingTopics: boolean;
  onGenerate: (options: PresentationGenerateOptions) => Promise<void>;
  isGenerating: boolean;
}

export default function PresentationColumn({
  topics,
  isLoadingTopics,
  onGenerate,
  isGenerating,
}: PresentationColumnProps) {
  const [topicsExpanded, setTopicsExpanded] = useState(false);
  const [selectedTopics, setSelectedTopics] = useState<NotebookTopic[]>([]);
  const [customTopic, setCustomTopic] = useState("");
  const [numSlides, setNumSlides] = useState(10);
  const [textLength, setTextLength] = useState<"brief" | "balanced" | "detailed">("balanced");
  const [theme, setTheme] = useState<PresentationTheme>("freshr");

  const canGenerate = !isGenerating;
  const isAllTopicsMode = selectedTopics.length === 0 && customTopic.trim().length === 0;

  function toggleTopic(topic: NotebookTopic) {
    setSelectedTopics((prev) =>
      prev.some((t) => t.id === topic.id)
        ? prev.filter((t) => t.id !== topic.id)
        : [...prev, topic],
    );
  }

  async function handleGenerate() {
    if (!canGenerate) return;
    await onGenerate({ topics: selectedTopics, customTopic: customTopic.trim(), numSlides, textLength, theme });
  }

  const selectedIds = new Set(selectedTopics.map((t) => t.id));
  const previewTopics = topics.slice(0, COLLAPSED_MAX);
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
            fontSize: "0.75rem",
            fontWeight: 700,
            letterSpacing: "0.14em",
            color: "#000000",
          }}
        >
          PRESENTATION GENERATOR
        </span>
      </div>

      {/* Scrollable content */}
      <div style={{ flex: 1, overflowY: "auto", padding: "28px 32px 24px" }}>
        <div style={{ maxWidth: 580, margin: "0 auto" }}>

          {/* Title */}
          <h2
            style={{
              fontFamily: "'Syne', sans-serif",
              fontWeight: 800,
              fontSize: "1.4rem",
              color: B,
              margin: "0 0 24px",
              letterSpacing: "-0.02em",
            }}
          >
            Generate a Presentation
          </h2>

          {/* Topics */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <span style={labelStyle}>TOPICS</span>
              {topicsExpanded && (
                <span
                  onClick={() => setTopicsExpanded(false)}
                  onMouseEnter={(e) => (e.currentTarget.style.color = B)}
                  onMouseLeave={(e) => (e.currentTarget.style.color = "#000000")}
                  style={{
                    fontFamily: "'IBM Plex Mono', monospace",
                    fontSize: "0.75rem",
                    color: "#000000",
                    cursor: "pointer",
                    userSelect: "none",
                  }}
                >
                  × Collapse
                </span>
              )}
            </div>

            {isLoadingTopics ? (
              <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "0.75rem", color: "#000000", margin: 0 }}>
                Loading topics...
              </p>
            ) : topics.length === 0 ? (
              <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "0.75rem", color: "#000000", margin: 0, lineHeight: 1.6 }}>
                No topics found. Upload files to your notebook first.
              </p>
            ) : topicsExpanded ? (
              <div
                style={{
                  border: `2px solid ${B}`,
                  background: W,
                  maxHeight: 120,
                  overflowY: "auto",
                  padding: "8px 10px",
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 5,
                }}
              >
                {topics.map((topic) => (
                  <QuizTopicChip
                    key={topic.id}
                    label={topic.name}
                    selected={selectedIds.has(topic.id)}
                    onToggle={() => toggleTopic(topic)}
                    compact={false}
                  />
                ))}
              </div>
            ) : (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 5, alignItems: "center" }}>
                {previewTopics.map((topic) => (
                  <QuizTopicChip
                    key={topic.id}
                    label={topic.name}
                    selected={selectedIds.has(topic.id)}
                    onToggle={() => toggleTopic(topic)}
                    compact={true}
                  />
                ))}
                {hiddenCount > 0 && (
                  <span
                    onClick={() => setTopicsExpanded(true)}
                    onMouseEnter={(e) => (e.currentTarget.style.color = "#000000")}
                    onMouseLeave={(e) => (e.currentTarget.style.color = "#000000")}
                    style={{
                      fontFamily: "'IBM Plex Mono', monospace",
                      fontSize: "0.75rem",
                      color: "#000000",
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

            {selectedTopics.length > 0 ? (
              <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "0.75rem", color: "#000000", margin: "6px 0 0" }}>
                {selectedTopics.length} topic{selectedTopics.length > 1 ? "s" : ""} selected
              </p>
            ) : topics.length > 0 && (
              <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "0.75rem", color: "#000000", margin: "6px 0 0" }}>
                No topics selected — presentation will cover all topics
              </p>
            )}
          </div>

          {/* Custom topic */}
          <div style={{ marginBottom: 20 }}>
            <label style={labelStyle}>OR DESCRIBE YOUR OWN TOPIC</label>
            <textarea
              value={customTopic}
              onChange={(e) => setCustomTopic(e.target.value)}
              placeholder="e.g. Compare the causes and effects of WWI and WWII..."
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
                padding: "8px 10px",
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: "0.75rem",
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

          {/* Slides + Length */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
            <div>
              <label style={labelStyle}>SLIDES</label>
              <Dropdown
                value={String(numSlides)}
                onChange={(v) => setNumSlides(Number(v))}
                placeholder="10"
                options={[
                  { value: "5",  label: "5"  },
                  { value: "8",  label: "8"  },
                  { value: "10", label: "10" },
                  { value: "15", label: "15" },
                  { value: "20", label: "20" },
                ]}
              />
            </div>
            <div>
              <label style={labelStyle}>LENGTH</label>
              <Dropdown
                value={textLength}
                onChange={(v) => setTextLength(v as "brief" | "balanced" | "detailed")}
                placeholder="Balanced"
                options={[
                  { value: "brief",    label: "Brief"    },
                  { value: "balanced", label: "Balanced" },
                  { value: "detailed", label: "Detailed" },
                ]}
              />
            </div>
          </div>

          {/* Style cards */}
          <div>
            <span style={labelStyle}>STYLE</span>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
              {(Object.keys(THEMES) as PresentationTheme[]).map((key) => (
                <ThemeCard
                  key={key}
                  themeKey={key}
                  selected={theme === key}
                  onClick={() => setTheme(key)}
                />
              ))}
            </div>
          </div>

        </div>
      </div>

      {/* Pinned footer — Generate button */}
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
            color: B,
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
          {isGenerating
            ? "Generating..."
            : isAllTopicsMode
              ? "Generate from Entire Notebook →"
              : "Generate Presentation →"}
        </button>
      </div>
    </div>
  );
}
