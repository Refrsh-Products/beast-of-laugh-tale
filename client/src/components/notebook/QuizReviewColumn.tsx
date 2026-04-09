import type { QuizAttempt } from "../../storage";

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

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return s > 0 ? `${m}m ${s}s` : `${m}m`;
}

interface QuizReviewColumnProps {
  quiz: QuizAttempt;
  onBack: () => void;
  onRetake: () => void;
}

export default function QuizReviewColumn({
  quiz,
  onBack,
  onRetake,
}: QuizReviewColumnProps) {
  const scorePercent = Math.round((quiz.score / quiz.question_count) * 100);

  const topicLabel =
    quiz.topics.length > 0
      ? quiz.topics.join(", ")
      : quiz.prompt
      ? "Custom prompt"
      : "General";

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
          onMouseEnter={(e) => (e.currentTarget.style.textDecoration = "underline")}
          onMouseLeave={(e) => (e.currentTarget.style.textDecoration = "none")}
          style={{
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: "0.72rem",
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
                fontSize: "0.65rem",
                color: "#666",
                textTransform: "capitalize",
              }}
            >
              {quiz.difficulty}
            </span>
            <span style={{ color: "#ccc" }}>·</span>
            <span
              style={{
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: "0.65rem",
                color: "#666",
              }}
            >
              {quiz.question_count} questions
            </span>
            {quiz.timed && quiz.time_limit && (
              <>
                <span style={{ color: "#ccc" }}>·</span>
                <span
                  style={{
                    fontFamily: "'IBM Plex Mono', monospace",
                    fontSize: "0.65rem",
                    color: "#666",
                  }}
                >
                  {quiz.time_limit} min limit
                </span>
              </>
            )}
            <span style={{ color: "#ccc" }}>·</span>
            <span
              style={{
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: "0.65rem",
                color: "#666",
              }}
            >
              {formatDate(quiz.created_at)}
            </span>
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
                {quiz.score}/{quiz.question_count}
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
            <div style={{ marginLeft: "auto", textAlign: "right" }}>
              <p
                style={{
                  fontFamily: "'IBM Plex Mono', monospace",
                  fontSize: "0.62rem",
                  color: "#888",
                  margin: "0 0 4px",
                }}
              >
                Time taken
              </p>
              <p
                style={{
                  fontFamily: "'IBM Plex Mono', monospace",
                  fontSize: "0.78rem",
                  fontWeight: 700,
                  color: B,
                  margin: 0,
                }}
              >
                {formatTime(quiz.time_taken)}
              </p>
            </div>
          </div>

          {/* Questions */}
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            {quiz.questions.map((q, qi) => {
              const userAnswer = quiz.user_answers[qi];
              const correct = userAnswer === q.correct_index;

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
                        fontSize: "0.65rem",
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
                      Q{qi + 1}. {q.question}
                    </p>
                  </div>

                  {/* Options */}
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {q.options.map((opt, oi) => {
                      const isUserAnswer = oi === userAnswer;
                      const isCorrectAnswer = oi === q.correct_index;

                      // Highlight logic:
                      // - If correct: user's answer gets green
                      // - If wrong: user's answer gets red tint, correct answer gets green tint
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
                              fontSize: "0.68rem",
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
                              fontSize: "0.72rem",
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
                                fontSize: "0.58rem",
                                color: !correct && isUserAnswer ? "#cc3333" : "#2a9e30",
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
