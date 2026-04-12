import { useState, type ReactNode } from "react";

const G = "#84e487";
const B = "#000000";
const W = "#FFFFFF";

interface LoginBtnProps {
  children: ReactNode;
  variant: "green" | "black" | "outline";
  lg?: boolean;
  fullWidth: boolean;
  onClick?: () => void;
  type: "button" | "submit";
}

export default function LoginBtn({
  children,
  lg,
  fullWidth,
  onClick,
  variant,
  type,
}: LoginBtnProps) {
  const [down, setDown] = useState(false);
  const bg = variant === "black" ? B : variant === "green" ? G : W;
  const txt = variant === "black" ? W : B;

  return (
    <button
      type={type}
      onClick={onClick}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translate(-3px, -3px)";
        e.currentTarget.style.boxShadow = `6px 6px 0 ${B}`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "none";
        e.currentTarget.style.boxShadow = `3px 3px 0 ${B}`;
      }}
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
    >
      {children}
    </button>
  );
}
