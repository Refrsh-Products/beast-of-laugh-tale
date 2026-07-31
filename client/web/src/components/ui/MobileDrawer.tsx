import type { ReactNode } from "react";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { VisuallyHidden } from "radix-ui";

/**
 * Compatibility adapter over the shadcn Sheet.
 *
 * The hand-rolled drawer managed its own body-scroll lock, Escape handler and
 * backdrop, and set role="dialog" without ever trapping focus — so keyboard
 * users could tab out of an open drawer into the page behind it. Radix's
 * Dialog (which Sheet wraps) handles all of that properly.
 *
 * The prop shape is unchanged so the existing call sites keep working.
 */

interface MobileDrawerProps {
  open: boolean;
  onClose: () => void;
  side?: "left" | "right";
  width?: number | string;
  children: ReactNode;
  ariaLabel?: string;
}

export default function MobileDrawer({
  open,
  onClose,
  side = "left",
  width = "min(280px, 85vw)",
  children,
  ariaLabel = "Navigation drawer",
}: MobileDrawerProps) {
  return (
    <Sheet open={open} onOpenChange={(next) => !next && onClose()}>
      <SheetContent
        side={side}
        // Callers pass an arbitrary width, including responsive min()
        // expressions, so there is no utility class that can express it.
        // eslint-disable-next-line no-restricted-syntax -- runtime-computed width, not styling
        style={{ width, maxWidth: "100%" }}
        className="overflow-y-auto p-0"
      >
        {/* Radix requires a title for the dialog's accessible name; the
            drawers render their own headers, so it is visually hidden. */}
        <VisuallyHidden.Root asChild>
          <SheetTitle>{ariaLabel}</SheetTitle>
        </VisuallyHidden.Root>
        {children}
      </SheetContent>
    </Sheet>
  );
}
