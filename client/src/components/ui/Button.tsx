import { useState, type ReactNode } from "react";

const B = "#000000";
const W = "#FFFFFF";
const G = "#84e487";
const R = "#FF4D4D";

type Variant = "default" | "primary" | "danger" | "green";

const CONFIG: Record<Variant, { bg: string; color: string; shadowColor: string; fontWeight: number }> = {
  default: { bg: W,  color: B, shadowColor: B, fontWeight: 700 },
  primary: { bg: B,  color: W, shadowColor: G, fontWeight: 600 },
  danger:  { bg: R,  color: B, shadowColor: B, fontWeight: 700 },
  green:   { bg: G,  color: B, shadowColor: B, fontWeight: 700 },
};

interface ButtonProps {
  variant?: Variant;
  large?: boolean;
  fullWidth?: boolean;
  type?: "button" | "submit";
  onClick?: () => void;
  children: ReactNode;
  disabled?: boolean;
}

export default function Button({
  variant = "default",
  large = false,
  fullWidth = false,
  type = "button",
  onClick,
  children,
  disabled = false,
}: ButtonProps) {
  const [hovered, setHovered] = useState(false);
  const [down, setDown] = useState(false);

  const { bg, color, shadowColor, fontWeight } = CONFIG[variant];

  const transform = down
    ? "translate(2px, 2px)"
    : hovered
      ? "translate(-3px, -3px)"
      : "none";

  const shadow = down
    ? `2px 2px 0 ${shadowColor}`
    : hovered
      ? `6px 6px 0 ${shadowColor}`
      : `4px 4px 0 ${shadowColor}`;

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => !disabled && setHovered(true)}
      onMouseLeave={() => { setHovered(false); setDown(false); }}
      onMouseDown={() => !disabled && setDown(true)}
      onMouseUp={() => setDown(false)}
      style={{
        background: disabled ? "#ccc" : bg,
        color: disabled ? "#888" : color,
        border: `2px solid ${disabled ? "#ccc" : B}`,
        boxShadow: disabled ? "none" : shadow,
        transform: disabled ? "none" : transform,
        padding: large ? "16px 36px" : "11px 22px",
        fontFamily: "'IBM Plex Mono', monospace",
        fontSize: large ? "0.85rem" : "0.75rem",
        fontWeight,
        letterSpacing: "0.08em",
        cursor: disabled ? "not-allowed" : "pointer",
        transition: "transform 0.12s, box-shadow 0.12s",
        width: fullWidth ? "100%" : undefined,
        lineHeight: 1,
      }}
    >
      {children}
    </button>
  );
}
