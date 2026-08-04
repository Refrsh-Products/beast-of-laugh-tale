import type { QuizSession } from "@freshr/shared";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RiDeleteBin6Line } from "@remixicon/react";
import { formatRelativeTime } from "@/lib/formatRelativeTime";
import { SidebarEmpty, SidebarItem, SidebarSection } from "./SidebarSection";

export default function PastQuizzesPanel({
  quizzes,
  selectedQuizId,
  onQuizClick,
  onDeleteSelected,
  disabled = false,
}: {
  quizzes: QuizSession[];
  selectedQuizId: string | null;
  onQuizClick: (quiz: QuizSession) => void;
  onDeleteSelected: (ids: string[]) => void;
  disabled?: boolean;
}) {
  return (
    <SidebarSection title="Past quizzes">
      {quizzes.length === 0 ? (
        <SidebarEmpty>No quizzes yet. Generate one to get started.</SidebarEmpty>
      ) : (
        <ul className="flex flex-col gap-0.5">
          {quizzes.map((quiz) => (
            <li key={quiz.id} className="group/quiz relative">
              <SidebarItem
                active={!!quiz.id && quiz.id === selectedQuizId}
                onClick={() => onQuizClick(quiz)}
                className="flex-col items-start gap-1 pr-8"
              >
                <span className="w-full truncate">
                  {quiz.title || quiz.topic || "Untitled quiz"}
                </span>
                <span className="text-muted-foreground flex items-center gap-2 text-xs font-normal">
                  {typeof quiz.score === "number" && (
                    // score is a 0–1 fraction on the wire, not a percentage.
                    <Badge variant="secondary" className="px-1.5 py-0">
                      {Math.round(quiz.score * 100)}%
                    </Badge>
                  )}
                  {quiz.completed_at
                    ? formatRelativeTime(quiz.completed_at)
                    : quiz.generated_at
                      ? formatRelativeTime(quiz.generated_at)
                      : "Not taken"}
                </span>
              </SidebarItem>

              {quiz.id && (
                <Button
                  variant="ghost"
                  size="icon-xs"
                  disabled={disabled}
                  aria-label={`Delete ${quiz.title || quiz.topic || "quiz"}`}
                  onClick={() => onDeleteSelected([quiz.id as string])}
                  className="absolute top-2 right-1 z-10 opacity-0 focus-visible:opacity-100 group-hover/quiz:opacity-100"
                >
                  <RiDeleteBin6Line aria-hidden="true" />
                </Button>
              )}
            </li>
          ))}
        </ul>
      )}
    </SidebarSection>
  );
}
