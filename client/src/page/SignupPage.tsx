import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import GoogleAuthBtn from "../components/google-auth/GoogleAuthBtn";
import FreshrLogo from "../components/logo/FreshrLogo";
import Button from "../components/ui/Button";
import useAuthService from "../services/auth";
import Loading from "../components/loading/Loading";
import { BLACK as B, WHITE as W } from "../constants/theme";
import { inputStyle, labelStyle, inputHandlers } from "../styles/form";
import { useMediaQuery } from "../hooks/useMediaQuery";
import { BP_PHONE } from "../constants/breakpoints";

const G = "#84e487";
const showGoogleAuth = import.meta.env.VITE_USE_MOCK !== "true";

export default function SignupPage() {
  const navigate = useNavigate();
  const authService = useAuthService();
  const isPhone = useMediaQuery(BP_PHONE);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    setError("");

    if (!email || !password || !confirm) {
      setError("Please fill in all fields.");
      return;
    }
    if (
      !/^(?=.*?[a-z])(?=.*?[A-Z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-]).{8,}$/.test(
        password,
      )
    ) {
      setError(
        "Password must be at least 8 characters long, contain 1 uppercase letter, 1 lowercase letter, 1 special character, and 1 number.",
      );
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    setIsLoading(true);

    try {
      await authService.register(email, password, confirm);
      navigate("/verify-email/sent", { state: { email } });
    } catch (err) {
      console.error("[SignupPage] Error During Registration:", err);
      setError(`Failed to Register User: ${email}\nError: ${err}`);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) return <Loading />;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: isPhone ? "column" : "row",
        minHeight: "100dvh",
        fontFamily: "'IBM Plex Mono', monospace",
      }}
    >
      {/* ── Mobile branded header ── */}
      {isPhone && (
        <div
          style={{
            background: B,
            padding: "22px 24px 18px",
            borderBottom: `3px solid ${B}`,
          }}
        >
          <div
            onClick={() => navigate("/")}
            style={{
              fontFamily: "'Syne', sans-serif",
              fontWeight: 800,
              fontSize: "1.4rem",
              letterSpacing: "-0.02em",
              color: W,
              cursor: "pointer",
              marginBottom: 8,
            }}
          >
            FRESHR
          </div>
          <div
            style={{
              color: G,
              fontSize: "0.7rem",
              fontWeight: 700,
              letterSpacing: "0.12em",
            }}
          >
            ◆ AI-powered learning platform
          </div>
        </div>
      )}

      {/* ── Desktop left black panel ── */}
      {!isPhone && (
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
          <FreshrLogo />
        </div>
      )}

      {/* ── Form panel ── */}
      <div
        style={{
          flex: isPhone ? undefined : "1 1 100%",
          background: W,
          display: "flex",
          flexDirection: "column",
          justifyContent: isPhone ? "flex-start" : "center",
          alignItems: "center",
          padding: isPhone ? "36px 24px 52px" : "48px 24px",
          position: "relative",
          boxSizing: "border-box",
        }}
        className={isPhone ? undefined : "signup-right"}
      >
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

          {showGoogleAuth && (
            <>
              <GoogleAuthBtn />
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
            </>
          )}

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

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSubmit();
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

            <div>
              <label style={labelStyle}>CONFIRM PASSWORD</label>
              <div style={{ position: "relative" }}>
                <input
                  type={showConfirm ? "text" : "password"}
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="••••••••"
                  style={{ ...inputStyle, paddingRight: 48 }}
                  {...inputHandlers}
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
                    color: "#000000",
                    fontFamily: "'IBM Plex Mono', monospace",
                    fontSize: "0.75rem",
                    fontWeight: 700,
                    letterSpacing: "0.05em",
                    transition: "color 0.12s",
                  }}
                >
                  {showConfirm ? "HIDE" : "SHOW"}
                </button>
              </div>
            </div>

            <div style={{ marginTop: 8 }}>
              <Button variant="green" fullWidth type="submit">
                Sign up →
              </Button>
            </div>

            <p
              style={{
                marginTop: 4,
                fontSize: "0.7rem",
                color: "#555",
                lineHeight: 1.6,
                textAlign: "center",
              }}
            >
              By signing up, you agree to FRESHR's{" "}
              <Link
                to="/terms-of-service"
                style={{
                  color: B,
                  fontWeight: 700,
                  textDecoration: "underline",
                  textUnderlineOffset: 3,
                }}
              >
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link
                to="/privacy-policy"
                style={{
                  color: B,
                  fontWeight: 700,
                  textDecoration: "underline",
                  textUnderlineOffset: 3,
                }}
              >
                Privacy Policy
              </Link>
              .
            </p>
          </form>

          <p
            style={{
              marginTop: 28,
              fontSize: "0.75rem",
              color: "#000000",
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

          <p
            style={{
              marginTop: 10,
              fontSize: "0.72rem",
              color: "#555",
              textAlign: "center",
            }}
          >
            Need help?{" "}
            <Link
              to="/support"
              style={{
                color: B,
                fontWeight: 700,
                textDecoration: "underline",
                textUnderlineOffset: 3,
              }}
            >
              Contact support
            </Link>
          </p>
        </div>
      </div>

      {/* ── Desktop CSS ── */}
      {!isPhone && (
        <style>{`
          @media (min-width: 768px) {
            .signup-left { display: block !important; }
            .signup-right { flex: 0 0 50% !important; padding: 48px 32px !important; }
          }
        `}</style>
      )}
    </div>
  );
}
