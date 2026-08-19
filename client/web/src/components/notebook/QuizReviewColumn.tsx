import { useState } from "react";
import type { QuizSession } from "@freshr/shared";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import {
  RiArrowLeftLine,
  RiArrowRightLine,
  RiCheckLine,
  RiCloseLine,
  RiFilterLine,
  RiQuestionAnswerLine,
  RiRefreshLine,
} from "@remixicon/react";

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
  onTakeToChat?: (
    questionText: string,
    options: string[],
    topic: string,
  ) => void;
}

export default function QuizReviewColumn({
  quiz,
  onBack,
  onRetake,
  onTakeToChat,
}: QuizReviewColumnProps) {
  const [openExplanations, setOpenExplanations] = useState<Set<number>>(
    new Set(),
  );
  const [showOnlyWrong, setShowOnlyWrong] = useState(false);

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
  // Decorate with correctness + original index so numbering ("Q3") stays stable
  // when the list is filtered to only-incorrect.
  const decoratedQuestions = questions.map((q, index) => ({
    q,
    index,
    correct:
      q.is_correct ??
      (q.user_answer != null && q.user_answer === q.correct_answer),
  }));
  const wrongCount = decoratedQuestions.filter((d) => !d.correct).length;
  const visibleQuestions = showOnlyWrong
    ? decoratedQuestions.filter((d) => !d.correct)
    : decoratedQuestions;

  const meta = [
    quiz.difficulty,
    `${numQuestions} questions`,
    timed && timeLimitMinutes ? `${timeLimitMinutes} min limit` : null,
    dateStr ? formatDate(dateStr) : null,
  ].filter(Boolean);

  return (
    <div className="bg-background flex h-full flex-col overflow-hidden">
      {/* Header */}
      <div className="border-border bg-card flex h-11 shrink-0 items-center border-b px-2">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <RiArrowLeftLine aria-hidden="true" />
          Back to generator
        </Button>
        {wrongCount > 0 && (
          <Button
            variant={showOnlyWrong ? "secondary" : "ghost"}
            size="sm"
            className="ml-auto"
            aria-pressed={showOnlyWrong}
            onClick={() => setShowOnlyWrong((prev) => !prev)}
          >
            <RiFilterLine aria-hidden="true" />
            {showOnlyWrong ? "Show all" : `Only incorrect (${wrongCount})`}
          </Button>
        )}
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto px-4 pt-8 pb-6 sm:px-8">
        <div className="mx-auto max-w-2xl">
          <h2 className="font-heading text-foreground mb-1.5 text-2xl leading-tight font-bold">
            {topicLabel}
          </h2>

          {/* Meta row */}
          <div className="text-muted-foreground mb-7 flex flex-wrap items-center gap-2 text-xs">
            {meta.map((item, i) => (
              <span key={i} className="flex items-center gap-2">
                {i > 0 && <span aria-hidden="true">·</span>}
                <span className="first-letter:capitalize">{item}</span>
              </span>
            ))}
          </div>

          {/* Score */}
          <div className="border-border bg-card mb-9 flex items-center gap-6 rounded-3xl border p-6">
            <span className="font-heading text-foreground text-4xl leading-none font-bold tabular-nums">
              {scoreCount}/{numQuestions}
            </span>
            <Separator orientation="vertical" className="h-10" />
            <span className="font-heading text-muted-foreground text-2xl leading-none font-bold tabular-nums">
              {scorePercent}%
            </span>
          </div>

          {/* Questions */}
          <div className="flex flex-col gap-6">
            {visibleQuestions.map(({ q, index: qi, correct }) => {
              const explanationOpen = openExplanations.has(qi);

              return (
                <div
                  key={q.id}
                  className="border-border bg-card rounded-3xl border p-5"
                >
                  {/* Question header */}
                  <div className="mb-3.5 flex items-start gap-2.5">
                    <span
                      className={cn(
                        "mt-0.5 shrink-0",
                        correct ? "text-success" : "text-destructive",
                      )}
                    >
                      {correct ? (
                        <RiCheckLine className="size-4" aria-label="Correct" />
                      ) : (
                        <RiCloseLine
                          className="size-4"
                          aria-label="Incorrect"
                        />
                      )}
                    </span>
                    <p className="text-foreground text-sm leading-relaxed font-medium">
                      Q{qi + 1}. {q.question_text}
                    </p>
                  </div>

                  {/* Options */}
                  <div className="flex flex-col gap-1.5">
                    {(q.choices.length > 0 ? q.choices : ["True", "False"]).map(
                      (opt: string, oi: number) => {
                        const isUserAnswer = opt === q.user_answer;
                        const isCorrectAnswer = opt === q.correct_answer;
                        const wrongPick = !correct && isUserAnswer;
                        const rightAnswer =
                          (correct && isUserAnswer) ||
                          (!correct && isCorrectAnswer);

                        const label = wrongPick
                          ? "your answer"
                          : correct && isUserAnswer
                            ? "your answer"
                            : !correct && isCorrectAnswer
                              ? "correct answer"
                              : null;

                        return (
                          <div
                            key={oi}
                            className={cn(
                              "flex items-center gap-2.5 rounded-xl border px-2.5 py-1.5 text-xs",
                              wrongPick &&
                                "border-destructive bg-destructive/10 text-foreground",
                              rightAnswer &&
                                "border-success bg-success/10 text-foreground",
                              !wrongPick &&
                                !rightAnswer &&
                                "border-border text-muted-foreground",
                            )}
                          >
                            <span className="shrink-0 font-bold">
                              {String.fromCharCode(65 + oi)}
                            </span>
                            <span className="flex-1 leading-relaxed">
                              {opt}
                            </span>
                            {label && (
                              <span
                                className={cn(
                                  "shrink-0 font-medium",
                                  wrongPick
                                    ? "text-destructive"
                                    : "text-success",
                                )}
                              >
                                {label}
                              </span>
                            )}
                          </div>
                        );
                      },
                    )}
                  </div>

                  {/* Explanation + Take to Chat */}
                  {(q.explanation || onTakeToChat) && (
                    <div className="mt-3.5">
                      <div className="flex items-center justify-between gap-3">
                        {q.explanation ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            aria-expanded={explanationOpen}
                            onClick={() => toggleExplanation(qi)}
                          >
                            <RiArrowRightLine
                              aria-hidden="true"
                              className={cn(
                                "transition-transform",
                                explanationOpen && "rotate-90",
                              )}
                            />
                            {explanationOpen
                              ? "Hide explanation"
                              : "Show explanation"}
                          </Button>
                        ) : (
                          <span />
                        )}

                        {onTakeToChat && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const choices =
                                q.choices?.length > 0
                                  ? q.choices
                                  : ["True", "False"];
                              onTakeToChat(
                                q.question_text,
                                choices,
                                topicLabel,
                              );
                            }}
                          >
                            <RiQuestionAnswerLine aria-hidden="true" />
                            Take to chat
                          </Button>
                        )}
                      </div>

                      {explanationOpen && q.explanation && (
                        <div className="border-border bg-muted text-foreground mt-2.5 rounded-2xl border px-4 py-3.5">
                          <p className="text-sm leading-relaxed">
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

      {/* Bottom bar — Retake */}
      <div className="border-border bg-card flex shrink-0 justify-center border-t px-4 py-4">
        <Button size="lg" onClick={onRetake}>
          <RiRefreshLine aria-hidden="true" />
          Retake quiz
        </Button>
      </div>
    </div>
  );
}
