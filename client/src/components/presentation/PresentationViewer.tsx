import { useEffect, useRef, useState } from "react";
import { Deck, Slide } from "@revealjs/react";
import resetCssUrl from "reveal.js/reset.css?url";
import revealCssUrl from "reveal.js/reveal.css?url";
import type { PresentationSession, PresentationSlide } from "../../services/presentation/Presentation.types";
import SlideEditor from "./SlideEditor";

const B = "#000000";
const W = "#FFFFFF";
const G = "#84e487";

// ─── Layout renderers ─────────────────────────────────────────────────────────

function renderSlideContent(slide: PresentationSlide): React.ReactNode {
  const strip = (
    <div style={{ width: 10, background: G, flexShrink: 0, marginRight: "0.8em", borderRadius: 2 }} />
  );

  const title = (
    <div style={{
      fontFamily: "'IBM Plex Mono', monospace",
      fontSize: "2em",
      fontWeight: 800,
      color: B,
      letterSpacing: "-0.03em",
      lineHeight: 1.1,
      borderBottom: `3px solid ${B}`,
      paddingBottom: "0.2em",
      marginBottom: "0.25em",
    }}>
      {slide.title}
    </div>
  );

  const bullets = (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.45em" }}>
      {slide.bullets.map((b, i) => (
        <div key={i} style={{ display: "flex", gap: "0.55em", alignItems: "flex-start", fontFamily: "'IBM Plex Mono', monospace", fontSize: "1em", color: B, lineHeight: 1.55 }}>
          <span style={{ color: G, fontWeight: 700, flexShrink: 0 }}>•</span>
          {b}
        </div>
      ))}
    </div>
  );

  const imgStyle: React.CSSProperties = {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    border: `2px solid ${B}`,
    display: "block",
  };

  switch (slide.layout) {

    case "bullets":
      return (
        <>
          {strip}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", gap: "0.6em", overflow: "hidden" }}>
            {title}
            {bullets}
          </div>
        </>
      );

    case "title-only":
      return (
        <>
          {strip}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
            <div style={{
              fontFamily: "'Syne', sans-serif",
              fontSize: "3em",
              fontWeight: 800,
              color: B,
              letterSpacing: "-0.04em",
              lineHeight: 1.05,
            }}>
              {slide.title}
            </div>
          </div>
        </>
      );

    case "body-text":
      return (
        <>
          {strip}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", gap: "0.6em", overflow: "hidden" }}>
            {title}
            <div style={{
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: "0.9em",
              color: "#333",
              lineHeight: 1.8,
            }}>
              {slide.body_text || slide.bullets.join(" ")}
            </div>
          </div>
        </>
      );

    case "two-col": {
      const half = Math.ceil(slide.bullets.length / 2);
      const left = slide.bullets.slice(0, half);
      const right = slide.bullets.slice(half);
      return (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <div style={{ display: "flex", marginBottom: "0.5em" }}>
            {strip}
            {title}
          </div>
          <div style={{ display: "flex", flex: 1, gap: "1.5em", overflow: "hidden" }}>
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "0.45em", borderRight: "1px solid #eee", paddingRight: "1.5em" }}>
              {left.map((b, i) => (
                <div key={i} style={{ display: "flex", gap: "0.55em", fontFamily: "'IBM Plex Mono', monospace", fontSize: "0.9em", color: B, lineHeight: 1.55 }}>
                  <span style={{ color: G, fontWeight: 700, flexShrink: 0 }}>•</span>{b}
                </div>
              ))}
            </div>
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "0.45em" }}>
              {right.map((b, i) => (
                <div key={i} style={{ display: "flex", gap: "0.55em", fontFamily: "'IBM Plex Mono', monospace", fontSize: "0.9em", color: B, lineHeight: 1.55 }}>
                  <span style={{ color: G, fontWeight: 700, flexShrink: 0 }}>•</span>{b}
                </div>
              ))}
            </div>
          </div>
        </div>
      );
    }

    case "image-right":
      return (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <div style={{ display: "flex", marginBottom: "0.5em" }}>
            {strip}
            {title}
          </div>
          <div style={{ display: "flex", flex: 1, gap: "1.5em", overflow: "hidden" }}>
            <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
              {bullets}
            </div>
            <div style={{ width: "42%", flexShrink: 0 }}>
              {slide.images[0] && <img src={slide.images[0]} alt="" style={imgStyle} />}
            </div>
          </div>
        </div>
      );

    case "image-left":
      return (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <div style={{ display: "flex", marginBottom: "0.5em" }}>
            {strip}
            {title}
          </div>
          <div style={{ display: "flex", flex: 1, gap: "1.5em", overflow: "hidden" }}>
            <div style={{ width: "42%", flexShrink: 0 }}>
              {slide.images[0] && <img src={slide.images[0]} alt="" style={imgStyle} />}
            </div>
            <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
              {bullets}
            </div>
          </div>
        </div>
      );

    case "full-image":
      return (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "0.4em", overflow: "hidden" }}>
          <div style={{ flex: 1, overflow: "hidden" }}>
            {slide.images[0] && <img src={slide.images[0]} alt="" style={{ ...imgStyle, height: "100%" }} />}
          </div>
          {(slide.caption || slide.title) && (
            <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "0.75em", color: "#555", fontStyle: "italic", paddingLeft: "0.3em", flexShrink: 0 }}>
              {slide.caption || slide.title}
            </div>
          )}
        </div>
      );

    case "image-top":
      return (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "0.6em", overflow: "hidden" }}>
          <div style={{ flex: "0 0 50%", overflow: "hidden" }}>
            {slide.images[0] && <img src={slide.images[0]} alt="" style={{ ...imgStyle, height: "100%" }} />}
          </div>
          <div style={{ display: "flex", overflow: "hidden" }}>
            {strip}
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "0.35em" }}>
              <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "1.4em", fontWeight: 800, color: B, borderBottom: `2px solid ${B}`, paddingBottom: "0.15em" }}>
                {slide.title}
              </div>
              {slide.bullets.slice(0, 2).map((b, i) => (
                <div key={i} style={{ display: "flex", gap: "0.55em", fontFamily: "'IBM Plex Mono', monospace", fontSize: "0.85em", color: B, lineHeight: 1.5 }}>
                  <span style={{ color: G, fontWeight: 700 }}>•</span>{b}
                </div>
              ))}
            </div>
          </div>
        </div>
      );

    case "quote":
      return (
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ textAlign: "center", padding: "0 2em" }}>
            <div style={{ fontFamily: "'Syne', sans-serif", fontSize: "2.5em", fontWeight: 800, color: G, lineHeight: 1, marginBottom: "0.2em" }}>❝</div>
            <div style={{ fontFamily: "'Syne', sans-serif", fontSize: "1.4em", fontWeight: 700, color: B, lineHeight: 1.35, letterSpacing: "-0.02em", marginBottom: "0.6em" }}>
              {slide.quote || slide.title}
            </div>
            {(slide.quote_source || slide.bullets[0]) && (
              <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "0.7em", color: "#666", letterSpacing: "0.06em" }}>
                — {slide.quote_source || slide.bullets[0]}
              </div>
            )}
          </div>
        </div>
      );

    case "two-images":
      return (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", gap: "0.5em" }}>
          <div style={{ display: "flex" }}>
            {strip}
            {title}
          </div>
          <div style={{ display: "flex", flex: 1, gap: "1em", overflow: "hidden" }}>
            {[0, 1].map((idx) => (
              <div key={idx} style={{ flex: 1, display: "flex", flexDirection: "column", gap: "0.3em", overflow: "hidden" }}>
                <div style={{ flex: 1, overflow: "hidden" }}>
                  {slide.images[idx] && <img src={slide.images[idx]} alt="" style={{ ...imgStyle, height: "100%" }} />}
                </div>
                {slide.bullets[idx] && (
                  <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "0.65em", color: "#555", textAlign: "center", flexShrink: 0 }}>
                    {slide.bullets[idx]}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      );

    default:
      return (
        <>
          {strip}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", gap: "0.6em" }}>
            {title}
            {bullets}
          </div>
        </>
      );
  }
}

interface AiMessage {
  role: "user" | "ai";
  content: string;
}

interface PresentationViewerProps {
  presentation: PresentationSession;
  onClose: () => void;
  onUpdate?: (updatedSlides: PresentationSlide[]) => void;
}

// ─── Slide thumbnail (right panel) ───────────────────────────────────────────

function SlideThumbnail({
  slide,
  index,
  selected,
  onClick,
}: {
  slide: PresentationSlide;
  index: number;
  selected: boolean;
  onClick: () => void;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        padding: "10px",
        borderBottom: "1px solid #f0f0f0",
        cursor: "pointer",
        background: selected ? "#f0fdf0" : hovered ? "#fafafa" : "transparent",
        transition: "background 0.1s",
      }}
    >
      {/* 16:9 thumbnail */}
      <div
        style={{
          width: "100%",
          aspectRatio: "16 / 9",
          background: W,
          border: `${selected ? 2 : 1}px solid ${selected ? B : "#ddd"}`,
          boxShadow: selected ? `2px 2px 0 ${B}` : "none",
          display: "flex",
          overflow: "hidden",
          transition: "border-color 0.1s, box-shadow 0.1s",
        }}
      >
        <div style={{ width: 4, background: G, flexShrink: 0 }} />
        <div
          style={{
            flex: 1,
            padding: "5px 7px",
            display: "flex",
            flexDirection: "column",
            gap: 3,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: "0.42rem",
              fontWeight: 700,
              color: B,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              lineHeight: 1.2,
            }}
          >
            {slide.title || "Untitled"}
          </div>
          {slide.bullets.slice(0, 3).map((bullet, i) => (
            <div key={i} style={{ display: "flex", gap: 3, alignItems: "flex-start" }}>
              <div
                style={{
                  width: 2,
                  height: 2,
                  background: G,
                  flexShrink: 0,
                  borderRadius: "50%",
                  marginTop: 2,
                }}
              />
              <div
                style={{
                  fontFamily: "'IBM Plex Mono', monospace",
                  fontSize: "0.32rem",
                  color: "#666",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  lineHeight: 1.3,
                }}
              >
                {bullet}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Slide number */}
      <div
        style={{
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: "0.58rem",
          color: selected ? B : "#aaa",
          fontWeight: selected ? 700 : 400,
          marginTop: 5,
          textAlign: "center",
        }}
      >
        {index + 1}
      </div>
    </div>
  );
}

// ─── Main viewer ─────────────────────────────────────────────────────────────

export default function PresentationViewer({
  presentation,
  onClose,
  onUpdate,
}: PresentationViewerProps) {
  const deckRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const [editMode, setEditMode] = useState(false);
  const [draftSlides, setDraftSlides] = useState<PresentationSlide[]>([]);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [aiMessages, setAiMessages] = useState<AiMessage[]>([]);
  const [aiPanelCollapsed, setAiPanelCollapsed] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [deckKey, setDeckKey] = useState(0);

  // Inject / remove reveal.js CSS in normal mode
  useEffect(() => {
    if (editMode) return;
    const links = [resetCssUrl, revealCssUrl].map((href) => {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = href;
      document.head.appendChild(link);
      return link;
    });
    return () => links.forEach((l) => l.remove());
  }, [editMode]);

  // ResizeObserver for reveal.js layout
  useEffect(() => {
    if (editMode || !containerRef.current) return;
    const observer = new ResizeObserver(() => deckRef.current?.layout());
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [editMode]);

  // Scroll AI chat to bottom on new message
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [aiMessages]);

  const slides = presentation.slides ?? [];

  function enterEditMode() {
    const currentIndex = deckRef.current?.getIndices()?.h ?? 0;
    setDraftSlides(slides.map((s) => ({ ...s, bullets: [...s.bullets] })));
    setCurrentSlideIndex(currentIndex);
    setEditMode(true);
  }

  function commitEdits() {
    onUpdate?.(draftSlides);
    setDeckKey((k) => k + 1);
    setEditMode(false);
    setDraftSlides([]);
    setAiMessages([]);
  }

  function discardEdits() {
    if (draftSlides.length > 0) {
      if (!window.confirm("Discard changes?")) return;
    }
    setEditMode(false);
    setDraftSlides([]);
    setAiMessages([]);
  }

  function updateSlide(index: number, updated: PresentationSlide) {
    setDraftSlides((prev) => prev.map((s, i) => (i === index ? updated : s)));
  }

  function handleSendChat() {
    if (!chatInput.trim()) return;
    const content = chatInput.trim();
    setChatInput("");
    setAiMessages((prev) => [
      ...prev,
      { role: "user", content },
      {
        role: "ai",
        content:
          "AI slide editing is coming soon. Edit slides directly for now.",
      },
    ]);
    setAiPanelCollapsed(false);
  }

  const showAiPanel = aiMessages.length > 0;

  // ── Top bar ─────────────────────────────────────────────────────────────────

  const topBar = (
    <div
      style={{
        height: 48,
        background: B,
        borderBottom: "2px solid #222",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 24px",
        flexShrink: 0,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <span
          style={{
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: "0.72rem",
            fontWeight: 700,
            color: G,
            letterSpacing: "0.1em",
          }}
        >
          {presentation.topic || "Presentation"}
        </span>
        {editMode && (
          <span
            style={{
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: "0.6rem",
              color: "#666",
              letterSpacing: "0.08em",
            }}
          >
            · EDITING
          </span>
        )}
      </div>

      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
        {editMode ? (
          <>
            <button
              onClick={commitEdits}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = G;
                e.currentTarget.style.color = B;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
                e.currentTarget.style.color = G;
              }}
              style={{
                background: "transparent",
                border: `1.5px solid ${G}`,
                color: G,
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: "0.72rem",
                fontWeight: 700,
                padding: "5px 14px",
                cursor: "pointer",
                letterSpacing: "0.06em",
                transition: "background 0.1s, color 0.1s",
              }}
            >
              Done editing
            </button>
            <button
              onClick={discardEdits}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = W;
                e.currentTarget.style.color = W;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "#555";
                e.currentTarget.style.color = "#aaa";
              }}
              style={{
                background: "transparent",
                border: "1.5px solid #555",
                color: "#aaa",
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: "0.72rem",
                fontWeight: 700,
                padding: "5px 14px",
                cursor: "pointer",
                letterSpacing: "0.06em",
                transition: "border-color 0.1s, color 0.1s",
              }}
            >
              × Discard
            </button>
          </>
        ) : (
          <>
            <button
              onClick={enterEditMode}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = W;
                e.currentTarget.style.color = W;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "#555";
                e.currentTarget.style.color = "#aaa";
              }}
              style={{
                background: "transparent",
                border: "1.5px solid #555",
                color: "#aaa",
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: "0.72rem",
                fontWeight: 700,
                padding: "5px 14px",
                cursor: "pointer",
                letterSpacing: "0.06em",
                transition: "border-color 0.1s, color 0.1s",
              }}
            >
              Edit
            </button>
            <button
              onClick={onClose}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = W;
                e.currentTarget.style.color = W;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "#555";
                e.currentTarget.style.color = "#aaa";
              }}
              style={{
                background: "transparent",
                border: "1.5px solid #555",
                color: "#aaa",
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: "0.72rem",
                fontWeight: 700,
                padding: "5px 14px",
                cursor: "pointer",
                letterSpacing: "0.06em",
                transition: "border-color 0.1s, color 0.1s",
              }}
            >
              × Close
            </button>
          </>
        )}
      </div>
    </div>
  );

  // ── Normal mode (reveal.js) ──────────────────────────────────────────────────

  if (!editMode) {
    return (
      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 1000,
          background: B,
          display: "flex",
          flexDirection: "column",
        }}
      >
        {topBar}
        <div ref={containerRef} style={{ flex: 1, position: "relative", overflow: "hidden" }}>
          <Deck
            key={deckKey}
            onReady={(d) => { deckRef.current = d; }}
            config={{
              embedded: true,
              width: 1280,
              height: 720,
              margin: 0.08,
              controls: true,
              controlsTutorial: false,
              progress: true,
              center: true,
              transition: "slide",
              keyboard: true,
            }}
          >
            {slides.length > 0 ? (
              slides.map((slide) => (
                <Slide key={slide.id} background={W}>
                  <div style={{ textAlign: "left", display: "flex", flexDirection: "column", height: "100%", padding: "0.8em 0.8em 0.6em", boxSizing: "border-box" }}>
                    <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
                      {renderSlideContent(slide)}
                    </div>
                    <div style={{ borderTop: "1px solid #ddd", marginTop: "0.6em", paddingTop: "0.4em", display: "flex", justifyContent: "space-between", flexShrink: 0 }}>
                      <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "0.55em", color: "#999", letterSpacing: "0.1em" }}>
                        {presentation.topic?.toUpperCase()}
                      </span>
                      <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "0.55em", color: "#999" }}>
                        {slide.order_index + 1} / {slides.length}
                      </span>
                    </div>
                  </div>
                </Slide>
              ))
            ) : (
              <Slide background={W}>
                <p style={{ fontFamily: "'IBM Plex Mono', monospace", color: "#aaa" }}>
                  No slides available.
                </p>
              </Slide>
            )}
          </Deck>
        </div>
      </div>
    );
  }

  // ── Edit mode ────────────────────────────────────────────────────────────────

  const activeDraftSlide = draftSlides[currentSlideIndex];

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        background: "#f5f5f0",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {topBar}

      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>

        {/* AI chat panel */}
        {showAiPanel && (
          <div
            style={{
              width: aiPanelCollapsed ? 36 : 260,
              flexShrink: 0,
              borderRight: `2px solid ${B}`,
              background: W,
              display: "flex",
              flexDirection: "column",
              transition: "width 0.2s",
              overflow: "hidden",
            }}
          >
            {aiPanelCollapsed ? (
              /* Collapsed strip */
              <div
                style={{
                  height: "100%",
                  display: "flex",
                  alignItems: "flex-start",
                  justifyContent: "center",
                  paddingTop: 12,
                }}
              >
                <button
                  onClick={() => setAiPanelCollapsed(false)}
                  title="Expand chat"
                  style={{
                    background: "transparent",
                    border: "none",
                    cursor: "pointer",
                    fontFamily: "'IBM Plex Mono', monospace",
                    fontSize: "0.7rem",
                    fontWeight: 700,
                    color: "#888",
                    padding: 4,
                  }}
                >
                  »
                </button>
              </div>
            ) : (
              /* Expanded panel */
              <>
                <div
                  style={{
                    height: 40,
                    borderBottom: `2px solid ${B}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "0 12px",
                    flexShrink: 0,
                  }}
                >
                  <span
                    style={{
                      fontFamily: "'IBM Plex Mono', monospace",
                      fontSize: "0.6rem",
                      fontWeight: 700,
                      letterSpacing: "0.1em",
                      color: "#555",
                    }}
                  >
                    AI CHAT
                  </span>
                  <button
                    onClick={() => setAiPanelCollapsed(true)}
                    style={{
                      background: "transparent",
                      border: "none",
                      cursor: "pointer",
                      fontFamily: "'IBM Plex Mono', monospace",
                      fontSize: "0.7rem",
                      fontWeight: 700,
                      color: "#aaa",
                      padding: "0 4px",
                    }}
                  >
                    «
                  </button>
                </div>

                <div style={{ flex: 1, overflowY: "auto", padding: "12px" }}>
                  {aiMessages.map((msg, i) => (
                    <div
                      key={i}
                      style={{
                        marginBottom: 12,
                        display: "flex",
                        flexDirection: "column",
                        alignItems: msg.role === "user" ? "flex-end" : "flex-start",
                      }}
                    >
                      <div
                        style={{
                          maxWidth: "85%",
                          padding: "8px 10px",
                          background: msg.role === "user" ? B : "#f0f0f0",
                          color: msg.role === "user" ? W : B,
                          fontFamily: "'IBM Plex Mono', monospace",
                          fontSize: "0.68rem",
                          lineHeight: 1.5,
                        }}
                      >
                        {msg.content}
                      </div>
                    </div>
                  ))}
                  <div ref={chatEndRef} />
                </div>
              </>
            )}
          </div>
        )}

        {/* Center: slide editor + chat input */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            borderRight: `2px solid ${B}`,
          }}
        >
          {/* Slide editor */}
          <div style={{ flex: 1, overflow: "hidden" }}>
            {activeDraftSlide && (
              <SlideEditor
                key={activeDraftSlide.id}
                slide={activeDraftSlide}
                totalSlides={draftSlides.length}
                onChange={(updated) => updateSlide(currentSlideIndex, updated)}
              />
            )}
          </div>

          {/* Chat input */}
          <div
            style={{
              borderTop: `2px solid ${B}`,
              padding: "12px 16px",
              display: "flex",
              gap: 10,
              background: W,
              flexShrink: 0,
            }}
          >
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSendChat()}
              placeholder="Ask AI to edit this slide..."
              style={{
                flex: 1,
                border: `2px solid ${B}`,
                borderRadius: 0,
                padding: "8px 12px",
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: "0.72rem",
                outline: "none",
                background: W,
              }}
            />
            <button
              onClick={handleSendChat}
              style={{
                background: B,
                color: W,
                border: `2px solid ${B}`,
                padding: "8px 16px",
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: "0.72rem",
                fontWeight: 700,
                cursor: "pointer",
                letterSpacing: "0.04em",
              }}
            >
              Send
            </button>
          </div>
        </div>

        {/* Right: slide thumbnails */}
        <div
          style={{
            width: 180,
            flexShrink: 0,
            overflowY: "auto",
            background: W,
          }}
        >
          <div
            style={{
              height: 40,
              borderBottom: `2px solid ${B}`,
              display: "flex",
              alignItems: "center",
              padding: "0 12px",
            }}
          >
            <span
              style={{
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: "0.6rem",
                fontWeight: 700,
                letterSpacing: "0.1em",
                color: "#555",
              }}
            >
              SLIDES
            </span>
          </div>
          {draftSlides.map((slide, i) => (
            <SlideThumbnail
              key={slide.id}
              slide={slide}
              index={i}
              selected={i === currentSlideIndex}
              onClick={() => setCurrentSlideIndex(i)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
