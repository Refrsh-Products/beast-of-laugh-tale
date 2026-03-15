import { useState, useRef } from "react";
import type { Notebook } from "../../storage";

const G = "#84e487";
const B = "#000000";
const W = "#FFFFFF";

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function NotebookRow({
  notebook,
  openMenuId,
  onMenuOpen,
  editingId,
  editValue,
  onEditChange,
  onEditConfirm,
  onEditCancel,
  onClick,
}: {
  notebook: Notebook;
  openMenuId: string | null;
  onMenuOpen: (
    id: string | null,
    anchor?: { top: number; right: number },
  ) => void;
  editingId: string | null;
  editValue: string;
  onEditChange: (val: string) => void;
  onEditConfirm: () => void;
  onEditCancel: () => void;
  onClick?: (notebook: Notebook) => void;
}) {
  const [hovered, setHovered] = useState(false);
  const menuOpen = openMenuId === notebook.id;
  const isEditing = editingId === notebook.id;
  const escapeRef = useRef(false);

  return (
    <div
      style={{
        position: "relative",
        padding: "14px 20px",
        background: W,
        border:
          hovered || menuOpen || isEditing
            ? `2px solid ${G}`
            : `2px solid ${B}`,
        boxShadow:
          hovered || menuOpen || isEditing
            ? `6px 6px 0 ${B}`
            : `3px 3px 0 ${B}`,
        transform:
          hovered || menuOpen || isEditing ? "translate(-2px, -2px)" : "none",
        transition: "transform 0.1s, box-shadow 0.1s, border-color 0.1s",
        cursor: isEditing ? "default" : "pointer",
        display: "flex",
        alignItems: "center",
        gap: 12,
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => !isEditing && onClick?.(notebook)}
    >
      {/* Pin icon */}
      <div style={{ width: 14, flexShrink: 0 }}>
        {notebook.pinned && (
          <svg width="12" height="12" viewBox="0 0 12 12" fill={G}>
            <path d="M9 1H3a1 1 0 0 0-1 1v1.5l2 2V10l2 1 2-1V5.5l2-2V2a1 1 0 0 0-1-1Z" />
          </svg>
        )}
      </div>

      {/* Title or rename input */}
      {isEditing ? (
        <input
          autoFocus
          value={editValue}
          onChange={(e) => onEditChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              onEditConfirm();
            } else if (e.key === "Escape") {
              escapeRef.current = true;
              e.currentTarget.blur();
            }
          }}
          onBlur={() => {
            if (escapeRef.current) {
              escapeRef.current = false;
              onEditCancel();
            } else {
              onEditConfirm();
            }
          }}
          onClick={(e) => e.stopPropagation()}
          style={{
            flex: 1,
            fontFamily: "'Syne', sans-serif",
            fontWeight: 700,
            fontSize: "0.9rem",
            border: "none",
            borderBottom: `2px solid ${G}`,
            outline: "none",
            background: "transparent",
            padding: "2px 0",
            minWidth: 0,
          }}
        />
      ) : (
        <div
          style={{
            flex: 1,
            fontFamily: "'Syne', sans-serif",
            fontWeight: 700,
            fontSize: "0.9rem",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            minWidth: 0,
          }}
        >
          {notebook.title}
        </div>
      )}

      {/* File count */}
      <span
        style={{
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: "0.62rem",
          color: "#888",
          flexShrink: 0,
        }}
      >
        {notebook.file_count} files
      </span>

      {/* Date */}
      <span
        style={{
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: "0.62rem",
          color: "#888",
          flexShrink: 0,
        }}
      >
        {formatDate(notebook.created_at)}
      </span>

      {/* Three-dot */}
      {!isEditing && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (menuOpen) {
              onMenuOpen(null);
              return;
            }
            const rect = e.currentTarget.getBoundingClientRect();
            onMenuOpen(notebook.id, {
              top: rect.bottom + 4,
              right: window.innerWidth - rect.right,
            });
          }}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: "0 2px",
            fontSize: "1rem",
            lineHeight: 1,
            color: "#888",
            opacity: hovered || menuOpen ? 1 : 0,
            transition: "opacity 0.1s",
            flexShrink: 0,
          }}
        >
          ⋮
        </button>
      )}
    </div>
  );
}
