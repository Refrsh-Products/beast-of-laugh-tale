import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Compatibility adapter over the shadcn Button.
 *
 * The hand-rolled button this replaces had its own inline-styled neo-brutalist
 * look and a `variant` vocabulary that predates the design tokens. Rather than
 * touch its ~20 call sites in one commit, this keeps the old prop shape and
 * forwards to the real Button, so every screen picks up the brand styling
 * immediately and can be moved to `<Button>` directly as it is redesigned.
 *
 * Delete this file once no imports of it remain.
 */

type LegacyVariant = "default" | "primary" | "danger" | "green";

/**
 * `primary` was black-on-white with a green shadow and `green` was the mint
 * fill — under the brand palette both are just the primary action, so they
 * collapse onto one variant. `default` was the low-emphasis white button,
 * which is `outline`.
 */
const VARIANT_MAP: Record<
  LegacyVariant,
  "default" | "outline" | "destructive"
> = {
  default: "outline",
  primary: "default",
  green: "default",
  danger: "destructive",
};

interface LegacyButtonProps {
  variant?: LegacyVariant;
  large?: boolean;
  fullWidth?: boolean;
  type?: "button" | "submit";
  onClick?: () => void;
  children: ReactNode;
  disabled?: boolean;
}

export default function LegacyButton({
  variant = "default",
  large = false,
  fullWidth = false,
  type = "button",
  onClick,
  children,
  disabled = false,
}: LegacyButtonProps) {
  return (
    <Button
      type={type}
      variant={VARIANT_MAP[variant]}
      size={large ? "lg" : "default"}
      onClick={onClick}
      disabled={disabled}
      className={cn(fullWidth && "w-full")}
    >
      {children}
    </Button>
  );
}
