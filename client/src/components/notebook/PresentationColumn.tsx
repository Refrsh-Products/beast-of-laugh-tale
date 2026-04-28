import { useState, useRef } from "react";
import type { NotebookTopic } from "../../services/quiz/Quiz.types";
import QuizTopicChip from "../quiz/QuizTopicChip";
import QuizSelectDropdown from "../quiz/QuizSelectDropdown";
import PresentationPreview from "../presentation/PresentationPreview";

const G = "#84e487";
const B = "#000000";
const W = "#FFFFFF";
const COLLAPSED_MAX = 8;

type PresentationTheme = "minimal" | "dark" | "academic" | "serif" | "freshr";

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
  freshr: {
    label: "Freshr",
    bg: "#ffffff",
    text: "#000000",
    accent: "#84e487",
    description: "Freshr's own neo-brutalist style. Bold black borders, white background, and signature green accents.",
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
  const [leftWidth, setLeftWidth] = useState(300);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);

  function handleDividerMouseDown(e: React.MouseEvent) {
    e.preventDefault();
    isDragging.current = true;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";

    function onMouseMove(ev: MouseEvent) {
      if (!isDragging.current || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const newWidth = ev.clientX - rect.left;
      setLeftWidth(Math.max(300, Math.min(500, newWidth)));
    }

    function onMouseUp() {
      isDragging.current = false;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
    }

    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
  }

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
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>

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

      {/* Two-panel body */}
      <div ref={containerRef} style={{ flex: 1, display: "flex", overflow: "hidden" }}>

        {/* LEFT — Options */}
        <div
          style={{
            width: leftWidth,
            minWidth: 300,
            maxWidth: 500,
            flexShrink: 0,
            background: W,
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
            padding: "24px 20px",
            gap: 20,
          }}
        >
          {/* Topics */}
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <span style={labelStyle}>TOPICS</span>
              {topicsExpanded && (
                <span
                  onClick={() => setTopicsExpanded(false)}
                  onMouseEnter={(e) => (e.currentTarget.style.color = B)}
                  onMouseLeave={(e) => (e.currentTarget.style.color = "#888")}
                  style={{
                    fontFamily: "'IBM Plex Mono', monospace",
                    fontSize: "0.65rem",
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
              <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "0.6rem", color: "#888", margin: "6px 0 0" }}>
                {selectedTopics.length} topic{selectedTopics.length > 1 ? "s" : ""} selected
              </p>
            ) : topics.length > 0 && (
              <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "0.6rem", color: "#888", margin: "6px 0 0" }}>
                All topics — full notebook
              </p>
            )}
          </div>


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
                padding: "8px 10px",
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: "0.72rem",
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


          {/* Slides + Text length */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label style={labelStyle}>SLIDES</label>
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
              <label style={labelStyle}>LENGTH</label>
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
        </div>

        {/* Draggable divider */}
        <div
          onMouseDown={handleDividerMouseDown}
          style={{
            width: 4,
            flexShrink: 0,
            background: B,
            cursor: "col-resize",
            position: "relative",
            transition: "background 0.15s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "#444")}
          onMouseLeave={(e) => (e.currentTarget.style.background = B)}
        >
          <div
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              display: "flex",
              flexDirection: "column",
              gap: 3,
              pointerEvents: "none",
            }}
          >
            {[0, 1, 2].map((i) => (
              <div key={i} style={{ width: 2, height: 2, borderRadius: "50%", background: W, opacity: 0.6 }} />
            ))}
          </div>
        </div>

        {/* RIGHT — Preview stage */}
        <div
          style={{
            flex: 1,
            background: "#e8e5de",
            backgroundImage: "radial-gradient(circle, #c8c4bc 1px, transparent 1px)",
            backgroundSize: "22px 22px",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          {/* Style selector bar */}
          <div
            style={{
              padding: "10px 20px",
              borderBottom: `2px solid ${B}`,
              background: "rgba(255,255,255,0.92)",
              display: "flex",
              alignItems: "center",
              gap: 14,
              flexShrink: 0,
            }}
          >
            <span style={labelStyle}>STYLE</span>
            <div style={{ flex: 1, maxWidth: 200 }}>
              <QuizSelectDropdown
                value={theme}
                onChange={(v) => setTheme(v as PresentationTheme)}
                placeholder="Minimal"
                options={Object.entries(THEMES).map(([value, t]) => ({ value, label: t.label }))}
              />
            </div>
          </div>

          {/* Preview — fills available space */}
          <div
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "24px",
              overflow: "hidden",
            }}
          >
            <div style={{ width: "100%", boxShadow: `8px 8px 0 ${B}` }}>
              <PresentationPreview theme={theme} themeConfig={THEMES[theme]} />
            </div>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div
        style={{
          borderTop: `2px solid ${B}`,
          padding: "14px 32px",
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
            padding: "14px 48px",
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
