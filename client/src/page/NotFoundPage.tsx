import { useNavigate } from "react-router-dom";
import Button from "../components/ui/Button";

const G = "#84e487";
const B = "#000000";
const W = "#FFFFFF";

export default function NotFoundPage() {
  const navigate = useNavigate();

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

        {/* 404 */}
        <div
          style={{
            fontFamily: "'Syne', sans-serif",
            fontWeight: 800,
            fontSize: "4rem",
            letterSpacing: "-0.04em",
            lineHeight: 1,
            marginBottom: 12,
          }}
        >
          404
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
          Page not
          <br />
          found
        </h1>

        <p
          style={{
            fontSize: "0.75rem",
            color: "#000000",
            lineHeight: 1.7,
            marginBottom: 32,
          }}
        >
          The page you're looking for doesn't exist or has been moved.
        </p>

        {/* Divider */}
        <div style={{ height: 3, background: B, marginBottom: 24 }} />

        <Button variant="primary" fullWidth onClick={() => navigate("/")}>
          GO HOME
        </Button>

        <p style={{ marginTop: 20, fontSize: "0.75rem", color: "#000000" }}>
          <span
            onClick={() => navigate(-1)}
            style={{
              cursor: "pointer",
              textDecoration: "underline",
              textUnderlineOffset: 3,
            }}
          >
            ← Go back
          </span>
        </p>
      </div>
    </div>
  );
}
