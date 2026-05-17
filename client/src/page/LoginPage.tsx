import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import Button from "../components/ui/Button";
import Loading from "../components/loading/Loading";
import useAuthService from "../services/auth";
import { NeedsVerificationError } from "../services/auth/AuthService.types";
import GoogleAuthBtn from "../components/google-auth/GoogleAuthBtn";
import FreshrLogo from "../components/logo/FreshrLogo";
import { BLACK as B, WHITE as W } from "../constants/theme";
import { inputStyle, labelStyle, inputHandlers } from "../styles/form";

export default function LoginPage() {
  const navigate = useNavigate();
  const authService = useAuthService();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [needsVerificationFor, setNeedsVerificationFor] = useState<
    string | null
  >(null);
  const [resendState, setResendState] = useState<
    "idle" | "sending" | "sent" | "rate-limited" | "error"
  >("idle");
  const [isLoading, setIsLoading] = useState(false);


  const handleLogin = async () => {
    if (!email || !password) {
      setError("Please fill in all fields.");
      return;
    }

    setError("");
    setNeedsVerificationFor(null);
    setResendState("idle");
    setIsLoading(true);

    try {
      const user = await authService.login(email, password);
      console.log("[LoginPage] Logged in user:", user);

      navigate("/dashboard");
    } catch (err) {
      if (err instanceof NeedsVerificationError) {
        setNeedsVerificationFor(err.email);
      } else {
        setError("Incorrect email or password. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendVerification = async () => {
    if (!needsVerificationFor) return;
    setResendState("sending");
    try {
      await authService.requestEmailVerification(needsVerificationFor);
      setResendState("sent");
    } catch (err: any) {
      setResendState(err?.response?.status === 429 ? "rate-limited" : "error");
    }
  };

  if (isLoading) return <Loading />;

  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        fontFamily: "'IBM Plex Mono', monospace",
      }}
    >
      {/* ── LEFT HALF (form) ── */}
      <div
        style={{
          flex: "0 0 50%",
          background: W,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          padding: "48px 32px",
          position: "relative",
          boxSizing: "border-box",
        }}
      >
        {/* Logo */}
        <FreshrLogo color="#000000" />

        {/* Form container */}
        <div style={{ width: "100%", maxWidth: 420 }}>
          <h1
            style={{
              fontFamily: "'Syne', sans-serif",
              fontWeight: 800,
              fontSize: "2rem",
              letterSpacing: "-0.02em",
              marginBottom: 32,
              lineHeight: 1.1,
            }}
          >
            Welcome
            <br />
            back
          </h1>

          {/* Google button */}
          <GoogleAuthBtn />

          {/* Divider */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              marginBottom: 24,
            }}
          >
            <div style={{ flex: 1, height: 2, background: B }} />
            <span
              style={{
                fontSize: "0.75rem",
                fontWeight: 700,
                letterSpacing: "0.1em",
                color: "#000000",
              }}
            >
              or
            </span>
            <div style={{ flex: 1, height: 2, background: B }} />
          </div>

          {/* Error message */}
          {error && (
            <p
              style={{
                color: "#cc0000",
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: "0.75rem",
                margin: "0 0 16px",
              }}
            >
              {error}
            </p>
          )}

          {/* Needs-verification banner */}
          {needsVerificationFor && (
            <div
              style={{
                border: `2px solid ${B}`,
                background: "#fff8d6",
                padding: "12px 14px",
                margin: "0 0 16px",
                fontSize: "0.72rem",
                lineHeight: 1.5,
              }}
            >
              <p style={{ margin: "0 0 8px", fontWeight: 700 }}>
                Please verify your email before logging in.
              </p>
              <p style={{ margin: "0 0 10px", color: "#555" }}>
                We sent a verification link to {needsVerificationFor}.
              </p>
              <span
                onClick={
                  resendState === "sending"
                    ? undefined
                    : handleResendVerification
                }
                style={{
                  fontSize: "0.72rem",
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
                    ? "Sent! Check your inbox."
                    : "Resend verification link"}
              </span>
              {resendState === "rate-limited" && (
                <p style={{ margin: "8px 0 0", color: "#cc0000" }}>
                  Too many resend attempts. Try again in a few minutes.
                </p>
              )}
              {resendState === "error" && (
                <p style={{ margin: "8px 0 0", color: "#cc0000" }}>
                  Could not resend right now. Please try again.
                </p>
              )}
            </div>
          )}

          {/* Fields */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleLogin();
            }}
            style={{ display: "flex", flexDirection: "column", gap: 16 }}
          >
            <div>
              <label style={labelStyle}>EMAIL</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                style={inputStyle}
                {...inputHandlers}
              />
            </div>

            <div>
              <label style={labelStyle}>PASSWORD</label>
              <div style={{ position: "relative" }}>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  style={{ ...inputStyle, paddingRight: 48 }}
                  {...inputHandlers}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  onMouseEnter={(e) => (e.currentTarget.style.color = B)}
                  onMouseLeave={(e) => (e.currentTarget.style.color = "#000000")}
                  style={{
                    position: "absolute",
                    right: 12,
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    padding: 0,
                    color: "#000000",
                    fontFamily: "'IBM Plex Mono', monospace",
                    fontSize: "0.75rem",
                    fontWeight: 700,
                    letterSpacing: "0.05em",
                    transition: "color 0.12s",
                  }}
                >
                  {showPassword ? "HIDE" : "SHOW"}
                </button>
              </div>
            </div>

            <div style={{ textAlign: "right" }}>
              <Link
                to="/forgot-password"
                style={{
                  fontSize: "0.75rem",
                  color: "#000000",
                  textDecoration: "underline",
                  textUnderlineOffset: 3,
                }}
              >
                Forgot password?
              </Link>
            </div>

            <div style={{ marginTop: 8 }}>
              <Button variant="green" fullWidth type="submit">
                Log in →
              </Button>
            </div>
          </form>

          {/* Footer */}
          <p
            style={{
              marginTop: 28,
              fontSize: "0.75rem",
              color: "#000000",
              textAlign: "center",
            }}
          >
            Don't have an account?{" "}
            <Link
              to="/signup"
              style={{
                color: B,
                fontWeight: 700,
                textDecoration: "underline",
                textUnderlineOffset: 3,
              }}
            >
              Sign up
            </Link>
          </p>
        </div>
      </div>

      {/* ── RIGHT HALF (black) ── */}
      <div
        style={{
          flex: "0 0 50%",
          boxSizing: "border-box",
          background: B,
          display: "none",
          position: "relative",
        }}
        className="login-right"
      ></div>

      <style>{`
        @media (min-width: 768px) {
          .login-right { display: block !important; }
        }
      `}</style>
    </div>
  );
}
