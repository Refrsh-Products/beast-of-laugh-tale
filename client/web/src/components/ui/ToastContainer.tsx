import { createPortal } from "react-dom";
import { cn } from "../../lib/utils";
import type { Toast } from "../../hooks/useToast";

interface ToastContainerProps {
  toasts: Toast[];
}

export default function ToastContainer({ toasts }: ToastContainerProps) {
  if (toasts.length === 0) return null;

  return createPortal(
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2.5 z-[2000]">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={cn(
            "px-5 py-3 rounded-md border text-sm font-medium whitespace-nowrap shadow-lg",
            toast.variant === "danger"
              ? "bg-destructive/10 border-destructive/30 text-destructive"
              : toast.variant === "success"
                ? "bg-primary/10 border-primary/30 text-primary"
                : "bg-card border-border text-foreground",
          )}
        >
          {toast.message}
        </div>
      ))}
    </div>,
    document.body,
  );
}
