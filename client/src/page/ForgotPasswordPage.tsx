import { useState } from "react";
import { useNavigate } from "react-router-dom";
import useAuthService from "../services/auth";

const G = "#84e487";
const B = "#000000";
const W = "#FFFFFF";

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const authService = useAuthService();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) {
      setError("Please enter your email.");
      return;
    }
    setError("");
    setIsLoading(true);
    try {
      // TODO: wire up authService.requestPasswordReset(email) when ready
      authService.requestPasswordReset(email);
      navigate("/forgot-password/sent", { state: { email } });
    } finally {
      setIsLoading(false);
    }
  }

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
            marginBottom: 10,
          }}
        >
          Forgot your
          <br />
          password?
        </h1>
        <p
          style={{
            fontSize: "0.75rem",
            color: "#555",
            marginBottom: 32,
            lineHeight: 1.6,
          }}
        >
          Enter your email and we'll send you a reset link.
        </p>

        {/* Error */}
        {error && (
          <p
            style={{ color: "#cc0000", fontSize: "0.72rem", marginBottom: 16 }}
          >
            {error}
          </p>
        )}

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          style={{ display: "flex", flexDirection: "column", gap: 16 }}
        >
          <div>
            <label
              style={{
                display: "block",
                fontSize: "0.68rem",
                fontWeight: 700,
                letterSpacing: "0.12em",
                marginBottom: 6,
              }}
            >
              EMAIL
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              style={{
                width: "100%",
                border: `3px solid ${B}`,
                borderRadius: 0,
                padding: "12px 14px",
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: "0.82rem",
                background: W,
                outline: "none",
                boxSizing: "border-box",
              }}
            />
          </div>

          <div style={{ marginTop: 8 }}>
            <SubmitBtn disabled={isLoading}>
              {isLoading ? "Sending..." : "Send reset link →"}
            </SubmitBtn>
          </div>
        </form>

        {/* Back to login */}
        <p style={{ marginTop: 24, fontSize: "0.75rem", color: "#555" }}>
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

function SubmitBtn({
  children,
  disabled,
}: {
  children: React.ReactNode;
  disabled?: boolean;
}) {
  return (
    <button
      type="submit"
      disabled={disabled}
      style={{
        width: "100%",
        background: G,
        color: B,
        border: `2px solid ${B}`,
        boxShadow: `4px 4px 0 ${B}`,
        padding: "12px 22px",
        fontFamily: "'IBM Plex Mono', monospace",
        fontWeight: 600,
        fontSize: "0.78rem",
        letterSpacing: "0.08em",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.6 : 1,
        lineHeight: 1,
      }}
    >
      {children}
    </button>
  );
}
