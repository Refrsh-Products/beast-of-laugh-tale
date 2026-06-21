import { cn } from "../../../lib/utils";

export default function NavButton({
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
  return (
    <button
      disabled={disabled}
      onClick={disabled ? undefined : onClick}
      className={cn(
        "w-52 px-8 py-3 rounded-md text-sm font-medium transition-colors whitespace-nowrap",
        disabled
          ? "bg-secondary/50 text-muted-foreground cursor-not-allowed"
          : green
            ? "bg-primary text-primary-foreground hover:bg-primary/90"
            : "bg-secondary text-foreground border border-border hover:bg-secondary/80",
      )}
    >
      {children}
    </button>
  );
}
