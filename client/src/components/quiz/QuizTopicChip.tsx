import { useState } from "react";

const G = "#84e487";
const B = "#000000";
const W = "#FFFFFF";

export default function QuizTopicChip({
  label,
  selected,
  onToggle,
  compact = false,
}: {
  label: string;
  selected: boolean;
  onToggle: () => void;
  compact?: boolean;
}) {
  const [hovered, setHovered] = useState(false);
  const bg = selected ? (hovered ? "#6dce71" : G) : hovered ? "#f0fdf0" : W;

  return (
    <span
      onClick={onToggle}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      title={compact ? label : undefined}
      style={{
        display: "inline-block",
        padding: "4px 10px",
        border: `2px solid ${B}`,
        background: bg,
        fontFamily: "'IBM Plex Mono', monospace",
        fontSize: "0.75rem",
        fontWeight: selected ? 700 : 500,
        letterSpacing: "0.04em",
        cursor: "pointer",
        userSelect: "none",
        transition: "background 0.1s",
        // Compact (collapsed) mode: fixed max-width with truncation
        // Expanded mode: wrap naturally, no max-width
        ...(compact
          ? {
              maxWidth: 120,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }
          : { whiteSpace: "normal", wordBreak: "break-word" }),
      }}
    >
      {label}
    </span>
  );
}
