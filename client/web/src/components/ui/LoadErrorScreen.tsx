import Button from "./Button";
import FreshrLogo from "../logo/FreshrLogo";

const B = "#000000";
const W = "#FFFFFF";

interface LoadErrorScreenProps {
  title?: string;
  message?: string;
  onRetry: () => void;
  retrying?: boolean;
}

export default function LoadErrorScreen({
  title = "Couldn't load your profile",
  message = "Something went wrong while checking your account. Check your connection and try again.",
  onRetry,
  retrying = false,
}: LoadErrorScreenProps) {
  return (
    <div
      style={{
        minHeight: "100dvh",
        background: "#f5f5f0",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "32px 16px",
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 480,
          background: W,
          border: `2px solid ${B}`,
          boxShadow: `8px 8px 0 ${B}`,
          padding: "40px 40px 36px",
          boxSizing: "border-box",
        }}
      >
        <FreshrLogo />
        <h1
          style={{
            fontFamily: "'Syne', sans-serif",
            fontWeight: 800,
            fontSize: "1.75rem",
            letterSpacing: "-0.02em",
            margin: "0 0 12px",
            lineHeight: 1.1,
            color: B,
          }}
        >
          {title}
        </h1>
        <p
          style={{
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: "0.78rem",
            color: B,
            margin: "0 0 28px",
            lineHeight: 1.6,
          }}
        >
          {message}
        </p>
        <Button variant="green" fullWidth onClick={onRetry} disabled={retrying}>
          {retrying ? "Retrying..." : "Try again"}
        </Button>
      </div>
    </div>
  );
}
