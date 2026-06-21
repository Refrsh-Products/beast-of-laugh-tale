import type { ReactNode } from "react";
import { cn } from "../../lib/utils";

type Variant = "default" | "primary" | "danger" | "green";

interface ButtonProps {
  variant?: Variant;
  large?: boolean;
  fullWidth?: boolean;
  type?: "button" | "submit";
  onClick?: () => void;
  children: ReactNode;
  disabled?: boolean;
}

const variantClasses: Record<Variant, string> = {
  default: "bg-transparent text-foreground border border-border hover:bg-secondary",
  primary: "bg-secondary text-foreground border border-border hover:bg-secondary/80",
  danger:  "bg-destructive/10 text-destructive border border-destructive/30 hover:bg-destructive/20",
  green:   "bg-primary text-primary-foreground hover:bg-primary/90",
};

export default function Button({
  variant = "default",
  large = false,
  fullWidth = false,
  type = "button",
  onClick,
  children,
  disabled = false,
}: ButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors",
        "focus:outline-none focus:ring-1 focus:ring-ring",
        "disabled:pointer-events-none disabled:opacity-40",
        variantClasses[variant],
        large ? "px-8 py-3 text-base" : "px-4 py-2",
        fullWidth && "w-full",
      )}
    >
      {children}
    </button>
  );
}
