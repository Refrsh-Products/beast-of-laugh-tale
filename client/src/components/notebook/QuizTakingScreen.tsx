import { useState, useEffect } from "react";
import type { QuizAttempt } from "../../storage";

const G = "#84e487";
const B = "#000000";
const W = "#FFFFFF";
const R = "#FF4D4D";
const AMBER = "#FCD34D";

// ── Modal backdrop + card ─────────────────────────────────────────

function Modal({
  children,
  onClose,
}: {
  children: React.ReactNode;
  onClose?: () => void;
}) {
  return (
    <div
      onMouseDown={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.5)",
        zIndex: 4000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
      }}
    >
      <div
        onMouseDown={(e) => e.stopPropagation()}
        style={{
          background: W,
          border: `2px solid ${B}`,
          boxShadow: `4px 4px 0 ${B}`,
          padding: 32,
          maxWidth: 380,
          width: "100%",
        }}
      >
        {children}
      </div>
    </div>
  );
}

// ── Modal button helpers ──────────────────────────────────────────

function ModalBtn({
  onClick,
  bg,
  color,
  border,
  children,
}: {
  onClick: () => void;
  bg: string;
  color: string;
  border: string;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translate(-2px, -2px)";
        e.currentTarget.style.boxShadow = `6px 6px 0 ${B}`;
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
        e.currentTarget.style.transform = "translate(-2px, -2px)";
        e.currentTarget.style.boxShadow = `6px 6px 0 ${B}`;
      }}
      style={{
        background: bg,
        color,
        border,
        boxShadow: `4px 4px 0 ${B}`,
        padding: "10px 20px",
        fontFamily: "'IBM Plex Mono', monospace",
        fontWeight: 700,
        fontSize: "0.72rem",
        letterSpacing: "0.04em",
        cursor: "pointer",
        transition: "transform 0.15s, box-shadow 0.15s",
      }}
    >
      {children}
    </button>
  );
}

// ── Time's Up modal (undismissable) ───────────────────────────────

function TimesUpModal({
  timeLimit,
  onSeeResults,
}: {
  timeLimit: number;
  onSeeResults: () => void;
}) {
  return (
    <Modal>
      <h2
        style={{
          fontFamily: "'Syne', sans-serif",
          fontSize: "1.4rem",
          fontWeight: 800,
          color: B,
          margin: "0 0 12px",
          letterSpacing: "-0.02em",
        }}
      >
        Time's Up
      </h2>
      <p
        style={{
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: "0.78rem",
          color: "#555",
          margin: "0 0 28px",
          lineHeight: 1.7,
        }}
      >
        You've used all {timeLimit} minutes.
        <br />
        Your answers have been recorded.
      </p>
      <div style={{ display: "flex", justifyContent: "center" }}>
        <ModalBtn
          onClick={onSeeResults}
          bg={G}
          color={B}
          border={`2px solid ${B}`}
        >
          See Results →
        </ModalBtn>
      </div>
    </Modal>
  );
}

// ── Unanswered warning modal ──────────────────────────────────────

function UnansweredModal({
  count,
  onGoBack,
  onSubmit,
}: {
  count: number;
  onGoBack: () => void;
  onSubmit: () => void;
}) {
  return (
    <Modal onClose={onGoBack}>
      <h2
        style={{
          fontFamily: "'Syne', sans-serif",
          fontSize: "1.2rem",
          fontWeight: 800,
          color: B,
          margin: "0 0 12px",
          letterSpacing: "-0.02em",
        }}
      >
        {count} unanswered {count === 1 ? "question" : "questions"}
      </h2>
      <p
        style={{
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: "0.78rem",
          color: "#555",
          margin: "0 0 28px",
          lineHeight: 1.7,
        }}
      >
        Skipped questions will be marked as incorrect.
      </p>
      <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
        <ModalBtn onClick={onGoBack} bg={W} color={B} border={`2px solid ${B}`}>
          Go Back
        </ModalBtn>
        <ModalBtn onClick={onSubmit} bg={G} color={B} border={`2px solid ${B}`}>
          Submit Anyway →
        </ModalBtn>
      </div>
    </Modal>
  );
}

// ── Exit confirmation modal ───────────────────────────────────────

