import { useState, useCallback } from "react";

export type ToastVariant = "success" | "danger" | "neutral";

export interface Toast {
  id: number;
  message: string;
  variant: ToastVariant;
}

let nextId = 0;

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback(
    (message: string, variant: ToastVariant = "success") => {
      const id = nextId++;
      setToasts((prev) => {
        const trimmed = prev.length >= 3 ? prev.slice(1) : prev;
        return [...trimmed, { id, message, variant }];
      });
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 3000);
    },
    [],
  );

  return { toasts, showToast };
}
