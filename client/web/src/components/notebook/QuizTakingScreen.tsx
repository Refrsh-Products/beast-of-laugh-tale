import { useState, useEffect } from "react";
import type { QuizSession } from "@freshr/shared";
import TimesUpModal from "../quiz/quiz-taking-screen/QuizTakingScreenTimesUpModal";
import UnansweredModal from "../quiz/quiz-taking-screen/QuizTakingScreenUnansweredModal";
import ExitConfirmModal from "../quiz/quiz-taking-screen/QuizTakingScreenExitConfirmModal";
import NavButton from "../quiz/quiz-taking-screen/QuizTakingScreenNavButton";
import MathMarkdown from "../common/MathMarkdown";
import type { Components } from "react-markdown";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import {
  RiArrowLeftLine,
  RiArrowRightLine,
  RiCloseLine,
  RiFlag2Fill,
  RiFlag2Line,
  RiQuestionAnswerLine,
  RiTimeLine,
} from "@remixicon/react";

/**
 * Renders markdown without its wrapping paragraph.
 *
 * The answer options are <button>s, which may only contain phrasing content —
 * react-markdown's default <p> is invalid there and would break under SSR.
 */
const INLINE_MARKDOWN: Components = {
  p: ({ children }) => <>{children}</>,
};

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
  const progressPercent =
    numQuestions > 0 ? (answeredCount / numQuestions) * 100 : 0;

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
      {/* z-40 puts this above page content (which tops out at z-10) but below
          the z-50 portal layer Radix renders dialogs, drawers and menus into —
          the confirm modals below are portalled to <body> and would otherwise
          paint behind this overlay. */}
      <div className="bg-background fixed inset-0 z-40 flex flex-col overflow-hidden">
        {/* Header — 3-column grid: topic left | Q counter center | timer right */}
        <div className="bg-card border-border shrink-0 border-b">
          <div className="grid h-13 grid-cols-[1fr_auto_1fr] items-center gap-3 px-4 sm:px-8">
            <span className="font-heading text-foreground truncate text-base font-semibold">
              {topicLabel}
            </span>

            {/* Q counter — true center */}
            <span className="text-muted-foreground text-xs font-medium tabular-nums">
              Q {currentQ + 1} of {numQuestions}
            </span>

            {/* Timer — right */}
            <span
              className={cn(
                "flex items-center justify-end gap-1.5 text-sm font-semibold tabular-nums transition-colors",
                timerCritical ? "text-destructive" : "text-foreground",
              )}
            >
              <RiTimeLine className="size-4" aria-hidden="true" />
              {timed
                ? formatTimer(secondsRemaining)
                : formatTimer(secondsElapsed)}
            </span>
          </div>

          {/* Progress — folded into the bottom of the header */}
          <Progress
            value={progressPercent}
            aria-label="Questions answered"
            className="h-1 rounded-none"
          />
        </div>

        {/* Scrollable question area */}
        <div className="flex-1 overflow-y-auto px-4 pt-10 pb-6 sm:px-8">
          <div className="mx-auto max-w-2xl">
            {/* Flag — top right of question zone */}
            <div className="mb-3 flex justify-end">
              <Button
                variant={isFlagged ? "secondary" : "outline"}
                size="sm"
                aria-pressed={isFlagged}
                onClick={toggleFlag}
              >
                {isFlagged ? (
                  <RiFlag2Fill aria-hidden="true" />
                ) : (
                  <RiFlag2Line aria-hidden="true" />
                )}
                {isFlagged ? "Flagged" : "Flag"}
              </Button>
            </div>

            {/* Question text */}
            <div className="font-heading text-foreground mb-7 text-lg leading-relaxed font-semibold">
              <MathMarkdown>{question.question_text}</MathMarkdown>
            </div>

            {/* Answer options */}
            <div className="flex flex-col gap-2.5">
              {displayChoices.map((opt: string, oi: number) => {
                const selected = userAnswers[currentQ] === oi;
                return (
                  <button
                    key={oi}
                    type="button"
                    aria-pressed={selected}
                    disabled={frozen}
                    onClick={() => selectAnswer(oi)}
                    className={cn(
                      "focus-visible:ring-ring/50 flex items-center gap-3.5 rounded-2xl border-2 px-4 py-3.5 text-left transition-colors focus-visible:ring-[3px] focus-visible:outline-none",
                      selected
                        ? "border-primary bg-accent text-accent-foreground"
                        : "border-border bg-card text-foreground",
                      frozen ? "cursor-default" : "hover:border-input",
                    )}
                  >
                    <span className="w-4 shrink-0 text-sm font-bold">
                      {String.fromCharCode(65 + oi)}
                    </span>
                    <span className="text-sm leading-relaxed">
                      <MathMarkdown components={INLINE_MARKDOWN}>{opt}</MathMarkdown>
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Practice mode extras — explanation + take to chat */}
            {isPractice && (
              <div className="mt-6">
                <div className="flex items-center justify-between gap-3">
                  {question.explanation ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      aria-expanded={explanationOpen}
                      onClick={() => setExplanationOpen((o) => !o)}
                    >
                      <RiArrowRightLine
                        aria-hidden="true"
                        className={cn(
                          "transition-transform",
                          explanationOpen && "rotate-90",
                        )}
                      />
                      {explanationOpen ? "Hide explanation" : "Show explanation"}
                    </Button>
                  ) : (
                    <span />
                  )}

                  {onTakeToChat && (
                    <Button variant="outline" size="sm" onClick={handleTakeToChat}>
                      <RiQuestionAnswerLine aria-hidden="true" />
                      Take to chat
                    </Button>
                  )}
                </div>

                {explanationOpen && question.explanation && (
                  <div className="border-primary bg-accent text-accent-foreground mt-3 rounded-2xl border-2 px-4 py-3.5">
                    <p className="text-sm leading-relaxed">
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
          <div className="flex shrink-0 flex-wrap justify-center gap-1.5 px-4 py-3 sm:px-8">
            {questions.map((_: unknown, qi: number) => {
              const isCurrent = qi === currentQ;
              const isAnswered = userAnswers[qi] !== null;
              const isQFlagged = flaggedQuestions.includes(qi);

              return (
                <button
                  key={qi}
                  type="button"
                  onClick={() => setCurrentQ(qi)}
                  aria-current={isCurrent}
                  aria-label={`Question ${qi + 1}${
                    isQFlagged ? " (flagged)" : ""
                  }${isAnswered ? " (answered)" : ""}`}
                  className={cn(
                    "focus-visible:ring-ring/50 size-8 shrink-0 rounded-lg border-2 text-xs font-bold tabular-nums transition-colors focus-visible:ring-[3px] focus-visible:outline-none",
                    isCurrent
                      ? "border-primary bg-primary text-primary-foreground"
                      : isQFlagged
                        ? "border-input bg-muted text-muted-foreground"
                        : isAnswered
                          ? "border-primary bg-accent text-accent-foreground"
                          : "border-border bg-card text-muted-foreground",
                  )}
                >
                  {qi + 1}
                </button>
              );
            })}
          </div>
        )}

        {/* Footer — [← Prev]  [× Exit Quiz]  [Next →] */}
        <div className="border-border bg-card flex shrink-0 items-center justify-between gap-3 border-t px-4 py-4 sm:px-8">
          <NavButton
            onClick={() => setCurrentQ((q) => q - 1)}
            disabled={currentQ === 0}
          >
            <RiArrowLeftLine aria-hidden="true" />
            Prev
          </NavButton>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowExitConfirm(true)}
          >
            <RiCloseLine aria-hidden="true" />
            <span className="hidden sm:inline">Exit quiz</span>
          </Button>

          {showSubmit ? (
            <NavButton onClick={handleSubmitClick} green>
              Submit quiz
              <RiArrowRightLine aria-hidden="true" />
            </NavButton>
          ) : (
            <NavButton onClick={() => setCurrentQ((q) => q + 1)}>
              <span className="truncate">Next question</span>
              <RiArrowRightLine aria-hidden="true" />
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