function ExitConfirmModal({
  onKeepGoing,
  onExit,
}: {
  onKeepGoing: () => void;
  onExit: () => void;
}) {
  return (
    <Modal onClose={onKeepGoing}>
      <h2
        style={{
          fontFamily: "'Syne', sans-serif",
          fontSize: "1.2rem",
          fontWeight: 800,
          color: B,
          margin: "0 0 12px",
          letterSpacing: "-0.02em",
        }}
      >
        Exit quiz?
      </h2>
      <p
        style={{
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: "0.78rem",
          color: "#555",
          margin: "0 0 28px",
          lineHeight: 1.7,
        }}
      >
        Your progress will be lost.
      </p>
      <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
        <ModalBtn onClick={onKeepGoing} bg={W} color={B} border={`2px solid ${B}`}>
          Keep Going
        </ModalBtn>
        <ModalBtn onClick={onExit} bg={R} color={W} border={`2px solid ${B}`}>
          Exit Quiz
        </ModalBtn>
      </div>
    </Modal>
  );
}

// ── Footer nav button (Prev / Next / Submit) ──────────────────────
// Uses React state for hover/press — avoids imperative DOM style mutation
// which causes the "stuck shadow" bug on re-render when navigating questions.

function NavButton({
  onClick,
  disabled = false,
  green = false,
  children,
}: {
  onClick: () => void;
  disabled?: boolean;
  green?: boolean;
  children: React.ReactNode;
}) {
  const [hovered, setHovered] = useState(false);
  const [pressed, setPressed] = useState(false);

  // Reset hover/press when disabled changes (e.g. Prev becomes enabled on Q2)
  useEffect(() => {
    setHovered(false);
    setPressed(false);
  }, [disabled]);

  const restingShadow = green ? `4px 4px 0 ${B}` : `3px 3px 0 ${B}`;
  const hoverShadow = green ? `7px 7px 0 ${B}` : `5px 5px 0 ${B}`;
  const hoverTranslate = green ? "translate(-3px, -3px)" : "translate(-2px, -2px)";

  const shadow = disabled
    ? "none"
    : pressed
    ? `2px 2px 0 ${B}`
    : hovered
    ? hoverShadow
    : restingShadow;

  const transform = disabled
    ? "none"
    : pressed
    ? "translate(2px, 2px)"
    : hovered
    ? hoverTranslate
    : "none";

  return (
    <button
      disabled={disabled}
      onClick={
        disabled
          ? undefined
          : () => {
              setHovered(false);
              setPressed(false);
              onClick();
            }
      }
      onMouseEnter={() => !disabled && setHovered(true)}
      onMouseLeave={() => {
        setHovered(false);
        setPressed(false);
      }}
      onMouseDown={() => !disabled && setPressed(true)}
      onMouseUp={() => setPressed(false)}
      style={{
        padding: "12px 32px",
        fontFamily: "'IBM Plex Mono', monospace",
        fontWeight: 700,
        fontSize: "0.82rem",
        letterSpacing: "0.06em",
        border: `2px solid ${disabled ? "#ccc" : B}`,
        background: disabled ? "#eee" : green ? G : W,
        color: disabled ? "#aaa" : B,
        boxShadow: shadow,
        transform,
        cursor: disabled ? "not-allowed" : "pointer",
        transition: "transform 0.15s, box-shadow 0.15s",
        width: 210,
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </button>
  );
}

// ── Main QuizTakingScreen ─────────────────────────────────────────

interface QuizTakingScreenProps {
  quiz: QuizAttempt;
  onComplete: (userAnswers: (number | null)[], timeTaken: number, flaggedQuestions: number[]) => void;
  onExit: () => void;
  onTakeToChat?: (questionText: string, options: string[], topic: string) => void;
}

export default function QuizTakingScreen({
  quiz,
  onComplete,
  onExit,
  onTakeToChat,
}: QuizTakingScreenProps) {
  const totalSeconds = quiz.timed && quiz.time_limit ? quiz.time_limit * 60 : 0;
  const isPractice = !quiz.timed;

  const [currentQ, setCurrentQ] = useState(0);
  const [userAnswers, setUserAnswers] = useState<(number | null)[]>(
    Array(quiz.question_count).fill(null),
  );
  const [flaggedQuestions, setFlaggedQuestions] = useState<number[]>([]);
  const [secondsRemaining, setSecondsRemaining] = useState(totalSeconds);
  const [secondsElapsed, setSecondsElapsed] = useState(0);
  const [frozen, setFrozen] = useState(false);
  const [showTimesUp, setShowTimesUp] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [showUnansweredWarning, setShowUnansweredWarning] = useState(false);
  const [explanationOpen, setExplanationOpen] = useState(false);

  // Reset explanation panel when navigating to a different question
  useEffect(() => {
    setExplanationOpen(false);
  }, [currentQ]);

  // Countdown timer (timed quizzes)
  useEffect(() => {
    if (!quiz.timed || totalSeconds === 0) return;
    if (frozen) return;
    const interval = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setFrozen(true);
          setShowTimesUp(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [quiz.timed, totalSeconds, frozen]);

  // Count-up timer (untimed/practice quizzes)
  useEffect(() => {
    if (quiz.timed) return;
    if (frozen) return;
    const interval = setInterval(() => {
      setSecondsElapsed((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [quiz.timed, frozen]);

  function formatTimer(secs: number): string {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }

  const answeredCount = userAnswers.filter((a) => a !== null).length;
  const unansweredCount = quiz.question_count - answeredCount;
  const isLastQuestion = currentQ === quiz.question_count - 1;
  const allAnswered = answeredCount === quiz.question_count;
  const showSubmit = isLastQuestion || allAnswered;
  const timerCritical = quiz.timed && secondsRemaining < 60 && secondsRemaining > 0;
  const progressPercent = (answeredCount / quiz.question_count) * 100;

  const topicLabel =
    quiz.topics.length > 0
      ? quiz.topics.slice(0, 2).join(", ") +
        (quiz.topics.length > 2 ? ` +${quiz.topics.length - 2}` : "")
      : quiz.prompt
      ? "Custom prompt"
      : "General";

  const isFlagged = flaggedQuestions.includes(currentQ);

  function toggleFlag() {
    setFlaggedQuestions((prev) =>
      prev.includes(currentQ) ? prev.filter((i) => i !== currentQ) : [...prev, currentQ],
    );
  }

  function selectAnswer(optionIndex: number) {
    if (frozen) return;
    setUserAnswers((prev) => {
      const next = [...prev];
      next[currentQ] = next[currentQ] === optionIndex ? null : optionIndex;
      return next;
    });
  }

  function handleSubmitClick() {
    if (unansweredCount > 0) {
      setShowUnansweredWarning(true);
    } else {
      doSubmit();
    }
  }

  function doSubmit() {
    const timeTaken = quiz.timed ? totalSeconds - secondsRemaining : secondsElapsed;
    onComplete(userAnswers, timeTaken, flaggedQuestions);
  }

  function handleTimesUpResults() {
    setShowTimesUp(false);
    onComplete(userAnswers, totalSeconds, flaggedQuestions);
  }

  function handleTakeToChat() {
    if (!onTakeToChat) return;
    const question = quiz.questions[currentQ];
    const topic = quiz.topics.length > 0 ? quiz.topics[0] : "this topic";
    onTakeToChat(question.question, question.options, topic);
  }

  const question = quiz.questions[currentQ];

  return (
    <>
      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 3000,
          background: "#f5f5f0",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {/* Header — 3-column grid: topic left | Q counter center | timer right */}
        <div
          style={{
            background: W,
            borderBottom: `2px solid ${B}`,
            flexShrink: 0,
          }}
        >
          <div
            style={{
              padding: "0 32px",
              height: 52,
              display: "grid",
              gridTemplateColumns: "1fr auto 1fr",
              alignItems: "center",
            }}
          >
            {/* Topic — left */}
            <span
              style={{
                fontFamily: "'Syne', sans-serif",
                fontSize: "1rem",
                fontWeight: 700,
                color: B,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {topicLabel}
            </span>

            {/* Q counter — true center */}
            <span
              style={{
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: "0.72rem",
                fontWeight: 600,
                color: "#555",
              }}
            >
              Q {currentQ + 1} of {quiz.question_count}
            </span>

            {/* Timer — right */}
            <span
              style={{
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: "0.88rem",
                fontWeight: 700,
                color: timerCritical ? R : B,
                letterSpacing: "0.04em",
                transition: "color 0.3s",
                textAlign: "right",
              }}
            >
              ⏱ {quiz.timed ? formatTimer(secondsRemaining) : formatTimer(secondsElapsed)}
            </span>
          </div>

          {/* Progress bar — folded into the bottom of the header */}
          <div style={{ height: 4, background: "#e8e8e8" }}>
            <div
              style={{
                height: "100%",
                width: `${progressPercent}%`,
                background: G,
                transition: "width 0.25s",
              }}
            />
          </div>
        </div>

        {/* Scrollable question area */}
        <div style={{ flex: 1, overflowY: "auto", padding: "48px 32px 24px" }}>
          <div style={{ maxWidth: 600, margin: "0 auto" }}>

            {/* Flag button — top right of question zone */}
            <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 12 }}>
              <button
                onClick={toggleFlag}
                style={{
                  background: isFlagged ? AMBER : "transparent",
                  border: `1.5px solid ${isFlagged ? B : "#bbb"}`,
                  color: isFlagged ? B : "#888",
                  fontFamily: "'IBM Plex Mono', monospace",
                  fontSize: "0.68rem",
                  fontWeight: 600,
                  letterSpacing: "0.04em",
                  padding: "5px 12px",
                  cursor: "pointer",
                  transition: "background 0.15s, color 0.15s, border-color 0.15s",
                }}
              >
                ⚑ {isFlagged ? "Flagged" : "Flag"}
              </button>
            </div>

            {/* Question text */}
            <p
              style={{
                fontFamily: "'Syne', sans-serif",
                fontSize: "1.1rem",
                fontWeight: 700,
                color: B,
                margin: "0 0 28px",
                lineHeight: 1.6,
              }}
            >
              {question.question}
            </p>

            {/* Answer options */}
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {question.options.map((opt, oi) => {
                const selected = userAnswers[currentQ] === oi;
                return (
                  <div
                    key={oi}
                    onClick={() => selectAnswer(oi)}
                    onMouseEnter={(e) => {
                      if (!selected && !frozen)
                        e.currentTarget.style.background = "#f7f7f2";
                    }}
                    onMouseLeave={(e) => {
                      if (!selected) e.currentTarget.style.background = W;
                    }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 14,
                      padding: "14px 18px",
                      border: `2px solid ${B}`,
                      background: selected ? G : W,
                      cursor: frozen ? "default" : "pointer",
                      transition: "background 0.1s",
                      userSelect: "none",
                    }}
                  >
                    <span
                      style={{
                        fontFamily: "'IBM Plex Mono', monospace",
                        fontSize: "0.72rem",
                        fontWeight: 700,
                        color: B,
                        flexShrink: 0,
                        width: 16,
                      }}
                    >
                      {String.fromCharCode(65 + oi)}
                    </span>
                    <span
                      style={{
                        fontFamily: "'IBM Plex Mono', monospace",
                        fontSize: "0.78rem",
                        color: B,
                        lineHeight: 1.5,
                      }}
                    >
                      {opt}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Practice mode extras — explanation + take to chat */}
            {isPractice && (
              <div style={{ marginTop: 24 }}>
                {/* Row: explanation toggle (left) + Take to Chat (right) */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: explanationOpen ? 12 : 0,
                  }}
                >
                  {/* Explanation toggle */}
                  {question.explanation ? (
                    <button
                      onClick={() => setExplanationOpen((o) => !o)}
                      style={{
                        background: "none",
                        border: "none",
                        padding: 0,
                        cursor: "pointer",
                        fontFamily: "'IBM Plex Mono', monospace",
                        fontSize: "0.72rem",
                        fontWeight: 600,
                        color: "#555",
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                      }}
                    >
                      <span
                        style={{
                          display: "inline-block",
                          transition: "transform 0.2s",
                          transform: explanationOpen ? "rotate(90deg)" : "rotate(0deg)",
                          fontSize: "0.65rem",
                        }}
                      >
                        ▶
                      </span>
                      {explanationOpen ? "Hide Explanation" : "Show Explanation"}
                    </button>
                  ) : (
                    <span />
                  )}

                  {/* Take to Chat button */}
                  {onTakeToChat && (
                    <button
                      onClick={handleTakeToChat}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.color = B;
                        e.currentTarget.style.borderColor = B;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color = "#555";
                        e.currentTarget.style.borderColor = "#bbb";
                      }}
                      style={{
                        background: "transparent",
                        border: "1.5px solid #bbb",
                        color: "#555",
                        fontFamily: "'IBM Plex Mono', monospace",
                        fontSize: "0.68rem",
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

                {/* Explanation panel */}
                {explanationOpen && question.explanation && (
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
                        color: "#444",
                        margin: 0,
                        lineHeight: 1.7,
                      }}
                    >
                      {question.explanation}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Dot indicators — no border, sits naturally between content and footer */}
        {quiz.question_count > 1 && (
          <div
            style={{
              padding: "14px 32px",
              background: "#f5f5f0",
              display: "flex",
              gap: 8,
              justifyContent: "center",
              flexWrap: "wrap",
              flexShrink: 0,
            }}
          >
            {quiz.questions.map((_, qi) => {
              const isCurrent = qi === currentQ;
              const isAnswered = userAnswers[qi] !== null;
              const isQFlagged = flaggedQuestions.includes(qi);

              // Color: current = green, flagged = amber, answered = black, unanswered = transparent
              const dotBg = isCurrent ? G : isQFlagged ? AMBER : isAnswered ? B : "transparent";
              const dotBorder = isQFlagged && !isCurrent ? AMBER : B;
              const dotOutline = isCurrent && isQFlagged ? `2px solid ${AMBER}` : "none";

              return (
                <div
                  key={qi}
                  onClick={() => setCurrentQ(qi)}
                  title={`Q${qi + 1}${isQFlagged ? " (flagged)" : ""}`}
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: "50%",
                    border: `2px solid ${dotBorder}`,
                    background: dotBg,
                    outline: dotOutline,
                    outlineOffset: 2,
                    cursor: "pointer",
                    flexShrink: 0,
                    transition: "background 0.1s",
                  }}
                />
              );
            })}
          </div>
        )}

        {/* Footer — single row: [← Prev]  [× Exit Quiz]  [Next →] */}
        <div
          style={{
            borderTop: `2px solid ${B}`,
            padding: "16px 32px",
            background: W,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexShrink: 0,
          }}
        >
          <NavButton
            onClick={() => setCurrentQ((q) => q - 1)}
            disabled={currentQ === 0}
          >
            ← Prev
          </NavButton>

          {/* Exit — utility style, centered */}
          <button
            onClick={() => setShowExitConfirm(true)}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = B;
              e.currentTarget.style.borderColor = B;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = "#888";
              e.currentTarget.style.borderColor = "#ccc";
            }}
            style={{
              background: "transparent",
              border: "1.5px solid #ccc",
              color: "#888",
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: "0.68rem",
              fontWeight: 600,
              letterSpacing: "0.04em",
              padding: "8px 20px",
              cursor: "pointer",
              transition: "color 0.15s, border-color 0.15s",
            }}
          >
            × Exit Quiz
          </button>

          {showSubmit ? (
            <NavButton onClick={handleSubmitClick} green>
              Submit Quiz →
            </NavButton>
          ) : (
            <NavButton onClick={() => setCurrentQ((q) => q + 1)}>
              Next Question →
            </NavButton>
          )}
        </div>
      </div>

      {showTimesUp && quiz.time_limit && (
        <TimesUpModal timeLimit={quiz.time_limit} onSeeResults={handleTimesUpResults} />
      )}

      {showUnansweredWarning && (
        <UnansweredModal
          count={unansweredCount}
          onGoBack={() => setShowUnansweredWarning(false)}
          onSubmit={() => {
            setShowUnansweredWarning(false);
            doSubmit();
          }}
        />
      )}

      {showExitConfirm && (
        <ExitConfirmModal
          onKeepGoing={() => setShowExitConfirm(false)}
          onExit={onExit}
        />
      )}
    </>
  );
}
