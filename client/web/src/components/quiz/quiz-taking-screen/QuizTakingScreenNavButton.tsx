import { useEffect, useState } from "react";

const G = "#84e487";
const B = "#000000";
const W = "#FFFFFF";

export default function NavButton({
  onClick,
  disabled = false,
  green = false,
  children,
}: {
  onClick: () => void;
  disabled?: boolean;
  green?: boolean;
  children: React.ReactNode;
}) {
  const [hovered, setHovered] = useState(false);
  const [pressed, setPressed] = useState(false);

  // Reset hover/press when disabled changes (e.g. Prev becomes enabled on Q2)
  useEffect(() => {
    setHovered(false);
    setPressed(false);
  }, [disabled]);

  const restingShadow = green ? `4px 4px 0 ${B}` : `3px 3px 0 ${B}`;
  const hoverShadow = green ? `7px 7px 0 ${B}` : `5px 5px 0 ${B}`;
  const hoverTranslate = green
    ? "translate(-3px, -3px)"
    : "translate(-2px, -2px)";

  const shadow = disabled
    ? "none"
    : pressed
      ? `2px 2px 0 ${B}`
      : hovered
        ? hoverShadow
        : restingShadow;

  const transform = disabled
    ? "none"
    : pressed
      ? "translate(2px, 2px)"
      : hovered
        ? hoverTranslate
        : "none";

  return (
    <button
      disabled={disabled}
      onClick={
        disabled
          ? undefined
          : () => {
              setHovered(false);
              setPressed(false);
              onClick();
            }
      }
      onMouseEnter={() => !disabled && setHovered(true)}
      onMouseLeave={() => {
        setHovered(false);
        setPressed(false);
      }}
      onMouseDown={() => !disabled && setPressed(true)}
      onMouseUp={() => setPressed(false)}
      style={{
        padding: "12px 32px",
        fontFamily: "'IBM Plex Mono', monospace",
        fontWeight: 700,
        fontSize: "0.82rem",
        letterSpacing: "0.06em",
        border: `2px solid ${disabled ? "#ccc" : B}`,
        background: disabled ? "#eee" : green ? G : W,
        color: B,
        boxShadow: shadow,
        transform,
        cursor: disabled ? "not-allowed" : "pointer",
        transition: "transform 0.15s, box-shadow 0.15s",
        width: 210,
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </button>
  );
}
