import { useState } from "react";
import {
  type QuizDifficulty,
  type QuizGenerateOptions,
  type NotebookTopic,
  QUESTION_COUNT_OPTIONS,
  DIFFICULTY_OPTIONS,
  MODE_OPTIONS,
  TIMER_OPTIONS,
  COLLAPSED_MAX,
} from "@freshr/shared";
import QuizTopicChip from "../quiz/QuizTopicChip";
import Dropdown from "../ui/Dropdown";
import Divider from "../quiz/Divider";

const G = "#84e487";
const B = "#000000";
const W = "#FFFFFF";

const labelStyle: React.CSSProperties = {
  display: "block",
  fontFamily: "'IBM Plex Mono', monospace",
  fontSize: "0.75rem",
  fontWeight: 700,
  letterSpacing: "0.12em",
  color: "#000000",
  marginBottom: 6,
};

interface QuizColumnProps {
  topics: NotebookTopic[];
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
  const [selectedTopics, setSelectedTopics] = useState<NotebookTopic[]>([]);
  const [prompt, setPrompt] = useState("");
  const [questionCount, setQuestionCount] = useState<number>(5);
  const [difficulty, setDifficulty] = useState<QuizDifficulty>("EASY");
  const [quizType, setQuizType] = useState<string>("PRACTICE");
  const [timeLimit, setTimeLimit] = useState<number | null>(null);

  const canGenerate = !isGenerating;

  const isAllTopicsMode =
    selectedTopics.length === 0 && prompt.trim().length === 0;

  function toggleTopic(topic: NotebookTopic) {
    setSelectedTopics((prev) =>
      prev.some((t) => t.id === topic.id)
        ? prev.filter((t) => t.id !== topic.id)
        : [...prev, topic],
    );
  }

  async function handleGenerate() {
    if (!canGenerate) return;
    await onGenerate({
      topics: selectedTopics,
      prompt: prompt.trim() || undefined,
      questionCount,
      difficulty,
      quizType,
      timeLimit: timeLimit ?? undefined,
    });
  }

  // Collapsed preview: selected topics first, then unselected, up to COLLAPSED_MAX
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
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.color = "#000000")
                  }
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
              <p
                style={{
                  fontFamily: "'IBM Plex Mono', monospace",
                  fontSize: "0.75rem",
                  color: "#000000",
                  margin: 0,
                }}
              >
                Loading topics...
              </p>
            ) : topics.length === 0 ? (
              <p
                style={{
                  fontFamily: "'IBM Plex Mono', monospace",
                  fontSize: "0.75rem",
                  color: "#000000",
                  margin: 0,
                  lineHeight: 1.6,
                }}
              >
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
              // Collapsed: up to 8 compact chips, then +x more button
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 6,
                  alignItems: "center",
                }}
              >
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
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.color = "#000000")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.color = "#000000")
                    }
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
              <p
                style={{
                  fontFamily: "'IBM Plex Mono', monospace",
                  fontSize: "0.75rem",
                  color: "#000000",
                  margin: "8px 0 0",
                }}
              >
                {selectedTopics.length} topic
                {selectedTopics.length > 1 ? "s" : ""} selected
              </p>
            ) : (
              topics.length > 0 && (
                <p
                  style={{
                    fontFamily: "'IBM Plex Mono', monospace",
                    fontSize: "0.75rem",
                    color: "#000000",
                    margin: "8px 0 0",
                  }}
                >
                  No topics selected — quiz will cover all topics
                </p>
              )
            )}
          </div>

          <Divider />

          {/* Prompt section */}
          <div>
            <label style={labelStyle}>
              OR DESCRIBE WHAT YOU WANT TO BE QUIZZED ON
            </label>
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

          {/* Settings — one row: Questions | Difficulty | Timer | Time Limit */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr 1fr 1fr",
              gap: 16,
            }}
          >
            {/* Questions */}
            <div>
              <label style={labelStyle}>QUESTIONS</label>
              <Dropdown
                value={String(questionCount)}
                onChange={(v) => setQuestionCount(Number(v))}
                placeholder="5"
                options={QUESTION_COUNT_OPTIONS.map((opt) => ({
                  value: String(opt.value),
                  label: opt.label,
                }))}
              />
            </div>

            {/* Difficulty */}
            <div>
              <label style={labelStyle}>DIFFICULTY</label>
              <Dropdown
                value={difficulty}
                onChange={(v) => setDifficulty(v as QuizDifficulty)}
                placeholder="Easy"
                options={DIFFICULTY_OPTIONS}
              />
            </div>

            {/* Mode */}
            <div>
              <label style={labelStyle}>MODE</label>
              <Dropdown
                value={quizType}
                onChange={(v) => {
                  setQuizType(v);
                  if (v === "TIMED") {
                    setTimeLimit(5);
                  } else {
                    setTimeLimit(null);
                  }
                }}
                placeholder="Practice"
                options={MODE_OPTIONS}
              />
            </div>

            {/* Time Limit — always visible, disabled when no timer */}
            <div>
              <label style={{ ...labelStyle, color: B }}>TIME LIMIT</label>
              <Dropdown
                value={timeLimit !== null ? String(timeLimit) : ""}
                onChange={(v) => setTimeLimit(v === "" ? null : Number(v))}
                placeholder="Select..."
                disabled={quizType !== "TIMED"}
                options={TIMER_OPTIONS.map((opt) => ({
                  value: String(opt.value),
                  label: opt.label,
                }))}
              />
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
            e.currentTarget.style.boxShadow = canGenerate
              ? `4px 4px 0 ${B}`
              : "none";
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
              : "Generate Quiz →"}
        </button>
      </div>
    </div>
  );
}
