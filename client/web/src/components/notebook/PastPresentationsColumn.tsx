import { useState } from "react";
import type { PresentationSession } from "@freshr/shared";

const B = "#000000";
const W = "#FFFFFF";
const G = "#84e487";
const R = "#FF4D4D";

interface PastPresentationsColumnProps {
  presentations: PresentationSession[];
  onPresentationClick: (presentation: PresentationSession) => void;
  onDeleteSelected: (ids: string[]) => void;
}

export default function PastPresentationsColumn({
  presentations,
  onPresentationClick,
  onDeleteSelected,
}: PastPresentationsColumnProps) {
  const [bulkMode, setBulkMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showConfirm, setShowConfirm] = useState(false);

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
        borderLeft: `2px solid ${B}`,
        overflow: "hidden",
        position: "relative",
      }}
    >
      {/* Title */}
      <div
        style={{
          height: 44,
          padding: "0 14px",
          borderBottom: `2px solid ${B}`,
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <span
          style={{
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: "0.75rem",
            fontWeight: 700,
            letterSpacing: "0.14em",
            color: "#000000",
          }}
        >
          YOUR SLIDES
        </span>

        {/* Bulk controls — only shown when presentations exist */}
        {presentations.length > 0 && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            {bulkMode && selectedIds.length > 0 && (
              <button
                onClick={() => setShowConfirm(true)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translate(-2px, -2px)";
                  e.currentTarget.style.boxShadow = `3px 3px 0 ${B}`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "none";
                  e.currentTarget.style.boxShadow = "none";
                }}
                style={{
                  background: R,
                  color: W,
                  border: `1.5px solid ${B}`,
                  fontFamily: "'IBM Plex Mono', monospace",
                  fontSize: "0.75rem",
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
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: "auto" }}>
        {presentations.length === 0 ? (
          <div style={{ padding: "32px 16px", textAlign: "center" }}>
            <p
              style={{
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: "0.75rem",
                color: "#000000",
                lineHeight: 1.8,
                margin: 0,
              }}
            >
              No presentations yet.
              <br />
              Generate your first one.
            </p>
          </div>
        ) : (
          <>
            <style>{`
              @keyframes presentation-card-pulse {
                0%, 100% { opacity: 1; }
                50% { opacity: 0.45; }
              }
            `}</style>
            {presentations.map((p) => {
              const isLoading = p.status === "QUEUED" || p.status === "GENERATING";
              const bulkSelected = selectedIds.includes(p.id);

              function handleCardClick() {
                if (isLoading) return;
                if (bulkMode) {
                  toggleSelect(p.id);
                } else {
                  onPresentationClick(p);
                }
              }

              return (
                <div
                  key={p.id}
                  onClick={handleCardClick}
                  onMouseEnter={(e) => {
                    if (!isLoading && !bulkSelected)
                      e.currentTarget.style.background = "#f7f7f2";
                  }}
                  onMouseLeave={(e) => {
                    if (!bulkSelected) e.currentTarget.style.background = W;
                  }}
                  style={{
                    padding: "12px 14px 12px 12px",
                    borderBottom: `2px solid ${B}`,
                    borderLeft: `4px solid ${
                      bulkSelected ? R : isLoading ? "#ccc" : G
                    }`,
                    background: bulkSelected ? "#fff0f0" : W,
                    cursor: isLoading
                      ? "default"
                      : bulkMode
                        ? "pointer"
                        : "pointer",
                    animation: isLoading
                      ? "presentation-card-pulse 1.6s ease-in-out infinite"
                      : "none",
                    transition: "background 0.1s",
                    userSelect: "none",
                  }}
                >
                  {/* Title + slide count badge */}
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      gap: 8,
                      marginBottom: 8,
                    }}
                  >
                    <p
                      style={{
                        fontFamily: "'IBM Plex Mono', monospace",
                        fontSize: "0.75rem",
                        fontWeight: 700,
                        color: B,
                        margin: 0,
                        lineHeight: 1.4,
                        flex: 1,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {p.topic || "Presentation"}
                    </p>
                    <div
                      style={{
                        border: `2px solid ${isLoading ? "#ccc" : B}`,
                        padding: "2px 6px",
                        flexShrink: 0,
                      }}
                    >
                      <span
                        style={{
                          fontFamily: "'IBM Plex Mono', monospace",
                          fontSize: "0.75rem",
                          fontWeight: 700,
                          color: B,
                        }}
                      >
                        {isLoading ? "—" : `${p.slide_count}`}
                      </span>
                    </div>
                  </div>

                  {/* Meta row */}
                  <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                    <span
                      style={{
                        fontFamily: "'IBM Plex Mono', monospace",
                        fontSize: "0.75rem",
                        color: B,
                      }}
                    >
                      {isLoading ? "generating..." : timeAgo(p.generated_at)}
                    </span>
                    {!isLoading && (
                      <>
                        <span style={{ color: "#000000" }}>·</span>
                        <span
                          style={{
                            fontFamily: "'IBM Plex Mono', monospace",
                            fontSize: "0.75rem",
                            color: "#000000",
                            textTransform: "capitalize",
                          }}
                        >
                          {p.text_length.toLowerCase()}
                        </span>
                        <span style={{ color: "#000000" }}>·</span>
                        <span
                          style={{
                            fontFamily: "'IBM Plex Mono', monospace",
                            fontSize: "0.75rem",
                            color: "#000000",
                          }}
                        >
                          {p.slide_count} slides
                        </span>
                      </>
                    )}
                  </div>

                  {/* Bulk mode checkbox */}
                  {bulkMode && !isLoading && (
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "flex-end",
                        marginTop: 8,
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={bulkSelected}
                        onChange={() => toggleSelect(p.id)}
                        onClick={(e) => e.stopPropagation()}
                        style={{
                          cursor: "pointer",
                          accentColor: R,
                          width: 14,
                          height: 14,
                        }}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </>
        )}
      </div>

      {/* Bulk delete confirmation modal */}
      {showConfirm && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 2000,
            background: "rgba(0,0,0,0.4)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
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
              Delete {selectedIds.length} presentation
              {selectedIds.length > 1 ? "s" : ""}?
            </p>
            <p
              style={{
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: "0.75rem",
                color: "#000000",
                marginBottom: 24,
                lineHeight: 1.5,
              }}
            >
              This cannot be undone.
            </p>
            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={confirmDelete}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translate(-3px, -3px)";
                  e.currentTarget.style.boxShadow = `6px 6px 0 ${B}`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "none";
                  e.currentTarget.style.boxShadow = `3px 3px 0 ${B}`;
                }}
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
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translate(-3px, -3px)";
                  e.currentTarget.style.boxShadow = `3px 3px 0 ${B}`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "none";
                  e.currentTarget.style.boxShadow = "none";
                }}
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

function timeAgo(isoDate: string): string {
  if (!isoDate) return "";
  const diff = Date.now() - new Date(isoDate).getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  const weeks = Math.floor(days / 7);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return `${weeks}w ago`;
}
