import { useNavigate } from "react-router-dom";
import Button from "../components/ui/Button";

const G = "#84e487";
const B = "#000000";
const W = "#FFFFFF";

export default function PaymentCancelPage() {
  const navigate = useNavigate();

  return (
    <div
      style={{
        minHeight: "100vh",
        background: B,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px 16px",
        fontFamily: "'IBM Plex Mono', monospace",
      }}
    >
      <div
        style={{
          background: W,
          border: `2px solid ${B}`,
          boxShadow: `8px 8px 0 ${G}`,
          padding: "48px 40px",
          width: "100%",
          maxWidth: 420,
          boxSizing: "border-box",
        }}
      >
        <div
          style={{
            fontFamily: "'Syne', sans-serif",
            fontWeight: 800,
            fontSize: "1.4rem",
            letterSpacing: "-0.02em",
            color: G,
            cursor: "pointer",
            userSelect: "none",
            marginBottom: 32,
          }}
          onClick={() => navigate("/")}
        >
          FRESHR
        </div>

        <div
          style={{
            width: 48,
            height: 48,
            background: "#f5f5f0",
            border: `3px solid ${B}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "1.5rem",
            marginBottom: 24,
          }}
        >
          ✕
        </div>

        <h1
          style={{
            fontFamily: "'Syne', sans-serif",
            fontWeight: 800,
            fontSize: "1.75rem",
            letterSpacing: "-0.02em",
            lineHeight: 1.1,
            marginBottom: 16,
          }}
        >
          Payment
          <br />
          cancelled
        </h1>

        <p
          style={{
            fontSize: "0.75rem",
            color: "#555",
            lineHeight: 1.7,
            marginBottom: 32,
          }}
        >
          No charge was made. You can try again whenever you're ready.
        </p>

        <div style={{ height: 3, background: B, marginBottom: 24 }} />

        <div style={{ marginBottom: 16 }}>
          <Button variant="primary" fullWidth onClick={() => navigate("/profile")}>
            TRY AGAIN
          </Button>
        </div>

        <p style={{ fontSize: "0.75rem", color: "#555" }}>
          <span
            onClick={() => navigate("/dashboard")}
            style={{
              cursor: "pointer",
              textDecoration: "underline",
              textUnderlineOffset: 3,
            }}
          >
            ← Back to dashboard
          </span>
        </p>
      </div>
    </div>
  );
}
