import { useEffect, type ReactNode } from "react";
import { BLACK, WHITE } from "../../constants/theme";

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
  // Body-scroll lock + ESC to close
  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);

    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  const isLeft = side === "left";

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1100,
        display: "flex",
        flexDirection: isLeft ? "row" : "row-reverse",
      }}
      role="dialog"
      aria-modal="true"
      aria-label={ariaLabel}
    >
      {/* Panel */}
      <div
        style={{
          width,
          maxWidth: "100%",
          height: "100dvh",
          background: WHITE,
          borderRight: isLeft ? `3px solid ${BLACK}` : "none",
          borderLeft: !isLeft ? `3px solid ${BLACK}` : "none",
          overflowY: "auto",
          animation: `${isLeft ? "drawer-slide-in-left" : "drawer-slide-in-right"} 0.18s ease-out`,
          flexShrink: 0,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>

      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          flex: 1,
          background: "rgba(0,0,0,0.4)",
        }}
      />
    </div>
  );
}
