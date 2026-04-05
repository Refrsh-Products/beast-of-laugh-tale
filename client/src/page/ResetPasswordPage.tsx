import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import useAuthService from "../services/auth";

const G = "#84e487";
const B = "#000000";
const W = "#FFFFFF";

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const authService = useAuthService();
  const [searchParams] = useSearchParams();
  const uid = searchParams.get("uid") ?? "";
  const token = searchParams.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const invalidLink = !uid || !token;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!password || !confirm) {
      setError("Please fill in all fields.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    setIsLoading(true);
    try {
      console.log(
        `uid: ${uid}, token: ${token}, pass: ${password}, confirm: ${confirm}`,
      );
      authService.resetPassword(uid, token, password, confirm);
      navigate("/login", { state: { resetSuccess: true } });
    } finally {
      setIsLoading(false);
    }
  }

  const inputStyle: React.CSSProperties = {
    width: "100%",
    border: `3px solid ${B}`,
    borderRadius: 0,
    padding: "12px 14px",
    paddingRight: 52,
    fontFamily: "'IBM Plex Mono', monospace",
    fontSize: "0.82rem",
    background: W,
    outline: "none",
    boxSizing: "border-box",
  };

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

        {invalidLink ? (
          /* Invalid / missing token state */
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
              This reset link is invalid or has expired.
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
              Request a new reset link →
            </span>
          </>
        ) : (
          /* Main form */
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
              Choose a new
              <br />
              password
            </h1>
            <p
              style={{
                fontSize: "0.75rem",
                color: "#555",
                marginBottom: 32,
                lineHeight: 1.6,
              }}
            >
              Pick something strong and memorable.
            </p>

            {/* Error */}
            {error && (
              <p
                style={{
                  color: "#cc0000",
                  fontSize: "0.72rem",
                  marginBottom: 16,
                }}
              >
                {error}
              </p>
            )}

            <form
              onSubmit={handleSubmit}
              style={{ display: "flex", flexDirection: "column", gap: 16 }}
            >
              {/* New password */}
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
                  NEW PASSWORD
                </label>
                <div style={{ position: "relative" }}>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    style={inputStyle}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    style={{
                      position: "absolute",
                      right: 12,
                      top: "50%",
                      transform: "translateY(-50%)",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      padding: 0,
                      color: "#888",
                      fontFamily: "'IBM Plex Mono', monospace",
                      fontSize: "0.65rem",
                      fontWeight: 700,
                      letterSpacing: "0.05em",
                    }}
                  >
                    {showPassword ? "HIDE" : "SHOW"}
                  </button>
                </div>
              </div>

              {/* Confirm password */}
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
                  CONFIRM PASSWORD
                </label>
                <div style={{ position: "relative" }}>
                  <input
                    type={showConfirm ? "text" : "password"}
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    placeholder="••••••••"
                    style={inputStyle}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm((v) => !v)}
                    style={{
                      position: "absolute",
                      right: 12,
                      top: "50%",
                      transform: "translateY(-50%)",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      padding: 0,
                      color: "#888",
                      fontFamily: "'IBM Plex Mono', monospace",
                      fontSize: "0.65rem",
                      fontWeight: 700,
                      letterSpacing: "0.05em",
                    }}
                  >
                    {showConfirm ? "HIDE" : "SHOW"}
                  </button>
                </div>
              </div>

              <div style={{ marginTop: 8 }}>
                <button
                  type="submit"
                  disabled={isLoading}
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
                    cursor: isLoading ? "not-allowed" : "pointer",
                    opacity: isLoading ? 0.6 : 1,
                    lineHeight: 1,
                  }}
                >
                  {isLoading ? "Saving..." : "Set new password →"}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
