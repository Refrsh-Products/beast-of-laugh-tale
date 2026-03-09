import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { saveUser, savePassword, startSession } from "./storage";
import GoogleAuthBtn from "./components/google-auth/GoogleAuthBtn";

const G = "#84e487";
const B = "#000000";
const W = "#FFFFFF";

function Btn({
  children,
  variant = "green",
  lg,
  fullWidth,
  onClick,
  type = "button",
}: {
  children: React.ReactNode;
  variant?: "green" | "black" | "outline";
  lg?: boolean;
  fullWidth?: boolean;
  onClick?: () => void;
  type?: "button" | "submit";
}) {
  const [down, setDown] = useState(false);
  const bg = variant === "black" ? B : variant === "green" ? G : W;
  const txt = variant === "black" ? W : B;

  return (
    <button
      type={type}
      onClick={onClick}
      style={{
        background: bg,
        color: txt,
        border: `2px solid ${B}`,
        boxShadow: down ? `2px 2px 0 ${B}` : `4px 4px 0 ${B}`,
        transform: down ? "translate(2px, 2px)" : "none",
        padding: lg ? "16px 36px" : "12px 22px",
        fontSize: "0.78rem",
        fontFamily: "'IBM Plex Mono', monospace",
        fontWeight: 600,
        letterSpacing: "0.08em",
        cursor: "pointer",
        transition: "transform 0.08s, box-shadow 0.08s",
        lineHeight: 1,
        width: fullWidth ? "100%" : undefined,
      }}
      onMouseDown={() => setDown(true)}
      onMouseUp={() => setDown(false)}
      onMouseLeave={() => setDown(false)}
    >
      {children}
    </button>
  );
}

export default function SignupPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!email || !password || !confirm) {
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
    const user = {
      id: crypto.randomUUID(),
      email,
      tier_plan: "FREE" as const,
      is_active: true,
      created_at: new Date().toISOString(),
    };
    saveUser(user);
    savePassword(password);
    startSession();
    navigate("/onboarding");
  }

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

  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        fontFamily: "'IBM Plex Mono', monospace",
      }}
    >
      {/* ── LEFT HALF ── */}
      <div
        style={{
          flex: "0 0 50%",
          boxSizing: "border-box",
          background: B,
          display: "none",
          position: "relative",
          borderRight: `3px solid ${B}`,
        }}
        className="signup-left"
      >
        {/* Logo */}
        <div
          style={{
            position: "absolute",
            top: 32,
            left: 36,
            fontFamily: "'Syne', sans-serif",
            fontWeight: 800,
            fontSize: "1.5rem",
            letterSpacing: "-0.02em",
            color: W,
            cursor: "pointer",
          }}
          onClick={() => navigate("/")}
        >
          FRESHR
        </div>
      </div>

      {/* ── RIGHT HALF ── */}
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
        {/* Mobile logo */}
        <div
          style={{
            position: "absolute",
            top: 28,
            left: 28,
            fontFamily: "'Syne', sans-serif",
            fontWeight: 800,
            fontSize: "1.35rem",
            letterSpacing: "-0.02em",
            color: B,
            cursor: "pointer",
          }}
          className="signup-mobile-logo"
          onClick={() => navigate("/")}
        >
          FRESHR
        </div>

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
            Create your account
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
            onSubmit={handleSubmit}
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

            <div>
              <label style={labelStyle}>CONFIRM PASSWORD</label>
              <div style={{ position: "relative" }}>
                <input
                  type={showConfirm ? "text" : "password"}
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="••••••••"
                  style={{ ...inputStyle, paddingRight: 48 }}
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
              <Btn variant="green" fullWidth type="submit">
                Sign up →
              </Btn>
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
            Already have an account?{" "}
            <Link
              to="/login"
              style={{
                color: B,
                fontWeight: 700,
                textDecoration: "underline",
                textUnderlineOffset: 3,
              }}
            >
              Log in
            </Link>
          </p>
        </div>
      </div>

      <style>{`
        @media (min-width: 768px) {
          .signup-left { display: block !important; }
          .signup-mobile-logo { display: none !important; }
        }
      `}</style>
    </div>
  );
}
