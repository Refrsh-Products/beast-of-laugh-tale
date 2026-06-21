import { useState, useEffect } from "react";
import type { QuizSession } from "@freshr/shared";
import { ChevronRight } from "lucide-react";
import TimesUpModal from "../quiz/quiz-taking-screen/QuizTakingScreenTimesUpModal";
import UnansweredModal from "../quiz/quiz-taking-screen/QuizTakingScreenUnansweredModal";
import ExitConfirmModal from "../quiz/quiz-taking-screen/QuizTakingScreenExitConfirmModal";
import NavButton from "../quiz/quiz-taking-screen/QuizTakingScreenNavButton";
import MathMarkdown from "../common/MathMarkdown";
import { cn } from "../../lib/utils";

interface QuizTakingScreenProps {
  quiz: QuizSession;
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
  const timed = quiz.quiz_type === "TIMED" || quiz.quiz_type === "timed";
  // time_limit is stored in seconds on the server
  const totalSeconds = timed && quiz.time_limit ? quiz.time_limit : 0;
  const isPractice = !timed;
  const numQuestions = quiz.num_questions ?? 0;
  const questions = quiz.questions ?? [];

  const [currentQ, setCurrentQ] = useState(0);
  const [userAnswers, setUserAnswers] = useState<(number | null)[]>(Array(numQuestions).fill(null));
  const [flaggedQuestions, setFlaggedQuestions] = useState<number[]>([]);
  const [secondsRemaining, setSecondsRemaining] = useState(totalSeconds);
  const [secondsElapsed, setSecondsElapsed] = useState(0);
  const [frozen, setFrozen] = useState(false);
  const [showTimesUp, setShowTimesUp] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [showUnansweredWarning, setShowUnansweredWarning] = useState(false);
  const [explanationOpen, setExplanationOpen] = useState(false);

  // Reset explanation panel when navigating to a different question
  useEffect(() => { setExplanationOpen(false); }, [currentQ]);

