import { useState, useRef } from "react";
import type { NotebookFile } from "../../storage";
import FileItem from "./FileItem";

const G = "#84e487";
const B = "#000000";
const W = "#FFFFFF";
const R = "#FF4D4D";

export interface FileUploadState {
  name: string;
  status: "uploading" | "done" | "error";
  error?: string;
}

interface FilesColumnProps {
  files: NotebookFile[];
  onUpload: (files: File[]) => void;
  onDeleteSelected: (ids: string[]) => void;
  onDeleteOne: (id: string) => void;
  onRename: (id: string, newName: string) => void;
  uploadProgress?: FileUploadState[];
}

function SpinnerIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" style={{ flexShrink: 0 }}>
      <circle cx="7" cy="7" r="5" fill="none" stroke="#ddd" strokeWidth="2" />
      <path
        d="M7 2 A5 5 0 0 1 12 7"
        fill="none"
        stroke={B}
        strokeWidth="2"
        strokeLinecap="round"
      >
        <animateTransform
          attributeName="transform"
          type="rotate"
          from="0 7 7"
          to="360 7 7"
          dur="0.7s"
          repeatCount="indefinite"
        />
      </path>
    </svg>
  );
}

function UploadProgressItem({ item }: { item: FileUploadState }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: 8,
        padding: "8px 10px",
        background:
          item.status === "error"
            ? "#fff5f5"
            : item.status === "done"
              ? "#f5fff5"
              : "#fafafa",
        border: `1.5px solid ${item.status === "error" ? R : item.status === "done" ? G : "#ccc"}`,
      }}
    >
      {item.status === "uploading" && <SpinnerIcon />}
      {item.status === "done" && (
        <svg
          width="14"
          height="14"
          viewBox="0 0 14 14"
          fill="none"
          style={{ flexShrink: 0, marginTop: 1 }}
        >
          <circle cx="7" cy="7" r="6" fill={G} stroke={B} strokeWidth="1.5" />
          <path
            d="M4 7l2 2 4-4"
            stroke={B}
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
      {item.status === "error" && (
        <svg
          width="14"
          height="14"
          viewBox="0 0 14 14"
          fill="none"
          style={{ flexShrink: 0, marginTop: 1 }}
        >
          <circle cx="7" cy="7" r="6" fill={R} stroke={B} strokeWidth="1.5" />
          <path
            d="M5 5l4 4M9 5l-4 4"
            stroke={W}
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      )}
      <div style={{ flex: 1, overflow: "hidden" }}>
        <span
          style={{
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: "0.72rem",
            color: B,
            display: "block",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {item.name}
        </span>
        {item.status === "error" && item.error && (
          <span
            style={{
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: "0.62rem",
              color: R,
              display: "block",
              marginTop: 2,
              lineHeight: 1.4,
            }}
          >
            {item.error}
          </span>
        )}
        {item.status === "uploading" && (
          <span
            style={{
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: "0.62rem",
              color: "#888",
              display: "block",
              marginTop: 2,
            }}
          >
            Uploading...
          </span>
        )}
        {item.status === "done" && (
          <span
            style={{
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: "0.62rem",
              color: "#444",
              display: "block",
              marginTop: 2,
            }}
          >
            Processing
          </span>
        )}
      </div>
    </div>
  );
}

export default function FilesColumn({
  files,
  onUpload,
  onDeleteSelected,
  onDeleteOne,
  onRename,
  uploadProgress = [],
}: FilesColumnProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [bulkMode, setBulkMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
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

  function toggleSelect(id: string) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  function toggleBulkMode() {
    setBulkMode((v) => {
      if (v) setSelectedIds([]);
      return !v;
    });
  }

  function confirmDelete() {
    onDeleteSelected(selectedIds);
    setBulkMode(false);
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
        overflow: "hidden",
      }}
    >
      {/* Drop zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        onMouseEnter={(e) => {
          if (!isDragging) {
            (e.currentTarget as HTMLElement).style.borderColor = B;
            (e.currentTarget as HTMLElement).style.background = "#f0f0eb";
          }
        }}
        onMouseLeave={(e) => {
          if (!isDragging) {
            (e.currentTarget as HTMLElement).style.borderColor = "#ccc";
            (e.currentTarget as HTMLElement).style.background = "#fafafa";
          }
        }}
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
        {/* Bulk controls — only shown when files exist */}
        {files.length > 0 && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "flex-end",
              gap: 8,
              padding: "6px 0 2px",
            }}
          >
            {bulkMode && selectedIds.length > 0 && (
              <button
                onClick={() => setShowConfirm(true)}
                onMouseEnter={(e) => { e.currentTarget.style.transform = "translate(-2px, -2px)"; e.currentTarget.style.boxShadow = `3px 3px 0 ${B}`; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "none"; }}
                style={{
                  background: R,
                  color: W,
                  border: `1.5px solid ${B}`,
                  fontFamily: "'IBM Plex Mono', monospace",
                  fontSize: "0.6rem",
                  fontWeight: 700,
                  padding: "3px 8px",
                  cursor: "pointer",
                  letterSpacing: "0.04em",
                  whiteSpace: "nowrap",
                  transition: "transform 0.15s, box-shadow 0.15s",
                }}
              >
                Delete ({selectedIds.length})
              </button>
            )}
            <div
              onClick={toggleBulkMode}
              title="Bulk delete"
              style={{
                width: 16,
                height: 16,
                border: `2px solid ${R}`,
                background: bulkMode ? R : "transparent",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                transition: "background 0.12s",
              }}
            >
              {bulkMode && (
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                  <path
                    d="M1.5 5l2.5 2.5 4.5-5"
                    stroke={W}
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
            </div>
          </div>
        )}

        {uploadProgress.map((item, i) => (
          <UploadProgressItem key={`upload-${i}`} item={item} />
        ))}
        {files.length === 0 && uploadProgress.length === 0 ? (
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
              bulkMode={bulkMode}
              selected={selectedIds.includes(file.id)}
              onToggleSelect={toggleSelect}
              onDelete={onDeleteOne}
              onRename={onRename}
            />
          ))
        )}
      </div>

      {/* Bulk delete confirmation modal */}
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
                onMouseEnter={(e) => { e.currentTarget.style.transform = "translate(-3px, -3px)"; e.currentTarget.style.boxShadow = `6px 6px 0 ${B}`; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = `3px 3px 0 ${B}`; }}
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
                  transition: "transform 0.15s, box-shadow 0.15s",
                }}
              >
                Delete
              </button>
              <button
                onClick={() => setShowConfirm(false)}
                onMouseEnter={(e) => { e.currentTarget.style.transform = "translate(-3px, -3px)"; e.currentTarget.style.boxShadow = `3px 3px 0 ${B}`; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "none"; }}
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
                  transition: "transform 0.15s, box-shadow 0.15s",
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
