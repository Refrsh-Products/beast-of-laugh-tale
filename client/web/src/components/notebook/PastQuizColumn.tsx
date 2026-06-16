import { useState } from "react";
import type { QuizSession } from "@freshr/shared";
import QuizCard from "../quiz/QuizCard";

const B = "#000000";
const W = "#FFFFFF";
const R = "#FF4D4D";

interface PreviousQuizzesColumnProps {
  quizzes: QuizSession[];
  selectedQuizId: string | null;
  onQuizClick: (quiz: QuizSession) => void;
  onDeleteSelected: (ids: string[]) => void;
}

export default function PreviousQuizzesColumn({
  quizzes,
  selectedQuizId,
  onQuizClick,
  onDeleteSelected,
}: PreviousQuizzesColumnProps) {
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
          YOUR QUIZZES
        </span>

        {/* Bulk controls — only shown when quizzes exist */}
        {quizzes.length > 0 && (
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
        {quizzes.length === 0 ? (
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
              No quizzes yet.
              <br />
              Generate your first one.
            </p>
          </div>
        ) : (
          quizzes.map((quiz) => (
            <QuizCard
              key={quiz.id}
              quiz={quiz}
              selected={quiz.id === selectedQuizId}
              onClick={() => onQuizClick(quiz)}
              bulkMode={bulkMode}
              bulkSelected={selectedIds.includes(quiz.id!)}
              onToggleSelect={toggleSelect}
            />
          ))
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
              Delete {selectedIds.length} quiz
              {selectedIds.length > 1 ? "zes" : ""}?
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
