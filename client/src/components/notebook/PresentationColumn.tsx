import { useState } from "react";
import type { NotebookTopic } from "../../services/quiz/Quiz.types";
import QuizTopicChip from "../quiz/QuizTopicChip";
import QuizSelectDropdown from "../quiz/QuizSelectDropdown";
import Divider from "../quiz/Divider";

const G = "#84e487";
const B = "#000000";
const W = "#FFFFFF";
const COLLAPSED_MAX = 8;

type PresentationTheme = "minimal" | "dark" | "academic" | "serif";

const THEMES: Record<PresentationTheme, { label: string; bg: string; text: string; accent: string; description: string }> = {
  minimal: {
    label: "Minimal",
    bg: "#ffffff",
    text: "#000000",
    accent: "#000000",
    description: "Clean and minimal. White background, sharp sans-serif typography. Best for professional or academic content.",
  },
  dark: {
    label: "Dark",
    bg: "#1a1a1a",
    text: "#ffffff",
    accent: "#84e487",
    description: "High contrast dark theme. Bold and modern. Great for technical or impactful presentations.",
  },
  academic: {
    label: "Academic",
    bg: "#eef3f8",
    text: "#1e3a5f",
    accent: "#2a72b5",
    description: "Professional blue-tinted theme. Suited for research, reports, and academic work.",
  },
  serif: {
    label: "Serif",
    bg: "#faf7f2",
    text: "#3b2f1e",
    accent: "#8b6a1f",
    description: "Warm and editorial. Elegant serif typography for a polished, refined presentation.",
  },
};

const labelStyle: React.CSSProperties = {
  display: "block",
  fontFamily: "'IBM Plex Mono', monospace",
  fontSize: "0.62rem",
  fontWeight: 700,
  letterSpacing: "0.12em",
  color: "#555",
  marginBottom: 6,
};

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
  const [theme, setTheme] = useState<PresentationTheme>("minimal");

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
            fontSize: "0.62rem",
            fontWeight: 700,
            letterSpacing: "0.14em",
            color: "#555",
          }}
        >
          PRESENTATION GENERATOR
        </span>
      </div>

      {/* Scrollable content */}
      <div style={{ flex: 1, overflowY: "auto", padding: "36px 32px 24px" }}>
        <div style={{ maxWidth: 580, margin: "0 auto" }}>
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
            Generate a Presentation
          </h2>

          {/* Topics */}
          <div style={{ marginBottom: 4 }}>
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
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center" }}>
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

            {selectedTopics.length > 0 ? (
              <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "0.62rem", color: "#888", margin: "8px 0 0" }}>
                {selectedTopics.length} topic{selectedTopics.length > 1 ? "s" : ""} selected
              </p>
            ) : topics.length > 0 && (
              <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "0.62rem", color: "#888", margin: "8px 0 0" }}>
                No topics selected — presentation will cover all topics
              </p>
            )}
          </div>

          <Divider />

          {/* Custom topic */}
          <div>
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

          {/* Options */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div>
              <label style={labelStyle}>NUMBER OF SLIDES</label>
              <QuizSelectDropdown
                value={String(numSlides)}
                onChange={(v) => setNumSlides(Number(v))}
                placeholder="10"
                options={[
                  { value: "5", label: "5" },
                  { value: "8", label: "8" },
                  { value: "10", label: "10" },
                  { value: "15", label: "15" },
                  { value: "20", label: "20" },
                ]}
              />
            </div>
            <div>
              <label style={labelStyle}>TEXT LENGTH</label>
              <QuizSelectDropdown
                value={textLength}
                onChange={(v) => setTextLength(v as "brief" | "balanced" | "detailed")}
                placeholder="Balanced"
                options={[
                  { value: "brief", label: "Brief" },
                  { value: "balanced", label: "Balanced" },
                  { value: "detailed", label: "Detailed" },
                ]}
              />
            </div>
          </div>

          <Divider />

          {/* Style */}
          <div>
            <label style={labelStyle}>STYLE</label>
            <QuizSelectDropdown
              value={theme}
              onChange={(v) => setTheme(v as PresentationTheme)}
              placeholder="Minimal"
              options={Object.entries(THEMES).map(([value, t]) => ({ value, label: t.label }))}
            />
          </div>

          {/* Preview placeholder */}
          <div style={{ marginTop: 16 }}>
            <label style={labelStyle}>PREVIEW</label>
            <div
              style={{
                border: `2px solid ${B}`,
                background: THEMES[theme].bg,
                padding: "28px 32px",
                display: "flex",
                flexDirection: "column",
                gap: 12,
                minHeight: 160,
              }}
            >
              <div
                style={{
                  fontFamily: theme === "serif" ? "'Georgia', serif" : "'IBM Plex Mono', monospace",
                  fontSize: "1rem",
                  fontWeight: 700,
                  color: THEMES[theme].text,
                  letterSpacing: theme === "serif" ? "0" : "-0.01em",
                }}
              >
                Sample Slide Title
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {["This is what a bullet point looks like", "Another point shown here", "Style applied: " + THEMES[theme].label].map((bullet, i) => (
                  <div
                    key={i}
                    style={{
                      fontFamily: theme === "serif" ? "'Georgia', serif" : "'IBM Plex Mono', monospace",
                      fontSize: "0.72rem",
                      color: THEMES[theme].text,
                      opacity: 0.85,
                      display: "flex",
                      gap: 8,
                      alignItems: "flex-start",
                    }}
                  >
                    <span style={{ color: THEMES[theme].accent, flexShrink: 0 }}>•</span>
                    {bullet}
                  </div>
                ))}
              </div>
            </div>
            <p
              style={{
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: "0.65rem",
                color: "#888",
                margin: "8px 0 0",
                lineHeight: 1.6,
              }}
            >
              {THEMES[theme].description}
            </p>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
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
