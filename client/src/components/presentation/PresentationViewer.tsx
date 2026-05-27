import { useEffect, useRef, useState } from "react";
import { Deck, Slide } from "@revealjs/react";
import resetCssUrl from "reveal.js/reset.css?url";
import revealCssUrl from "reveal.js/reveal.css?url";
import type { PresentationSession, PresentationSlide } from "../../services/presentation/Presentation.types";
import SlideEditor from "./SlideEditor";
import { renderSlideContent, B, G, W } from "./SlideLayouts";
import { exportAsPdf, exportAsPptx } from "./exportPresentation";
import MobileDrawer from "../ui/MobileDrawer";
import { useMediaQuery } from "../../hooks/useMediaQuery";
import { BP_TABLET } from "../../constants/breakpoints";

interface AiMessage {
  role: "user" | "ai";
  content: string;
}

interface PresentationViewerProps {
  presentation: PresentationSession;
  onClose: () => void;
  onUpdate?: (updatedSlides: PresentationSlide[]) => void;
  onRefineSlide?: (slideId: string, feedback: string) => Promise<PresentationSlide>;
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
            {slide.title || slide.caption || slide.quote || "Untitled"}
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
                  color: "#000000",
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
  onRefineSlide,
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
  const [isRefining, setIsRefining] = useState(false);
  const [slideEditorKey, setSlideEditorKey] = useState(0);
  const [deckKey, setDeckKey] = useState(0);
  const [exportOpen, setExportOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const exportRef = useRef<HTMLDivElement>(null);
  const isCompact = useMediaQuery(BP_TABLET);
  const [chatDrawerOpen, setChatDrawerOpen] = useState(false);
  const [slidesDrawerOpen, setSlidesDrawerOpen] = useState(false);

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

  // Close export dropdown on outside click
  useEffect(() => {
    if (!exportOpen) return;
    function handleClick(e: MouseEvent) {
      if (exportRef.current && !exportRef.current.contains(e.target as Node)) {
        setExportOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [exportOpen]);

  async function handleExport(format: "pdf" | "pptx") {
    setExportOpen(false);
    setExporting(true);
    try {
      if (format === "pdf") await exportAsPdf(presentation);
      else await exportAsPptx(presentation);
    } finally {
      setExporting(false);
    }
  }

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

  async function handleSendChat() {
    if (!chatInput.trim() || isRefining) return;
    const content = chatInput.trim();
    setChatInput("");
    setAiPanelCollapsed(false);
    setAiMessages((prev) => [...prev, { role: "user", content }]);

    if (!onRefineSlide || !activeDraftSlide) {
      setAiMessages((prev) => [
        ...prev,
        { role: "ai", content: "AI slide editing is not available." },
      ]);
      return;
    }

    setIsRefining(true);
    try {
      const updatedSlide = await onRefineSlide(activeDraftSlide.id, content);
      updateSlide(currentSlideIndex, updatedSlide);
      setSlideEditorKey((k) => k + 1);
      setAiMessages((prev) => [
        ...prev,
        { role: "ai", content: "I have successfully made your changes." },
      ]);
    } catch {
      setAiMessages((prev) => [
        ...prev,
        { role: "ai", content: "Sorry, failed to update the slide, try again." },
      ]);
    } finally {
      setIsRefining(false);
    }
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
        padding: isCompact ? "0 12px" : "0 24px",
        flexShrink: 0,
        gap: 8,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0, flex: "1 1 0" }}>
        {editMode && isCompact && (
          <button
            onClick={() => setChatDrawerOpen(true)}
            aria-label="Open AI chat"
            style={{
              background: "transparent",
              border: "1.5px solid #555",
              color: "#aaa",
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: "0.85rem",
              padding: "2px 8px",
              cursor: "pointer",
              lineHeight: 1,
              flexShrink: 0,
            }}
          >
            ☰
          </button>
        )}
        <span
          style={{
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: "0.72rem",
            fontWeight: 700,
            color: G,
            letterSpacing: "0.1em",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            minWidth: 0,
          }}
        >
          {presentation.topic || "Presentation"}
        </span>
        {editMode && (
          <span
            style={{
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: "0.6rem",
              color: "#000000",
              letterSpacing: "0.08em",
            }}
          >
            · EDITING
          </span>
        )}
      </div>

      <div style={{ display: "flex", gap: isCompact ? 6 : 10, alignItems: "center", flexShrink: 0 }}>
        {editMode && isCompact && (
          <button
            onClick={() => setSlidesDrawerOpen(true)}
            aria-label="Open slide list"
            style={{
              background: "transparent",
              border: "1.5px solid #555",
              color: "#aaa",
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: "0.85rem",
              padding: "2px 8px",
              cursor: "pointer",
              lineHeight: 1,
              flexShrink: 0,
            }}
          >
            ▦
          </button>
        )}
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
            {/* Export dropdown */}
            <div ref={exportRef} style={{ position: "relative" }}>
              <button
                onClick={() => setExportOpen((o) => !o)}
                disabled={exporting}
                onMouseEnter={(e) => { if (!exporting) { e.currentTarget.style.borderColor = W; e.currentTarget.style.color = W; } }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#555"; e.currentTarget.style.color = "#aaa"; }}
                style={{
                  background: "transparent",
                  border: "1.5px solid #555",
                  color: "#aaa",
                  fontFamily: "'IBM Plex Mono', monospace",
                  fontSize: "0.72rem",
                  fontWeight: 700,
                  padding: "5px 14px",
                  cursor: exporting ? "not-allowed" : "pointer",
                  letterSpacing: "0.06em",
                  transition: "border-color 0.1s, color 0.1s",
                }}
              >
                {exporting ? "Exporting..." : "Export ▾"}
              </button>

              {exportOpen && (
                <div style={{
                  position: "absolute",
                  top: "calc(100% + 6px)",
                  right: 0,
                  background: "#111",
                  border: "1.5px solid #333",
                  minWidth: 150,
                  zIndex: 10,
                }}>
                  {(["pdf", "pptx"] as const).map((fmt) => (
                    <button
                      key={fmt}
                      onClick={() => handleExport(fmt)}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "#222")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                      style={{
                        display: "block",
                        width: "100%",
                        background: "transparent",
                        border: "none",
                        color: "#aaa",
                        fontFamily: "'IBM Plex Mono', monospace",
                        fontSize: "0.72rem",
                        fontWeight: 700,
                        padding: "10px 16px",
                        cursor: "pointer",
                        textAlign: "left",
                        letterSpacing: "0.06em",
                        transition: "background 0.1s",
                      }}
                    >
                      {fmt === "pdf" ? "Export as PDF" : "Export as PPTX"}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={enterEditMode}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = W; e.currentTarget.style.color = W; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#555"; e.currentTarget.style.color = "#aaa"; }}
              style={{ background: "transparent", border: "1.5px solid #555", color: "#aaa", fontFamily: "'IBM Plex Mono', monospace", fontSize: "0.72rem", fontWeight: 700, padding: "5px 14px", cursor: "pointer", letterSpacing: "0.06em", transition: "border-color 0.1s, color 0.1s" }}
            >
              Edit
            </button>
            <button
              onClick={onClose}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = W; e.currentTarget.style.color = W; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#555"; e.currentTarget.style.color = "#aaa"; }}
              style={{ background: "transparent", border: "1.5px solid #555", color: "#aaa", fontFamily: "'IBM Plex Mono', monospace", fontSize: "0.72rem", fontWeight: 700, padding: "5px 14px", cursor: "pointer", letterSpacing: "0.06em", transition: "border-color 0.1s, color 0.1s" }}
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
                      <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "0.55em", color: "#000000", letterSpacing: "0.1em" }}>
                        {presentation.topic?.toUpperCase()}
                      </span>
                      <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "0.55em", color: "#000000" }}>
                        {slide.order_index + 1} / {slides.length}
                      </span>
                    </div>
                  </div>
                </Slide>
              ))
            ) : (
              <Slide background={W}>
                <p style={{ fontFamily: "'IBM Plex Mono', monospace", color: "#000000" }}>
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
  const showAiPanelInline = showAiPanel && !isCompact;

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

        {/* AI chat panel (inline on desktop) */}
        {showAiPanelInline && (
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
                    color: "#000000",
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
                      color: "#000000",
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
                      color: "#000000",
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
                  {isRefining && (
                    <div style={{ marginBottom: 12, display: "flex", alignItems: "flex-start" }}>
                      <div
                        style={{
                          padding: "8px 10px",
                          background: "#f0f0f0",
                          fontFamily: "'IBM Plex Mono', monospace",
                          fontSize: "0.68rem",
                          color: "#000000",
                        }}
                      >
                        Thinking...
                      </div>
                    </div>
                  )}
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
                key={`${activeDraftSlide.id}-${slideEditorKey}`}
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
              disabled={isRefining}
              style={{
                flex: 1,
                border: `2px solid ${B}`,
                borderRadius: 0,
                padding: "8px 12px",
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: "0.72rem",
                outline: "none",
                background: isRefining ? "#f5f5f5" : W,
                opacity: isRefining ? 0.6 : 1,
              }}
            />
            <button
              onClick={handleSendChat}
              disabled={isRefining}
              style={{
                background: isRefining ? "#555" : B,
                color: W,
                border: `2px solid ${isRefining ? "#555" : B}`,
                padding: "8px 16px",
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: "0.72rem",
                fontWeight: 700,
                cursor: isRefining ? "not-allowed" : "pointer",
                letterSpacing: "0.04em",
              }}
            >
              Send
            </button>
          </div>
        </div>

        {/* Right: slide thumbnails (inline on desktop) */}
        {!isCompact && (
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
                  color: "#000000",
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
        )}
      </div>

      {/* Mobile drawers for AI chat + slide list */}
      {isCompact && (
        <>
          <MobileDrawer
            open={chatDrawerOpen}
            onClose={() => setChatDrawerOpen(false)}
            side="left"
            width="min(320px, 90vw)"
            ariaLabel="AI chat"
          >
            <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
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
                    color: "#000000",
                  }}
                >
                  AI CHAT
                </span>
                <button
                  onClick={() => setChatDrawerOpen(false)}
                  aria-label="Close chat"
                  style={{
                    background: "transparent",
                    border: "none",
                    cursor: "pointer",
                    fontFamily: "'IBM Plex Mono', monospace",
                    fontSize: "0.85rem",
                    fontWeight: 700,
                    color: "#000000",
                    padding: "0 4px",
                  }}
                >
                  ×
                </button>
              </div>
              <div style={{ flex: 1, overflowY: "auto", padding: 12 }}>
                {aiMessages.length === 0 && (
                  <div
                    style={{
                      fontFamily: "'IBM Plex Mono', monospace",
                      fontSize: "0.7rem",
                      color: "#666",
                      padding: 8,
                    }}
                  >
                    No messages yet. Ask AI to edit the current slide using the input below.
                  </div>
                )}
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
                        fontSize: "0.7rem",
                        lineHeight: 1.5,
                      }}
                    >
                      {msg.content}
                    </div>
                  </div>
                ))}
                {isRefining && (
                  <div style={{ display: "flex", alignItems: "flex-start" }}>
                    <div
                      style={{
                        padding: "8px 10px",
                        background: "#f0f0f0",
                        fontFamily: "'IBM Plex Mono', monospace",
                        fontSize: "0.7rem",
                        color: "#000000",
                      }}
                    >
                      Thinking...
                    </div>
                  </div>
                )}
              </div>
            </div>
          </MobileDrawer>

          <MobileDrawer
            open={slidesDrawerOpen}
            onClose={() => setSlidesDrawerOpen(false)}
            side="right"
            width="min(220px, 75vw)"
            ariaLabel="Slide list"
          >
            <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
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
                    color: "#000000",
                  }}
                >
                  SLIDES
                </span>
                <button
                  onClick={() => setSlidesDrawerOpen(false)}
                  aria-label="Close slide list"
                  style={{
                    background: "transparent",
                    border: "none",
                    cursor: "pointer",
                    fontFamily: "'IBM Plex Mono', monospace",
                    fontSize: "0.85rem",
                    fontWeight: 700,
                    color: "#000000",
                    padding: "0 4px",
                  }}
                >
                  ×
                </button>
              </div>
              <div style={{ flex: 1, overflowY: "auto" }}>
                {draftSlides.map((slide, i) => (
                  <SlideThumbnail
                    key={slide.id}
                    slide={slide}
                    index={i}
                    selected={i === currentSlideIndex}
                    onClick={() => {
                      setCurrentSlideIndex(i);
                      setSlidesDrawerOpen(false);
                    }}
                  />
                ))}
              </div>
            </div>
          </MobileDrawer>
        </>
      )}
    </div>
  );
}
