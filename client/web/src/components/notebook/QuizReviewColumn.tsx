import { useState } from "react";
import type { QuizSession } from "@freshr/shared";

const G = "#84e487";
const B = "#000000";
const W = "#FFFFFF";

function formatDate(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}


interface QuizReviewColumnProps {
  quiz: QuizSession;
  onBack: () => void;
  onRetake: () => void;
  onTakeToChat?: (questionText: string, options: string[], topic: string) => void;
}

export default function QuizReviewColumn({
  quiz,
  onBack,
  onRetake,
  onTakeToChat,
}: QuizReviewColumnProps) {
  const [openExplanations, setOpenExplanations] = useState<Set<number>>(new Set());

  function toggleExplanation(index: number) {
    setOpenExplanations((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  }

  const numQuestions = quiz.num_questions ?? 0;
  const scoreCount = Math.round((quiz.score ?? 0) * numQuestions);
  const scorePercent = Math.round((quiz.score ?? 0) * 100);
  const timed = quiz.quiz_type === "TIMED" || quiz.quiz_type === "timed";
  const timeLimitMinutes = quiz.time_limit
    ? Math.round(quiz.time_limit / 60)
    : null;
  const dateStr = quiz.started_at ?? quiz.generated_at ?? "";
  const topics = quiz.topics ?? (quiz.topic ? [quiz.topic] : []);
  const topicLabel = topics.length > 0 ? topics.join(", ") : "General";
  const questions = quiz.questions ?? [];

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
          onClick={onBack}
          onMouseEnter={(e) =>
            (e.currentTarget.style.textDecoration = "underline")
          }
          onMouseLeave={(e) => (e.currentTarget.style.textDecoration = "none")}
          style={{
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: "0.75rem",
            fontWeight: 700,
            color: B,
            cursor: "pointer",
            textDecoration: "none",
            textUnderlineOffset: "3px",
            letterSpacing: "0.04em",
          }}
        >
          ← Back to generator
        </span>
      </div>

      {/* Scrollable content */}
      <div style={{ flex: 1, overflowY: "auto", padding: "36px 32px 24px" }}>
        <div style={{ maxWidth: 580, margin: "0 auto" }}>
          {/* Quiz title / topics */}
          <h2
            style={{
              fontFamily: "'Syne', sans-serif",
              fontWeight: 800,
              fontSize: "1.4rem",
              color: B,
              margin: "0 0 6px",
              letterSpacing: "-0.02em",
              lineHeight: 1.3,
            }}
          >
            {topicLabel}
          </h2>

          {/* Meta row */}
          <div
            style={{
              display: "flex",
              gap: 8,
              alignItems: "center",
              marginBottom: 28,
              flexWrap: "wrap",
            }}
          >
            <span
              style={{
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: "0.75rem",
                color: "#000000",
                textTransform: "capitalize",
              }}
            >
              {quiz.difficulty}
            </span>
            <span style={{ color: "#000000" }}>·</span>
            <span
              style={{
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: "0.75rem",
                color: "#000000",
              }}
            >
              {numQuestions} questions
            </span>
            {timed && timeLimitMinutes && (
              <>
                <span style={{ color: "#000000" }}>·</span>
                <span
                  style={{
                    fontFamily: "'IBM Plex Mono', monospace",
                    fontSize: "0.75rem",
                    color: "#000000",
                  }}
                >
                  {timeLimitMinutes} min limit
                </span>
              </>
            )}
            {dateStr && (
              <>
                <span style={{ color: "#000000" }}>·</span>
                <span
                  style={{
                    fontFamily: "'IBM Plex Mono', monospace",
                    fontSize: "0.75rem",
                    color: "#000000",
                  }}
                >
                  {formatDate(dateStr)}
                </span>
              </>
            )}
          </div>

          {/* Score box */}
          <div
            style={{
              border: `2px solid ${B}`,
              background: W,
              padding: "20px 24px",
              marginBottom: 36,
              display: "flex",
              alignItems: "center",
              gap: 24,
              boxShadow: `4px 4px 0 ${B}`,
            }}
          >
            <div>
              <span
                style={{
                  fontFamily: "'Syne', sans-serif",
                  fontSize: "2.2rem",
                  fontWeight: 800,
                  color: B,
                  letterSpacing: "-0.03em",
                  lineHeight: 1,
                }}
              >
                {scoreCount}/{numQuestions}
              </span>
            </div>
            <div
              style={{
                width: 1,
                height: 40,
                background: "#ddd",
                flexShrink: 0,
              }}
            />
            <div>
              <span
                style={{
                  fontFamily: "'Syne', sans-serif",
                  fontSize: "1.6rem",
                  fontWeight: 800,
                  color: B,
                  letterSpacing: "-0.02em",
                  lineHeight: 1,
                }}
              >
                {scorePercent}%
              </span>
            </div>
          </div>

          {/* Questions */}
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            {questions.map((q, qi) => {
              const correct = q.is_correct ?? (q.user_answer != null && q.user_answer === q.correct_answer);

              return (
                <div
                  key={q.id}
                  style={{
                    border: `2px solid ${B}`,
                    background: W,
                    padding: "16px 18px",
                  }}
                >
                  {/* Question header */}
                  <div
                    style={{
                      display: "flex",
                      gap: 10,
                      alignItems: "flex-start",
                      marginBottom: 14,
                    }}
                  >
                    <span
                      style={{
                        fontFamily: "'IBM Plex Mono', monospace",
                        fontSize: "0.75rem",
                        fontWeight: 700,
                        color: correct ? "#2a9e30" : "#cc3333",
                        flexShrink: 0,
                        marginTop: 1,
                      }}
                    >
                      {correct ? "✓" : "✗"}
                    </span>
                    <p
                      style={{
                        fontFamily: "'IBM Plex Mono', monospace",
                        fontSize: "0.78rem",
                        fontWeight: 600,
                        color: B,
                        margin: 0,
                        lineHeight: 1.6,
                      }}
                    >
                      Q{qi + 1}. {q.question_text}
                    </p>
                  </div>

                  {/* Options */}
                  <div
                    style={{ display: "flex", flexDirection: "column", gap: 6 }}
                  >
                    {(q.choices.length > 0 ? q.choices : ["True", "False"]).map((opt: string, oi: number) => {
                      const isUserAnswer = opt === q.user_answer;
                      const isCorrectAnswer = opt === q.correct_answer;

                      let bg = "transparent";
                      let borderColor = "#ddd";
                      let textColor = "#555";
                      let label: string | null = null;

                      if (correct && isUserAnswer) {
                        bg = "#f0fdf0";
                        borderColor = G;
                        textColor = B;
                        label = "your answer";
                      } else if (!correct && isUserAnswer) {
                        bg = "#fff5f5";
                        borderColor = "#cc3333";
                        textColor = B;
                        label = "your answer";
                      } else if (!correct && isCorrectAnswer) {
                        bg = "#f0fdf0";
                        borderColor = G;
                        textColor = B;
                        label = "correct answer";
                      }

                      return (
                        <div
                          key={oi}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 10,
                            padding: "7px 10px",
                            border: `1.5px solid ${borderColor}`,
                            background: bg,
                          }}
                        >
                          <span
                            style={{
                              fontFamily: "'IBM Plex Mono', monospace",
                              fontSize: "0.75rem",
                              fontWeight: 700,
                              color: textColor,
                              flexShrink: 0,
                            }}
                          >
                            {String.fromCharCode(65 + oi)}
                          </span>
                          <span
                            style={{
                              fontFamily: "'IBM Plex Mono', monospace",
                              fontSize: "0.75rem",
                              color: textColor,
                              flex: 1,
                              lineHeight: 1.5,
                            }}
                          >
                            {opt}
                          </span>
                          {label && (
                            <span
                              style={{
                                fontFamily: "'IBM Plex Mono', monospace",
                                fontSize: "0.75rem",
                                color:
                                  !correct && isUserAnswer
                                    ? "#cc3333"
                                    : "#2a9e30",
                                flexShrink: 0,
                              }}
                            >
                              {label}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Explanation + Take to Chat */}
                  {(q.explanation || onTakeToChat) && (
                    <div style={{ marginTop: 14 }}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          marginBottom: openExplanations.has(qi) ? 10 : 0,
                        }}
                      >
                        {q.explanation ? (
                          <button
                            onClick={() => toggleExplanation(qi)}
                            style={{
                              background: "none",
                              border: "none",
                              padding: 0,
                              cursor: "pointer",
                              fontFamily: "'IBM Plex Mono', monospace",
                              fontSize: "0.75rem",
                              fontWeight: 600,
                              color: "#000000",
                              display: "flex",
                              alignItems: "center",
                              gap: 6,
                            }}
                          >
                            <span
                              style={{
                                display: "inline-block",
                                transition: "transform 0.2s",
                                transform: openExplanations.has(qi) ? "rotate(90deg)" : "rotate(0deg)",
                                fontSize: "0.75rem",
                              }}
                            >
                              ▶
                            </span>
                            {openExplanations.has(qi) ? "Hide Explanation" : "Show Explanation"}
                          </button>
                        ) : (
                          <span />
                        )}

                        {onTakeToChat && (
                          <button
                            onClick={() => {
                              const choices = q.choices?.length > 0 ? q.choices : ["True", "False"];
                              onTakeToChat(q.question_text, choices, topicLabel);
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.color = B;
                              e.currentTarget.style.borderColor = B;
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.color = "#000000";
                              e.currentTarget.style.borderColor = "#bbb";
                            }}
                            style={{
                              background: "transparent",
                              border: "1.5px solid #bbb",
                              color: "#000000",
                              fontFamily: "'IBM Plex Mono', monospace",
                              fontSize: "0.75rem",
                              fontWeight: 600,
                              letterSpacing: "0.04em",
                              padding: "6px 14px",
                              cursor: "pointer",
                              transition: "color 0.15s, border-color 0.15s",
                              whiteSpace: "nowrap",
                            }}
                          >
                            💬 Take to Chat →
                          </button>
                        )}
                      </div>

                      {openExplanations.has(qi) && q.explanation && (
                        <div
                          style={{
                            background: "#f0fdf4",
                            border: `2px solid ${G}`,
                            padding: "14px 18px",
                          }}
                        >
                          <p
                            style={{
                              fontFamily: "'IBM Plex Mono', monospace",
                              fontSize: "0.78rem",
                              color: "#000000",
                              margin: 0,
                              lineHeight: 1.7,
                            }}
                          >
                            {q.explanation}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Bottom bar — Retake button */}
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
          onClick={onRetake}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "translate(-3px, -3px)";
            e.currentTarget.style.boxShadow = `7px 7px 0 ${B}`;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "none";
            e.currentTarget.style.boxShadow = `4px 4px 0 ${B}`;
          }}
          onMouseDown={(e) => {
            e.currentTarget.style.transform = "translate(2px, 2px)";
            e.currentTarget.style.boxShadow = `2px 2px 0 ${B}`;
          }}
          onMouseUp={(e) => {
            e.currentTarget.style.transform = "translate(-3px, -3px)";
            e.currentTarget.style.boxShadow = `7px 7px 0 ${B}`;
          }}
          style={{
            background: G,
            color: B,
            border: `2px solid ${B}`,
            boxShadow: `4px 4px 0 ${B}`,
            padding: "14px 40px",
            fontFamily: "'IBM Plex Mono', monospace",
            fontWeight: 700,
            fontSize: "0.82rem",
            letterSpacing: "0.06em",
            cursor: "pointer",
            transition: "transform 0.15s, box-shadow 0.15s",
          }}
        >
          Retake Quiz →
        </button>
      </div>
    </div>
  );
}
