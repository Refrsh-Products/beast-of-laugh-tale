import type { QuizSession } from "@freshr/shared";
import { Badge } from "../ui/badge";
import { cn } from "../../lib/utils";

function timeAgo(isoDate: string): string {
  if (!isoDate) return "";
  const diff = Date.now() - new Date(isoDate).getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  const weeks = Math.floor(days / 7);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return `${weeks}w ago`;
}

export default function QuizCard({
  quiz,
  selected,
  onClick,
  bulkMode = false,
  bulkSelected = false,
  onToggleSelect,
}: {
  quiz: QuizSession;
  selected: boolean;
  onClick: () => void;
  bulkMode?: boolean;
  bulkSelected?: boolean;
  onToggleSelect?: (id: string) => void;
}) {
  const topics = quiz.topics ?? (quiz.topic ? [quiz.topic] : []);
  const topicLabel =
    topics.length > 0
      ? topics.slice(0, 2).join(", ") + (topics.length > 2 ? ` +${topics.length - 2}` : "")
      : "General";

  const numQuestions = quiz.num_questions ?? 0;
  const scoreCount = Math.round((quiz.score ?? 0) * numQuestions);
  const timed = quiz.quiz_type === "TIMED" || quiz.quiz_type === "timed";
  const timeLimitMinutes = quiz.time_limit ? Math.round(quiz.time_limit / 60) : null;
  const dateStr = quiz.started_at ?? quiz.generated_at ?? "";

  function handleClick() {
    if (bulkMode) onToggleSelect?.(quiz.id!);
    else onClick();
  }

  return (
    <div
      onClick={handleClick}
      className={cn(
        "px-3 py-3 border-b border-border border-l-2 cursor-pointer transition-colors select-none",
        bulkSelected
          ? "border-l-destructive bg-destructive/5"
          : selected
            ? "border-l-primary bg-primary/5"
            : "border-l-primary hover:bg-secondary/50",
      )}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <p className="text-xs font-medium text-foreground truncate flex-1">{topicLabel}</p>
        <Badge variant="outline" className="shrink-0 font-medium">
          {scoreCount}/{numQuestions}
        </Badge>
      </div>

      <div className="flex items-center gap-1.5 flex-wrap text-xs text-muted-foreground">
        <span>{timeAgo(dateStr)}</span>
        <span>·</span>
        <span className="capitalize">{quiz.difficulty}</span>
        <span>·</span>
        <span>{numQuestions}q</span>
        {timed && timeLimitMinutes && (
          <>
            <span>·</span>
            <span>{timeLimitMinutes}min</span>
          </>
        )}
      </div>

      {bulkMode && (
        <div className="flex justify-end mt-2">
          <input
            type="checkbox"
            checked={bulkSelected}
            onChange={() => onToggleSelect?.(quiz.id!)}
            onClick={(e) => e.stopPropagation()}
            className="cursor-pointer accent-destructive w-3.5 h-3.5"
          />
        </div>
      )}
    </div>
  );
}
