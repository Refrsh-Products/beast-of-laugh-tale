import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import useAuthService from "../services/auth";

const G = "#84e487";
const B = "#000000";
const W = "#FFFFFF";

export default function VerifyEmailSentPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const authService = useAuthService();
  const email = (location.state as { email?: string })?.email ?? "";

  const [resendState, setResendState] = useState<
    "idle" | "sending" | "sent" | "rate-limited" | "error"
  >("idle");
  const [errorMessage, setErrorMessage] = useState("");

  async function handleResend() {
    if (!email) {
      setResendState("error");
      setErrorMessage(
        "No email on file for this session. Please sign up again.",
      );
      return;
    }
    setResendState("sending");
    setErrorMessage("");
    try {
      await authService.requestEmailVerification(email);
      setResendState("sent");
    } catch (err: any) {
      if (err?.response?.status === 429) {
        setResendState("rate-limited");
        setErrorMessage(
          "Too many resend attempts. Please wait a few minutes and try again.",
        );
      } else {
        setResendState("error");
        setErrorMessage("Could not resend right now. Please try again.");
      }
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
            marginBottom: 16,
          }}
        >
          Verify your
          <br />
          email
        </h1>

        <p
          style={{
            fontSize: "0.75rem",
            color: "#555",
            lineHeight: 1.7,
            marginBottom: 8,
          }}
        >
          We sent a verification link to
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
          {email || "your email"}
        </p>

        <p
          style={{
            fontSize: "0.72rem",
            color: "#555",
            lineHeight: 1.6,
            marginBottom: 24,
          }}
        >
          Click the link in the email to activate your account and continue to
          onboarding.
        </p>

        {/* Divider */}
        <div style={{ height: 3, background: B, marginBottom: 24 }} />

        <p style={{ fontSize: "0.72rem", color: "#888", marginBottom: 6 }}>
          Didn't get it?
        </p>
        <span
          onClick={resendState === "sending" ? undefined : handleResend}
          style={{
            fontSize: "0.75rem",
            fontWeight: 700,
            color: resendState === "sending" ? "#888" : B,
            textDecoration: "underline",
            textUnderlineOffset: 3,
            cursor: resendState === "sending" ? "default" : "pointer",
          }}
        >
          {resendState === "sending"
            ? "Sending..."
            : resendState === "sent"
              ? "Sent! Check your inbox again."
              : "Resend verification link"}
        </span>

        {(resendState === "rate-limited" || resendState === "error") && (
          <p
            style={{
              marginTop: 12,
              fontSize: "0.72rem",
              color: "#cc0000",
              lineHeight: 1.5,
            }}
          >
            {errorMessage}
          </p>
        )}

        {/* Back to login */}
        <p style={{ marginTop: 32, fontSize: "0.75rem", color: "#555" }}>
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
