import { useCallback } from "react";
import { toast as sonner } from "sonner";

export type ToastVariant = "success" | "danger" | "neutral";

/**
 * Thin adapter over sonner, keeping the `showToast(message, variant)` shape
 * the existing call sites expect.
 *
 * Toasts used to live in per-page React state and render through a
 * ToastContainer, which meant every toast re-rendered its whole page and
 * queueing/stacking was hand-managed. Sonner owns that now; the single
 * <Toaster /> is mounted in App.tsx.
 */
export function useToast() {
  const showToast = useCallback(
    (message: string, variant: ToastVariant = "success") => {
      if (variant === "success") sonner.success(message);
      else if (variant === "danger") sonner.error(message);
      else sonner(message);
    },
    [],
  );

  return { showToast };
}
