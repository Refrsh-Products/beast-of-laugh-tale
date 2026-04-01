import { useState } from "react";

const G = "#84e487"; // green accent
const B = "#000000"; // black
const W = "#FFFFFF"; // white

type Variant = "black" | "green" | "outline";

interface BtnProps {
  variant?: Variant;
  children: React.ReactNode;
  lg?: boolean;
  onDark?: boolean;
}

export default function Btn({ variant, onDark, children, lg }: BtnProps) {
  const [down, setDown] = useState(false);
  const [hovered, setHovered] = useState(false);

  const bg = variant === "black" ? B : variant === "green" ? G : W;
  const txt = variant === "black" ? W : B;
  const shadowClr = onDark ? W : variant === "black" ? G : B;

  const lift = lg ? 3 : 2;
  const hoverShadow = lg ? 7 : 6;

  const transform = down
    ? "translate(2px, 2px)"
    : hovered
      ? `translate(-${lift}px, -${lift}px)`
      : "none";
  const shadow = down
    ? `2px 2px 0 ${shadowClr}`
    : hovered
      ? `${hoverShadow}px ${hoverShadow}px 0 ${shadowClr}`
      : `4px 4px 0 ${shadowClr}`;

  return (
    <button
      style={{
        background: bg,
        color: txt,
        border: `2px solid ${B}`,
        boxShadow: shadow,
        transform,
        padding: lg ? "16px 36px" : "10px 22px",
        fontSize: lg ? "0.85rem" : "0.75rem",
        fontFamily: "'IBM Plex Mono', monospace",
        fontWeight: 600,
        letterSpacing: "0.08em",
        cursor: "pointer",
        transition: "transform 0.15s, box-shadow 0.15s",
        lineHeight: 1,
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { setHovered(false); setDown(false); }}
      onMouseDown={() => setDown(true)}
      onMouseUp={() => setDown(false)}
    >
      {children}
    </button>
  );
}
