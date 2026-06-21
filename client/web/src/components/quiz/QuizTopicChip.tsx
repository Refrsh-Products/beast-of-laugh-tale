import { cn } from "../../lib/utils";

export default function QuizTopicChip({
  label,
  selected,
  onToggle,
  compact = false,
}: {
  label: string;
  selected: boolean;
  onToggle: () => void;
  compact?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      title={compact ? label : undefined}
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs transition-colors cursor-pointer select-none",
        selected
          ? "border-primary bg-primary/20 text-primary font-medium"
          : "border-border bg-secondary/50 text-muted-foreground hover:border-primary/50 hover:text-foreground",
        compact && "max-w-28 truncate",
      )}
    >
      {label}
    </button>
  );
}