  // Countdown timer (timed quizzes)
  useEffect(() => {
    if (!timed || totalSeconds === 0) return;
    if (frozen) return;
    const interval = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) { clearInterval(interval); setFrozen(true); setShowTimesUp(true); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [timed, totalSeconds, frozen]);

  // Count-up timer (untimed/practice quizzes)
  useEffect(() => {
    if (timed || frozen) return;
    const interval = setInterval(() => { setSecondsElapsed((prev) => prev + 1); }, 1000);
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
      ? topics.slice(0, 2).join(", ") + (topics.length > 2 ? ` +${topics.length - 2}` : "")
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
    if (unansweredCount > 0) setShowUnansweredWarning(true);
    else doSubmit();
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
  const displayChoices = question?.choices?.length > 0 ? question.choices : ["True", "False"];

  if (!question) return null;

  return (
    <>
      <div className="fixed inset-0 z-[3000] bg-background flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-card border-b border-border shrink-0">
          <div
            className="grid grid-cols-[1fr_auto_1fr] items-center px-8 h-13"
          >
            <span className="text-sm font-semibold text-foreground truncate">{topicLabel}</span>
            <span className="text-xs text-muted-foreground font-medium">Q {currentQ + 1} of {numQuestions}</span>
            <span className={cn("text-sm font-semibold text-right", timerCritical ? "text-destructive" : "text-foreground")}>
              ⏱ {timed ? formatTimer(secondsRemaining) : formatTimer(secondsElapsed)}
            </span>
          </div>
          {/* Progress bar */}
          <div className="h-1 bg-border">
            <div
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Question area */}
        <div className="flex-1 overflow-y-auto px-8 py-12">
          <div className="max-w-xl mx-auto">
            <div className="flex justify-end mb-3">
              <button
                onClick={toggleFlag}
                className={cn(
                  "text-xs font-medium px-3 py-1.5 rounded-md border transition-colors",
                  isFlagged
                    ? "bg-secondary text-foreground border-border"
                    : "text-muted-foreground border-border hover:text-foreground hover:bg-secondary",
                )}
              >
                ⚑ {isFlagged ? "Flagged" : "Flag"}
              </button>
            </div>

            <div className="text-base font-medium text-foreground mb-7 leading-relaxed">
              <MathMarkdown>{question.question_text}</MathMarkdown>
            </div>

            <div className="flex flex-col gap-3">
              {displayChoices.map((opt: string, oi: number) => {
                const selected = userAnswers[currentQ] === oi;
                return (
                  <div
                    key={oi}
                    onClick={() => selectAnswer(oi)}
                    className={cn(
                      "flex items-center gap-4 px-5 py-3.5 rounded-lg border transition-colors select-none",
                      frozen ? "cursor-default" : "cursor-pointer",
                      selected
                        ? "border-primary bg-primary/10"
                        : "border-border hover:border-border/60 hover:bg-secondary/30",
                    )}
                  >
                    <span className="text-xs font-semibold text-muted-foreground w-4 shrink-0">
                      {String.fromCharCode(65 + oi)}
                    </span>
                    <span className="text-sm text-foreground leading-relaxed">
                      <MathMarkdown>{opt}</MathMarkdown>
                    </span>
                  </div>
                );
              })}
            </div>

            {isPractice && (
              <div className="mt-6">
                <div className="flex items-center justify-between">
                  {question.explanation ? (
                    <button
                      onClick={() => setExplanationOpen((o) => !o)}
                      className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <ChevronRight
                        className="h-3 w-3 transition-transform duration-150"
                        style={{ transform: explanationOpen ? "rotate(90deg)" : "none" }}
                      />
                      {explanationOpen ? "Hide Explanation" : "Show Explanation"}
                    </button>
                  ) : <span />}

                  {onTakeToChat && (
                    <button
                      onClick={handleTakeToChat}
                      className="text-xs text-muted-foreground hover:text-foreground border border-border rounded px-3 py-1.5 transition-colors hover:bg-secondary"
                    >
                      💬 Take to Chat →
                    </button>
                  )}
                </div>

                {explanationOpen && question.explanation && (
                  <div className="mt-3 rounded-lg border border-primary/30 bg-primary/5 px-4 py-3">
                    <p className="text-sm text-foreground leading-relaxed">{question.explanation}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Question navigator */}
        {numQuestions > 1 && (
          <div className="px-8 py-3 bg-secondary/20 flex flex-wrap gap-1.5 justify-center shrink-0">
            {questions.map((_: unknown, qi: number) => {
              const isCurrent = qi === currentQ;
              const isAnswered = userAnswers[qi] !== null;
              const isQFlagged = flaggedQuestions.includes(qi);

              return (
                <button
                  key={qi}
                  onClick={() => setCurrentQ(qi)}
                  title={`Q${qi + 1}${isQFlagged ? " (flagged)" : ""}`}
                  className={cn(
                    "h-8 w-8 rounded-md text-xs font-medium transition-colors shrink-0",
                    isCurrent
                      ? "bg-primary text-primary-foreground"
                      : isQFlagged
                        ? "bg-secondary text-muted-foreground border border-border"
                        : isAnswered
                          ? "bg-foreground text-background"
                          : "bg-secondary/50 text-muted-foreground border border-border hover:bg-secondary",
                  )}
                >
                  {qi + 1}
                </button>
              );
            })}
          </div>
        )}

        {/* Footer */}
        <div className="border-t border-border px-8 py-4 bg-card flex items-center justify-between shrink-0">
          <NavButton onClick={() => setCurrentQ((q) => q - 1)} disabled={currentQ === 0}>
            ← Prev
          </NavButton>

          <button
            onClick={() => setShowExitConfirm(true)}
            className="text-xs text-muted-foreground hover:text-foreground border border-border rounded-md px-4 py-2 transition-colors hover:bg-secondary"
          >
            × Exit Quiz
          </button>

          {showSubmit ? (
            <NavButton onClick={handleSubmitClick} green>Submit Quiz →</NavButton>
          ) : (
            <NavButton onClick={() => setCurrentQ((q) => q + 1)}>Next Question →</NavButton>
          )}
        </div>
      </div>

      {showTimesUp && quiz.time_limit && (
        <TimesUpModal timeLimit={Math.round(quiz.time_limit / 60)} onSeeResults={handleTimesUpResults} />
      )}
      {showUnansweredWarning && (
        <UnansweredModal
          count={unansweredCount}
          onGoBack={() => setShowUnansweredWarning(false)}
          onSubmit={() => { setShowUnansweredWarning(false); doSubmit(); }}
        />
      )}
      {showExitConfirm && (
        <ExitConfirmModal onKeepGoing={() => setShowExitConfirm(false)} onExit={onExit} />
      )}
    </>
  );
}
