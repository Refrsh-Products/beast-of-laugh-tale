import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import useAuthService from "../services/auth";

const G = "#84e487";
const B = "#000000";
const W = "#FFFFFF";

type Status = "verifying" | "success" | "missing-params" | "invalid" | "error";

export default function VerifyEmailPage() {
  const navigate = useNavigate();
  const authService = useAuthService();
  const [searchParams] = useSearchParams();
  const uid = searchParams.get("uid") ?? "";
  const token = searchParams.get("token") ?? "";

  const [status, setStatus] = useState<Status>(
    !uid || !token ? "missing-params" : "verifying",
  );
  const [errorMessage, setErrorMessage] = useState("");
  // Guard against React.StrictMode double-invocation in dev — the verification
  // endpoint flips is_active on the first call, making the token invalid for
  // the second call and producing a confusing "expired link" error.
  const attempted = useRef(false);

  useEffect(() => {
    if (!uid || !token) return;
    if (attempted.current) return;
    attempted.current = true;

    (async () => {
      try {
        await authService.confirmEmailVerification(uid, token);
        setStatus("success");
        navigate("/onboarding", { replace: true });
      } catch (err: any) {
        const detail = err?.response?.data?.error ?? "";
        if (typeof detail === "string" && detail.toLowerCase().includes("already")) {
          // Already-verified case — send them to log in.
          setStatus("invalid");
          setErrorMessage(
            "This account is already verified. Please log in to continue.",
          );
          return;
        }
        if (err?.response?.status === 400) {
          setStatus("invalid");
          setErrorMessage(
            detail || "This verification link is invalid or has expired.",
          );
          return;
        }
        setStatus("error");
        setErrorMessage("Something went wrong. Please try again in a moment.");
      }
    })();
  }, [uid, token, authService, navigate]);

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

        {status === "verifying" && (
          <>
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
              Verifying your
              <br />
              email...
            </h1>
            <p style={{ fontSize: "0.75rem", color: "#555", lineHeight: 1.6 }}>
              Hang tight — this only takes a second.
            </p>
          </>
        )}

        {status === "success" && (
          <>
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
              Email verified!
            </h1>
            <p style={{ fontSize: "0.75rem", color: "#555", lineHeight: 1.6 }}>
              Redirecting you to onboarding...
            </p>
          </>
        )}

        {status === "missing-params" && (
          <>
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
              Invalid link
            </h1>
            <p
              style={{
                fontSize: "0.75rem",
                color: "#555",
                lineHeight: 1.6,
                marginBottom: 24,
              }}
            >
              This verification link is missing required information.
            </p>
            <span
              onClick={() => navigate("/login")}
              style={{
                fontSize: "0.75rem",
                fontWeight: 700,
                color: B,
                textDecoration: "underline",
                textUnderlineOffset: 3,
                cursor: "pointer",
              }}
            >
              ← Back to login
            </span>
          </>
        )}

        {(status === "invalid" || status === "error") && (
          <>
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
              {status === "invalid" ? "Link expired" : "Something went wrong"}
            </h1>
            <p
              style={{
                fontSize: "0.75rem",
                color: "#555",
                lineHeight: 1.6,
                marginBottom: 24,
              }}
            >
              {errorMessage}
            </p>
            <span
              onClick={() => navigate("/login")}
              style={{
                fontSize: "0.75rem",
                fontWeight: 700,
                color: B,
                textDecoration: "underline",
                textUnderlineOffset: 3,
                cursor: "pointer",
              }}
            >
              ← Back to login
            </span>
          </>
        )}
      </div>
    </div>
  );
}
