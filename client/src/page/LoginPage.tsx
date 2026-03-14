import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import LoginBtn from "../components/login/LoginBtn";
import Loading from "../components/loading/Loading";
import useAuthService from "../services/auth";
import GoogleAuthBtn from "../components/google-auth/GoogleAuthBtn";
import FreshrLogo from "../components/logo/FreshrLogo";

const B = "#000000";
const W = "#FFFFFF";

export default function LoginPage() {
  const navigate = useNavigate();
  const authService = useAuthService();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const inputStyle: React.CSSProperties = {
    width: "100%",
    border: `3px solid ${B}`,
    borderRadius: 0,
    padding: "12px 14px",
    fontFamily: "'IBM Plex Mono', monospace",
    fontSize: "0.82rem",
    background: W,
    outline: "none",
    boxSizing: "border-box",
  };

  const labelStyle: React.CSSProperties = {
    display: "block",
    fontFamily: "'IBM Plex Mono', monospace",
    fontSize: "0.68rem",
    fontWeight: 700,
    letterSpacing: "0.12em",
    marginBottom: 6,
  };

  const handleLogin = async () => {
    if (!email || !password) {
      setError("Please fill in all fields.");
      return;
    }

    setError("");
    setIsLoading(true);

    try {
      const user = await authService.login(email, password);
      console.log("Logged in user:", user);

      navigate("/dashboard");
    } catch {
      setError("Incorrect email or password. Please try again.");
    } finally {
      setIsLoading(false);
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
        <FreshrLogo />

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
                fontSize: "0.7rem",
                fontWeight: 700,
                letterSpacing: "0.1em",
                color: "#666",
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
                fontSize: "0.72rem",
                margin: "0 0 16px",
              }}
            >
              {error}
            </p>
          )}

          {/* Fields */}
          <form
            onSubmit={(e) => {
              console.log("trying to submit");
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

            <div style={{ marginTop: 8 }}>
              <LoginBtn
                variant="green"
                fullWidth
                type="submit"
              >
                Log in →
              </LoginBtn>
            </div>
          </form>

          {/* Footer */}
          <p
            style={{
              marginTop: 28,
              fontSize: "0.75rem",
              color: "#555",
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
