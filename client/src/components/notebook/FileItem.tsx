import { useState, useRef } from "react";
import type { NotebookFile } from "../../storage";

const B = "#000000";
const R = "#FF4D4D";
const W = "#FFFFFF";

interface FileItemProps {
  file: NotebookFile;
  bulkMode: boolean;
  selected: boolean;
  onToggleSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onRename: (id: string, newName: string) => void;
}

function FileIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      style={{ flexShrink: 0 }}
    >
      <rect
        x="2"
        y="1"
        width="9"
        height="13"
        rx="1"
        fill="#f0f0f0"
        stroke={B}
        strokeWidth="1.5"
      />
      <path
        d="M8 1v4h3"
        stroke={B}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <line
        x1="4"
        y1="8"
        x2="10"
        y2="8"
        stroke={B}
        strokeWidth="1.2"
        strokeLinecap="round"
      />
      <line
        x1="4"
        y1="10.5"
        x2="8"
        y2="10.5"
        stroke={B}
        strokeWidth="1.2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function DotsIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <circle cx="7" cy="3" r="1.2" fill={B} />
      <circle cx="7" cy="7" r="1.2" fill={B} />
      <circle cx="7" cy="11" r="1.2" fill={B} />
    </svg>
  );
}

export default function FileItem({
  file,
  bulkMode,
  selected,
  onToggleSelect,
  onDelete,
  onRename,
}: FileItemProps) {
  const [hovered, setHovered] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuPos, setMenuPos] = useState<{ top: number; left: number } | null>(
    null,
  );
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState(file.name);
  const renameInputRef = useRef<HTMLInputElement>(null);

  function handleDotsClick(e: React.MouseEvent) {
    e.stopPropagation();
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setMenuPos({ top: rect.bottom + 4, left: rect.right - 120 });
    setMenuOpen(true);
  }

  function closeMenu() {
    setMenuOpen(false);
    setMenuPos(null);
  }

  function handleRenameClick() {
    closeMenu();
    setRenameValue(file.name);
    setIsRenaming(true);
    setTimeout(() => {
      renameInputRef.current?.focus();
      renameInputRef.current?.select();
    }, 0);
  }

  function submitRename() {
    const trimmed = renameValue.trim();
    if (trimmed && trimmed !== file.name) {
      onRename(file.id, trimmed);
    }
    setIsRenaming(false);
  }

  function handleRenameKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") submitRename();
    if (e.key === "Escape") setIsRenaming(false);
  }

  return (
    <>
      <div
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onClick={() => bulkMode && onToggleSelect(file.id)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "8px 10px",
          background: selected
            ? "#fff0f0"
            : hovered && !bulkMode
              ? "#f9f9f9"
              : W,
          border: `1.5px solid ${selected ? R : hovered && !bulkMode ? "#ccc" : B}`,
          cursor: bulkMode ? "pointer" : "default",
          userSelect: "none",
          transition: "background 0.1s, border-color 0.1s",
          position: "relative",
        }}
      >
        <FileIcon />

        {/* Filename or rename input */}
        {isRenaming ? (
          <input
            ref={renameInputRef}
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            onBlur={submitRename}
            onKeyDown={handleRenameKeyDown}
            onClick={(e) => e.stopPropagation()}
            style={{
              flex: 1,
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: "0.72rem",
              border: `1.5px solid ${B}`,
              padding: "2px 6px",
              outline: "none",
              background: W,
              minWidth: 0,
            }}
          />
        ) : (
          <span
            style={{
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: "0.72rem",
              color: B,
              flex: 1,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {file.name}
          </span>
        )}

        {/* Bulk mode checkbox — right side */}
        {bulkMode && (
          <input
            type="checkbox"
            checked={selected}
            onChange={() => onToggleSelect(file.id)}
            onClick={(e) => e.stopPropagation()}
            style={{
              cursor: "pointer",
              accentColor: R,
              width: 14,
              height: 14,
              flexShrink: 0,
            }}
          />
        )}

        {/* Ingestion status indicator */}
        {(file.ingestion_status === "pending" ||
          file.ingestion_status === "processing") && (
          <svg
            width="12"
            height="12"
            viewBox="0 0 12 12"
            style={{ flexShrink: 0 }}
          >
            <title>Processing...</title>
            <circle cx="6" cy="6" r="4" fill="none" stroke="#ddd" strokeWidth="1.8" />
            <path
              d="M6 2 A4 4 0 0 1 10 6"
              fill="none"
              stroke="#888"
              strokeWidth="1.8"
              strokeLinecap="round"
            >
              <animateTransform
                attributeName="transform"
                type="rotate"
                from="0 6 6"
                to="360 6 6"
                dur="0.8s"
                repeatCount="indefinite"
              />
            </path>
          </svg>
        )}
        {file.ingestion_status === "failed" && (
          <svg
            width="12"
            height="12"
            viewBox="0 0 12 12"
            style={{ flexShrink: 0 }}
          >
            <title>{file.ingestion_error || "Ingestion failed"}</title>
            <circle cx="6" cy="6" r="5" fill="#FF4D4D" stroke={B} strokeWidth="1.2" />
            <path
              d="M6 3.5v3"
              stroke="#fff"
              strokeWidth="1.4"
              strokeLinecap="round"
            />
            <circle cx="6" cy="8.5" r="0.7" fill="#fff" />
          </svg>
        )}

        {/* 3-dot button — only in normal mode, visible on hover */}
        {!bulkMode && !isRenaming && (
          <button
            onClick={handleDotsClick}
            style={{
              background: menuOpen ? "#eee" : "none",
              border: "none",
              cursor: "pointer",
              padding: "2px 4px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              opacity: hovered || menuOpen ? 1 : 0,
              transition: "opacity 0.1s",
              flexShrink: 0,
            }}
          >
            <DotsIcon />
          </button>
        )}
      </div>

      {/* Overlay to close menu on outside click */}
      {menuOpen && (
        <div
          style={{ position: "fixed", inset: 0, zIndex: 199 }}
          onClick={closeMenu}
        />
      )}

      {/* Popover menu */}
      {menuOpen && menuPos && (
        <div
          style={{
            position: "fixed",
            top: menuPos.top,
            left: menuPos.left,
            width: 120,
            background: W,
            border: `2px solid ${B}`,
            boxShadow: `3px 3px 0 ${B}`,
            zIndex: 200,
            overflow: "hidden",
          }}
        >
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleRenameClick();
            }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              width: "100%",
              padding: "9px 12px",
              background: "none",
              border: "none",
              borderBottom: `1px solid #eee`,
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: "0.7rem",
              color: B,
              cursor: "pointer",
              textAlign: "left",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background =
                "#f5f5f5";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = "none";
            }}
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path
                d="M8.5 1.5l2 2L4 10H2V8L8.5 1.5z"
                stroke={B}
                strokeWidth="1.4"
                strokeLinejoin="round"
              />
            </svg>
            Rename
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              closeMenu();
              onDelete(file.id);
            }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              width: "100%",
              padding: "9px 12px",
              background: "none",
              border: "none",
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: "0.7rem",
              color: R,
              cursor: "pointer",
              textAlign: "left",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background =
                "#fff5f5";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = "none";
            }}
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path
                d="M2 3h8M5 3V2h2v1M4.5 10.5h3a1 1 0 0 0 1-1V4h-5v5.5a1 1 0 0 0 1 1z"
                stroke={R}
                strokeWidth="1.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Delete
          </button>
        </div>
      )}
    </>
  );
}
