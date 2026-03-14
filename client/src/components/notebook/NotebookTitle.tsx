import { useState, useRef } from "react";

const G = "#84e487";
const B = "#000000";

interface NotebookTitleProps {
  title: string;
  onSave: (newTitle: string) => void;
}

export default function NotebookTitle({ title, onSave }: NotebookTitleProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState(title);
  const escapeRef = useRef(false);

  function startEdit() {
    setValue(title);
    setIsEditing(true);
  }

  function confirmEdit() {
    const trimmed = value.trim();
    if (trimmed && trimmed !== title) onSave(trimmed);
    setIsEditing(false);
  }

  function cancelEdit() {
    setValue(title);
    setIsEditing(false);
  }

  if (isEditing) {
    return (
      <input
        autoFocus
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            confirmEdit();
          }
          if (e.key === "Escape") {
            escapeRef.current = true;
            e.currentTarget.blur();
          }
        }}
        onBlur={() => {
          if (escapeRef.current) {
            escapeRef.current = false;
            cancelEdit();
          } else {
            confirmEdit();
          }
        }}
        style={{
          fontFamily: "'Syne', sans-serif",
          fontWeight: 800,
          fontSize: "1.2rem",
          letterSpacing: "-0.02em",
          border: "none",
          borderBottom: `2px solid ${G}`,
          outline: "none",
          background: "transparent",
          padding: "2px 4px",
          minWidth: 200,
          maxWidth: 500,
          color: B,
        }}
      />
    );
  }

  return (
    <div
      onClick={startEdit}
      title="Click to rename"
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        cursor: "pointer",
      }}
    >
      <span
        style={{
          fontFamily: "'Syne', sans-serif",
          fontWeight: 800,
          fontSize: "1.2rem",
          letterSpacing: "-0.02em",
          color: B,
        }}
      >
        {title}
      </span>
      {/* Pencil icon */}
      <svg
        width="14"
        height="14"
        viewBox="0 0 14 14"
        fill="none"
        style={{ opacity: 0.4, flexShrink: 0 }}
      >
        <path
          d="M9.5 2.5 11.5 4.5 4.5 11.5H2.5V9.5L9.5 2.5Z"
          stroke={B}
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        <path
          d="M8 4 10 6"
          stroke={B}
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}
