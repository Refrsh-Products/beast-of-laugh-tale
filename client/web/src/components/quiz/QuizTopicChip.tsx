import { cn } from "@/lib/utils";

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
      aria-pressed={selected}
      // Compact chips truncate, so the full topic stays reachable on hover.
      title={compact ? label : undefined}
      className={cn(
        "focus-visible:ring-ring/50 cursor-pointer rounded-full border px-3 py-1 text-xs transition-colors focus-visible:ring-[3px] focus-visible:outline-none",
        selected
          ? "bg-secondary text-secondary-foreground border-transparent font-semibold"
          : "bg-card border-input hover:bg-accent hover:text-accent-foreground",
        compact ? "max-w-32 truncate" : "break-words whitespace-normal",
      )}
    >
      {label}
    </button>
  );
}
