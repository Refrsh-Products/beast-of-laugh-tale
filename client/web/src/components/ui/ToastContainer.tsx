import { createPortal } from "react-dom";
import type { Toast } from "../../hooks/useToast";

const B = "#000000";
const W = "#FFFFFF";
const G = "#84e487";
const R = "#FF4D4D";

interface ToastContainerProps {
  toasts: Toast[];
}

export default function ToastContainer({ toasts }: ToastContainerProps) {
  if (toasts.length === 0) return null;

  return createPortal(
    <div
      style={{
        position: "fixed",
        bottom: 24,
        left: "50%",
        transform: "translateX(-50%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 10,
        zIndex: 2000,
      }}
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          style={{
            background:
              toast.variant === "danger"
                ? R
                : toast.variant === "success"
                  ? G
                  : W,
            color: B,
            border: `2px solid ${B}`,
            boxShadow: `4px 4px 0 ${B}`,
            padding: "12px 52px",
            fontFamily: "'IBM Plex Mono', monospace",
            fontWeight: 700,
            fontSize: "0.82rem",
            letterSpacing: "0.04em",
            whiteSpace: "nowrap",
          }}
        >
          {toast.message}
        </div>
      ))}
    </div>,
    document.body,
  );
}
