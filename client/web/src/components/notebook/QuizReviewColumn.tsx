import { useState } from "react";
import { ChevronRight } from "lucide-react";
import type { QuizSession } from "@freshr/shared";
import { cn } from "../../lib/utils";

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
  const timeLimitMinutes = quiz.time_limit ? Math.round(quiz.time_limit / 60) : null;
  const dateStr = quiz.started_at ?? quiz.generated_at ?? "";
  const topics = quiz.topics ?? (quiz.topic ? [quiz.topic] : []);
  const topicLabel = topics.length > 0 ? topics.join(", ") : "General";
  const questions = quiz.questions ?? [];

  return (
    <div className="flex flex-col h-full bg-background overflow-hidden">
      <div className="h-11 flex items-center px-4 border-b border-border bg-card shrink-0">
        <button
          onClick={onBack}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors hover:underline underline-offset-4"
        >
          ← Back to generator
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-8 py-8">
        <div className="max-w-xl mx-auto">
          <h2 className="text-lg font-semibold text-foreground mb-1">{topicLabel}</h2>

          <div className="flex items-center gap-2 flex-wrap mb-6 text-xs text-muted-foreground">
            <span className="capitalize">{quiz.difficulty}</span>
            <span>·</span>
            <span>{numQuestions} questions</span>
            {timed && timeLimitMinutes && (
              <>
                <span>·</span>
                <span>{timeLimitMinutes} min limit</span>
              </>
            )}
            {dateStr && (
              <>
                <span>·</span>
                <span>{formatDate(dateStr)}</span>
              </>
            )}
          </div>

          {/* Score box */}
          <div className="flex items-center gap-6 rounded-lg border border-border bg-card px-6 py-4 mb-8">
            <span className="text-3xl font-bold text-foreground">{scoreCount}/{numQuestions}</span>
            <div className="w-px h-8 bg-border shrink-0" />
            <span className="text-2xl font-bold text-foreground">{scorePercent}%</span>
          </div>

          {/* Questions */}
          <div className="flex flex-col gap-4">
            {questions.map((q, qi) => {
              const correct = q.is_correct ?? (q.user_answer != null && q.user_answer === q.correct_answer);
              return (
                <div key={q.id} className="rounded-lg border border-border bg-card p-4">
                  <div className="flex items-start gap-2 mb-3">
                    <span className={cn("text-xs font-semibold shrink-0 mt-0.5", correct ? "text-primary" : "text-destructive")}>
                      {correct ? "✓" : "✗"}
                    </span>
                    <p className="text-sm font-medium text-foreground leading-relaxed">
                      Q{qi + 1}. {q.question_text}
                    </p>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    {(q.choices.length > 0 ? q.choices : ["True", "False"]).map((opt: string, oi: number) => {
                      const isUserAnswer = opt === q.user_answer;
                      const isCorrectAnswer = opt === q.correct_answer;

                      let optClass = "border-border/50 text-muted-foreground";
                      let label: string | null = null;

                      if (correct && isUserAnswer) {
                        optClass = "border-primary/50 bg-primary/5 text-foreground";
                        label = "your answer";
                      } else if (!correct && isUserAnswer) {
                        optClass = "border-destructive/50 bg-destructive/5 text-foreground";
                        label = "your answer";
                      } else if (!correct && isCorrectAnswer) {
                        optClass = "border-primary/50 bg-primary/5 text-foreground";
                        label = "correct answer";
                      }

                      return (
                        <div key={oi} className={cn("flex items-center gap-2 px-3 py-1.5 rounded-md border text-xs", optClass)}>
                          <span className="font-semibold shrink-0">{String.fromCharCode(65 + oi)}</span>
                          <span className="flex-1 leading-relaxed">{opt}</span>
                          {label && (
                            <span className={cn("shrink-0 text-xs", !correct && isUserAnswer ? "text-destructive" : "text-primary")}>
                              {label}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {(q.explanation || onTakeToChat) && (
                    <div className="mt-3">
                      <div className="flex items-center justify-between">
                        {q.explanation ? (
                          <button
                            onClick={() => toggleExplanation(qi)}
                            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                          >
                            <ChevronRight
                              className="h-3 w-3 transition-transform duration-150"
                              style={{ transform: openExplanations.has(qi) ? "rotate(90deg)" : "none" }}
                            />
                            {openExplanations.has(qi) ? "Hide explanation" : "Show explanation"}
                          </button>
                        ) : <span />}

                        {onTakeToChat && (
                          <button
                            onClick={() => {
                              const choices = q.choices?.length > 0 ? q.choices : ["True", "False"];
                              onTakeToChat(q.question_text, choices, topicLabel);
                            }}
                            className="text-xs text-muted-foreground hover:text-foreground border border-border rounded px-2.5 py-1 transition-colors hover:bg-secondary"
                          >
                            💬 Take to Chat →
                          </button>
                        )}
                      </div>

                      {openExplanations.has(qi) && q.explanation && (
                        <div className="mt-2 rounded-md border border-primary/30 bg-primary/5 px-4 py-3">
                          <p className="text-xs text-foreground leading-relaxed">{q.explanation}</p>
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

      <div className="border-t border-border px-8 py-4 bg-card flex justify-center shrink-0">
        <button
          onClick={onRetake}
          className="rounded-md bg-primary px-8 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Retake Quiz →
        </button>
      </div>
    </div>
  );
}
