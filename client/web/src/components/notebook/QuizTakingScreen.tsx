import { useState, useEffect } from "react";
import type { QuizSession } from "../../hooks/useQuizService.api";
import TimesUpModal from "../quiz/quiz-taking-screen/QuizTakingScreenTimesUpModal";
import UnansweredModal from "../quiz/quiz-taking-screen/QuizTakingScreenUnansweredModal";
import ExitConfirmModal from "../quiz/quiz-taking-screen/QuizTakingScreenExitConfirmModal";
import NavButton from "../quiz/quiz-taking-screen/QuizTakingScreenNavButton";
import MathMarkdown from "../common/MathMarkdown";

const G = "#84e487";
const B = "#000000";
const W = "#FFFFFF";
const R = "#FF4D4D";
const GREY = "#b0b0b0";

// ── Footer nav button (Prev / Next / Submit) ──────────────────────
// Uses React state for hover/press — avoids imperative DOM style mutation
// which causes the "stuck shadow" bug on re-render when navigating questions.

interface QuizTakingScreenProps {
  quiz: QuizSession;
  onComplete: (
    userAnswers: (number | null)[],
    timeTaken: number,
    flaggedQuestions: number[],
  ) => void;
  onExit: () => void;
  onTakeToChat?: (
    questionText: string,
    options: string[],
    topic: string,
  ) => void;
}

export default function QuizTakingScreen({
  quiz,
  onComplete,
  onExit,
  onTakeToChat,
}: QuizTakingScreenProps) {
  const timed = quiz.quiz_type === "TIMED" || quiz.quiz_type === "timed";
  // time_limit is stored in seconds on the server
  const totalSeconds = timed && quiz.time_limit ? quiz.time_limit : 0;
  const isPractice = !timed;
  const numQuestions = quiz.num_questions ?? 0;
  const questions = quiz.questions ?? [];

  const [currentQ, setCurrentQ] = useState(0);
  const [userAnswers, setUserAnswers] = useState<(number | null)[]>(
    Array(numQuestions).fill(null),
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
    if (!timed || totalSeconds === 0) return;
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
  }, [timed, totalSeconds, frozen]);

  // Count-up timer (untimed/practice quizzes)
  useEffect(() => {
    if (timed) return;
    if (frozen) return;
    const interval = setInterval(() => {
      setSecondsElapsed((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [timed, frozen]);

  function formatTimer(secs: number): string {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }

  const answeredCount = userAnswers.filter((a) => a !== null).length;
  const unansweredCount = numQuestions - answeredCount;
  const isLastQuestion = currentQ === numQuestions - 1;
  const allAnswered = answeredCount === numQuestions;
  const showSubmit = isLastQuestion || allAnswered;
  const timerCritical = timed && secondsRemaining < 60 && secondsRemaining > 0;
  const progressPercent = numQuestions > 0 ? (answeredCount / numQuestions) * 100 : 0;

  const topics = quiz.topics ?? (quiz.topic ? [quiz.topic] : []);
  const topicLabel =
    topics.length > 0
      ? topics.slice(0, 2).join(", ") +
        (topics.length > 2 ? ` +${topics.length - 2}` : "")
      : "General";

  const isFlagged = flaggedQuestions.includes(currentQ);

  function toggleFlag() {
    setFlaggedQuestions((prev) =>
      prev.includes(currentQ)
        ? prev.filter((i) => i !== currentQ)
        : [...prev, currentQ],
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
    const timeTaken = timed ? totalSeconds - secondsRemaining : secondsElapsed;
    onComplete(userAnswers, timeTaken, flaggedQuestions);
  }

  function handleTimesUpResults() {
    setShowTimesUp(false);
    onComplete(userAnswers, totalSeconds, flaggedQuestions);
  }

  function handleTakeToChat() {
    if (!onTakeToChat) return;
    const question = questions[currentQ];
    const topic = topics.length > 0 ? topics[0] : "this topic";
    onTakeToChat(question.question_text, displayChoices, topic);
  }

  const question = questions[currentQ];
  const displayChoices =
    question?.choices?.length > 0 ? question.choices : ["True", "False"];

  if (!question) return null;

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
                fontSize: "0.75rem",
                fontWeight: 600,
                color: "#000000",
              }}
            >
              Q {currentQ + 1} of {numQuestions}
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
              ⏱{" "}
              {timed
                ? formatTimer(secondsRemaining)
                : formatTimer(secondsElapsed)}
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
            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                marginBottom: 12,
              }}
            >
              <button
                onClick={toggleFlag}
                style={{
                  background: isFlagged ? GREY : "transparent",
                  border: `1.5px solid ${isFlagged ? B : "#bbb"}`,
                  color: B,
                  fontFamily: "'IBM Plex Mono', monospace",
                  fontSize: "0.75rem",
                  fontWeight: 600,
                  letterSpacing: "0.04em",
                  padding: "5px 12px",
                  cursor: "pointer",
                  transition:
                    "background 0.15s, color 0.15s, border-color 0.15s",
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
              <MathMarkdown>{question.question_text}</MathMarkdown>
            </p>

            {/* Answer options */}
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {displayChoices.map((opt: string, oi: number) => {
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
                        fontSize: "0.75rem",
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
                      <MathMarkdown>{opt}</MathMarkdown>
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
                          transform: explanationOpen
                            ? "rotate(90deg)"
                            : "rotate(0deg)",
                          fontSize: "0.75rem",
                        }}
                      >
                        ▶
                      </span>
                      {explanationOpen
                        ? "Hide Explanation"
                        : "Show Explanation"}
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
                        color: "#000000",
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

        {/* Question navigator */}
        {numQuestions > 1 && (
          <div
            style={{
              padding: "12px 32px",
              background: "#f5f5f0",
              display: "flex",
              gap: 6,
              justifyContent: "center",
              flexWrap: "wrap",
              flexShrink: 0,
            }}
          >
            {questions.map((_: unknown, qi: number) => {
              const isCurrent = qi === currentQ;
              const isAnswered = userAnswers[qi] !== null;
              const isQFlagged = flaggedQuestions.includes(qi);

              const bg = isCurrent ? G : isQFlagged ? GREY : isAnswered ? B : W;
              const numberColor = isAnswered && !isCurrent ? W : B;

              return (
                <div
                  key={qi}
                  onClick={() => setCurrentQ(qi)}
                  title={`Q${qi + 1}${isQFlagged ? " (flagged)" : ""}`}
                  style={{
                    width: 32,
                    height: 32,
                    border: `2px solid ${B}`,
                    background: bg,
                    cursor: "pointer",
                    flexShrink: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontFamily: "'IBM Plex Mono', monospace",
                    fontSize: "0.75rem",
                    fontWeight: 700,
                    color: numberColor,
                    transition: "background 0.1s",
                    userSelect: "none",
                  }}
                >
                  {qi + 1}
                </div>
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
              e.currentTarget.style.color = "#000000";
              e.currentTarget.style.borderColor = "#ccc";
            }}
            style={{
              background: "transparent",
              border: "1.5px solid #ccc",
              color: "#000000",
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: "0.75rem",
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
        <TimesUpModal
          timeLimit={Math.round(quiz.time_limit / 60)}
          onSeeResults={handleTimesUpResults}
        />
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
