import type { PresentationSession } from "../../services/presentation/Presentation.types";

const B = "#000000";
const W = "#FFFFFF";
const G = "#84e487";

interface PastPresentationsColumnProps {
  presentations: PresentationSession[];
  onPresentationClick: (presentation: PresentationSession) => void;
}

export default function PastPresentationsColumn({
  presentations,
  onPresentationClick,
}: PastPresentationsColumnProps) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        background: W,
        borderLeft: `2px solid ${B}`,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          height: 44,
          padding: "0 14px",
          borderBottom: `2px solid ${B}`,
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
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
          YOUR SLIDES
        </span>
      </div>

      <div style={{ flex: 1, overflowY: "auto" }}>
        {presentations.length === 0 ? (
          <div style={{ padding: "32px 16px", textAlign: "center" }}>
            <p
              style={{
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: "0.7rem",
                color: "#bbb",
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
              return (
                <div
                  key={p.id}
                  onClick={() => !isLoading && onPresentationClick(p)}
                  onMouseEnter={(e) => {
                    if (!isLoading) e.currentTarget.style.background = "#f7f7f2";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = W;
                  }}
                  style={{
                    padding: "12px 14px 12px 12px",
                    borderBottom: `2px solid ${B}`,
                    borderLeft: `4px solid ${isLoading ? "#ccc" : G}`,
                    background: W,
                    cursor: isLoading ? "default" : "pointer",
                    animation: isLoading ? "presentation-card-pulse 1.6s ease-in-out infinite" : "none",
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
                        fontSize: "0.72rem",
                        fontWeight: 700,
                        color: isLoading ? "#aaa" : B,
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
                          fontSize: "0.68rem",
                          fontWeight: 700,
                          color: isLoading ? "#ccc" : B,
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
                        fontSize: "0.58rem",
                        color: isLoading ? "#bbb" : "#999",
                      }}
                    >
                      {isLoading ? "generating..." : timeAgo(p.generated_at)}
                    </span>
                    {!isLoading && (
                      <>
                        <span style={{ color: "#ccc" }}>·</span>
                        <span
                          style={{
                            fontFamily: "'IBM Plex Mono', monospace",
                            fontSize: "0.58rem",
                            color: "#666",
                            textTransform: "capitalize",
                          }}
                        >
                          {p.text_length.toLowerCase()}
                        </span>
                        <span style={{ color: "#ccc" }}>·</span>
                        <span
                          style={{
                            fontFamily: "'IBM Plex Mono', monospace",
                            fontSize: "0.58rem",
                            color: "#666",
                          }}
                        >
                          {p.slide_count} slides
                        </span>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </>
        )}
      </div>
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
