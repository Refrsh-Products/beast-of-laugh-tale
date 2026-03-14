import { useState, useRef } from "react";
import type { NotebookFile } from "../../storage";
import FileItem from "./FileItem";

const G = "#84e487";
const B = "#000000";
const W = "#FFFFFF";
const R = "#FF4D4D";

interface FilesColumnProps {
  files: NotebookFile[];
  onUpload: (files: File[]) => void;
  onDeleteSelected: (ids: number[]) => void;
}

export default function FilesColumn({
  files,
  onUpload,
  onDeleteSelected,
}: FilesColumnProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [deleteMode, setDeleteMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [showConfirm, setShowConfirm] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
    const dropped = Array.from(e.dataTransfer.files);
    if (dropped.length) onUpload(dropped);
  }

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const picked = Array.from(e.target.files ?? []);
    if (picked.length) onUpload(picked);
    e.target.value = "";
  }

  function toggleSelect(id: number) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  function enterDeleteMode() {
    setDeleteMode(true);
    setSelectedIds([]);
  }

  function cancelDeleteMode() {
    setDeleteMode(false);
    setSelectedIds([]);
  }

  function confirmDelete() {
    onDeleteSelected(selectedIds);
    setDeleteMode(false);
    setSelectedIds([]);
    setShowConfirm(false);
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        background: W,
        borderRight: `2px solid ${B}`,
        overflow: "hidden",
      }}
    >
      {/* Column header */}
      <div
        style={{
          padding: "14px 14px 10px",
          borderBottom: `2px solid ${B}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexShrink: 0,
        }}
      >
        <span
          style={{
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: "0.62rem",
            fontWeight: 700,
            letterSpacing: "0.14em",
            color: "#555",
          }}
        >
          FILES
        </span>

        {/* Delete mode controls */}
        {deleteMode ? (
          <div style={{ display: "flex", gap: 6 }}>
            <button
              onClick={() => selectedIds.length > 0 && setShowConfirm(true)}
              disabled={selectedIds.length === 0}
              style={{
                background: selectedIds.length > 0 ? R : "#eee",
                color: selectedIds.length > 0 ? W : "#aaa",
                border: `1.5px solid ${selectedIds.length > 0 ? B : "#ccc"}`,
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: "0.62rem",
                fontWeight: 700,
                padding: "4px 8px",
                cursor: selectedIds.length > 0 ? "pointer" : "not-allowed",
                letterSpacing: "0.04em",
              }}
            >
              Delete selected
            </button>
            <button
              onClick={cancelDeleteMode}
              style={{
                background: W,
                color: B,
                border: `1.5px solid ${B}`,
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: "0.62rem",
                fontWeight: 700,
                padding: "4px 8px",
                cursor: "pointer",
                letterSpacing: "0.04em",
              }}
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={enterDeleteMode}
            disabled={files.length === 0}
            style={{
              background: "none",
              border: "none",
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: "0.62rem",
              fontWeight: 700,
              color: files.length === 0 ? "#ccc" : "#888",
              cursor: files.length === 0 ? "not-allowed" : "pointer",
              letterSpacing: "0.04em",
              textDecoration: "underline",
              textUnderlineOffset: 3,
              padding: 0,
            }}
          >
            Delete
          </button>
        )}
      </div>

      {/* Drop zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        style={{
          margin: 12,
          border: `2px dashed ${isDragging ? G : "#ccc"}`,
          background: isDragging ? "#f0fff0" : "#fafafa",
          padding: "16px 8px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 6,
          cursor: "pointer",
          flexShrink: 0,
          transition: "border-color 0.15s, background 0.15s",
        }}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path
            d="M12 16V8M12 8L9 11M12 8L15 11"
            stroke={isDragging ? G : "#aaa"}
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M4 16v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2"
            stroke={isDragging ? G : "#aaa"}
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </svg>
        <span
          style={{
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: "0.65rem",
            color: isDragging ? G : "#aaa",
            textAlign: "center",
            lineHeight: 1.5,
          }}
        >
          Drop files here
          <br />
          or click to upload
        </span>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,.doc,.docx,.txt"
          onChange={handleFileInput}
          style={{ display: "none" }}
        />
      </div>

      {/* File list */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
          gap: 4,
          padding: "0 12px 12px",
        }}
      >
        {files.length === 0 ? (
          <p
            style={{
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: "0.68rem",
              color: "#aaa",
              textAlign: "center",
              marginTop: 12,
            }}
          >
            No files yet
          </p>
        ) : (
          files.map((file) => (
            <FileItem
              key={file.id}
              file={file}
              deleteMode={deleteMode}
              selected={selectedIds.includes(file.id)}
              onToggleSelect={toggleSelect}
            />
          ))
        )}
      </div>

      {/* Delete confirmation modal */}
      {showConfirm && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "rgba(0,0,0,0.4)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 100,
          }}
        >
          <div
            style={{
              background: W,
              border: `2px solid ${B}`,
              boxShadow: `6px 6px 0 ${B}`,
              padding: "28px 32px",
              maxWidth: 300,
              width: "90%",
            }}
          >
            <p
              style={{
                fontFamily: "'Syne', sans-serif",
                fontWeight: 800,
                fontSize: "1rem",
                marginBottom: 8,
              }}
            >
              Delete {selectedIds.length} file
              {selectedIds.length > 1 ? "s" : ""}?
            </p>
            <p
              style={{
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: "0.72rem",
                color: "#555",
                marginBottom: 24,
                lineHeight: 1.5,
              }}
            >
              This cannot be undone.
            </p>
            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={confirmDelete}
                style={{
                  flex: 1,
                  background: R,
                  color: W,
                  border: `2px solid ${B}`,
                  boxShadow: `3px 3px 0 ${B}`,
                  padding: "10px",
                  fontFamily: "'IBM Plex Mono', monospace",
                  fontWeight: 700,
                  fontSize: "0.75rem",
                  cursor: "pointer",
                }}
              >
                Delete
              </button>
              <button
                onClick={() => setShowConfirm(false)}
                style={{
                  flex: 1,
                  background: W,
                  color: B,
                  border: `2px solid ${B}`,
                  padding: "10px",
                  fontFamily: "'IBM Plex Mono', monospace",
                  fontWeight: 700,
                  fontSize: "0.75rem",
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
