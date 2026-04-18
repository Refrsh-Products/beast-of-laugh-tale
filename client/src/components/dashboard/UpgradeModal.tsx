import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";

const B = "#000000";
const W = "#FFFFFF";
const G = "#84e487";

export default function UpgradeModal({
  onClose,
  title,
  description,
}: {
  onClose: () => void;
  title?: string;
  description?: string;
}) {
  const navigate = useNavigate();
  return createPortal(
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 2000,
      }}
      onMouseDown={onClose}
    >
      <div
        style={{
          background: W,
          border: `2px solid ${B}`,
          boxShadow: `8px 8px 0 ${B}`,
          padding: "32px",
          maxWidth: 420,
          width: "90%",
          display: "flex",
          flexDirection: "column",
          gap: 20,
        }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div>
          <h2
            style={{
              fontFamily: "'Syne', sans-serif",
              fontWeight: 800,
              fontSize: "1.2rem",
              margin: "0 0 8px",
            }}
          >
            {title}
          </h2>
          <p
            style={{
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: "0.75rem",
              color: "#555",
              margin: 0,
              lineHeight: 1.6,
            }}
          >
            {description}
          </p>
        </div>

        <div
          style={{
            border: `2px solid ${B}`,
            padding: "16px",
            display: "flex",
            flexDirection: "column",
            gap: 8,
          }}
        >
          <span
            style={{
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: "0.65rem",
              fontWeight: 700,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: "#888",
            }}
          >
            Pro plan includes
          </span>
          {[
            "Unlimited notebooks",
            "50 GB storage",
            "Unlimited daily quizzes",
            "Priority support",
          ].map((feature) => (
            <div
              key={feature}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: "0.72rem",
              }}
            >
              <span
                style={{
                  width: 14,
                  height: 14,
                  background: G,
                  border: `1.5px solid ${B}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  fontSize: "0.6rem",
                  fontWeight: 700,
                }}
              >
                ✓
              </span>
              {feature}
            </div>
          ))}
        </div>

        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: "0.72rem",
              fontWeight: 600,
              letterSpacing: "0.06em",
              padding: "10px 20px",
              background: W,
              border: `2px solid ${B}`,
              boxShadow: `3px 3px 0 ${B}`,
              cursor: "pointer",
            }}
          >
            Not now
          </button>
          <button
            type="button"
            onClick={() => navigate("/profile", { state: { tab: "payment" } })}
            style={{
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: "0.72rem",
              fontWeight: 600,
              letterSpacing: "0.06em",
              padding: "10px 20px",
              background: G,
              color: B,
              border: `2px solid ${B}`,
              boxShadow: `3px 3px 0 ${B}`,
              cursor: "pointer",
            }}
          >
            Upgrade to Pro →
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
