import { useNavigate, useLocation } from "react-router-dom";

const G = "#84e487";
const B = "#000000";
const W = "#FFFFFF";

export default function ForgotPasswordSentPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const email = (location.state as { email?: string })?.email ?? "your email";

  return (
    <div
      style={{
        minHeight: "100dvh",
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
        {/* Logo */}
        <div
          onClick={() => navigate("/")}
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
        >
          FRESHR
        </div>

        {/* Title */}
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
          Check your
          <br />
          email
        </h1>

        <p
          style={{
            fontSize: "0.75rem",
            color: "#000000",
            lineHeight: 1.7,
            marginBottom: 8,
          }}
        >
          We sent a reset link to
        </p>
        <p
          style={{
            fontSize: "0.82rem",
            fontWeight: 700,
            color: B,
            marginBottom: 32,
            wordBreak: "break-all",
          }}
        >
          {email}
        </p>

        {/* Divider */}
        <div style={{ height: 3, background: B, marginBottom: 24 }} />

        <p style={{ fontSize: "0.75rem", color: "#000000", marginBottom: 6 }}>
          Didn't get it?
        </p>
        <span
          onClick={() => navigate("/forgot-password")}
          style={{
            fontSize: "0.75rem",
            fontWeight: 700,
            color: B,
            textDecoration: "underline",
            textUnderlineOffset: 3,
            cursor: "pointer",
          }}
        >
          Resend reset link
        </span>

        {/* Back to login */}
        <p style={{ marginTop: 32, fontSize: "0.75rem", color: "#000000" }}>
          <span
            onClick={() => navigate("/login")}
            style={{
              cursor: "pointer",
              textDecoration: "underline",
              textUnderlineOffset: 3,
            }}
          >
            ← Back to login
          </span>
        </p>
      </div>
    </div>
  );
}
