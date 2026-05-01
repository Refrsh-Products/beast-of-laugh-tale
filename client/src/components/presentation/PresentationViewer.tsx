import { useEffect, useRef } from "react";
import { Deck, Slide } from "@revealjs/react";
import resetCssUrl from "reveal.js/reset.css?url";
import revealCssUrl from "reveal.js/reveal.css?url";
import type { PresentationSession } from "../../services/presentation/Presentation.types";

const B = "#000000";
const W = "#FFFFFF";
const G = "#84e487";

interface PresentationViewerProps {
  presentation: PresentationSession;
  onClose: () => void;
}

export default function PresentationViewer({ presentation, onClose }: PresentationViewerProps) {
  const deckRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const links = [resetCssUrl, revealCssUrl].map((href) => {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = href;
      document.head.appendChild(link);
      return link;
    });
    return () => links.forEach((l) => l.remove());
  }, []);

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver(() => {
      deckRef.current?.layout();
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const slides = presentation.slides ?? [];

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
      {/* Top bar */}
      <div
        style={{
          height: 48,
          background: B,
          borderBottom: `2px solid #222`,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 24px",
          flexShrink: 0,
        }}
      >
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
            border: `1.5px solid #555`,
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
      </div>

      {/* Deck */}
      <div ref={containerRef} style={{ flex: 1, position: "relative", overflow: "hidden" }}>
        <Deck
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
                <div
                  style={{
                    textAlign: "left",
                    display: "flex",
                    flexDirection: "column",
                    height: "100%",
                    padding: "0.8em 0.8em 0.6em",
                    boxSizing: "border-box",
                  }}
                >
                  {/* Main content row */}
                  <div style={{ display: "flex", flex: 1, gap: 0, overflow: "hidden" }}>
                    {/* Green left strip */}
                    <div
                      style={{
                        width: 10,
                        background: G,
                        flexShrink: 0,
                        marginRight: "0.8em",
                        borderRadius: 2,
                      }}
                    />

                    <div
                      style={{
                        flex: 1,
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "center",
                        gap: "0.6em",
                        overflow: "hidden",
                      }}
                    >
                      {/* Title */}
                      <div
                        style={{
                          fontFamily: "'IBM Plex Mono', monospace",
                          fontSize: "2em",
                          fontWeight: 800,
                          color: B,
                          letterSpacing: "-0.03em",
                          lineHeight: 1.1,
                          borderBottom: `3px solid ${B}`,
                          paddingBottom: "0.2em",
                          marginBottom: "0.2em",
                        }}
                      >
                        {slide.title}
                      </div>

                      {/* Bullets */}
                      {slide.bullets && slide.bullets.length > 0 && (
                        <div style={{ display: "flex", flexDirection: "column", gap: "0.45em" }}>
                          {slide.bullets.map((bullet, i) => (
                            <div
                              key={i}
                              style={{
                                display: "flex",
                                gap: "0.55em",
                                alignItems: "flex-start",
                                fontFamily: "'IBM Plex Mono', monospace",
                                fontSize: "1em",
                                color: B,
                                lineHeight: 1.55,
                              }}
                            >
                              <span style={{ color: G, fontWeight: 700, flexShrink: 0 }}>•</span>
                              {bullet}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Footer */}
                  <div
                    style={{
                      borderTop: `1px solid #ddd`,
                      marginTop: "0.6em",
                      paddingTop: "0.4em",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      flexShrink: 0,
                    }}
                  >
                    <span
                      style={{
                        fontFamily: "'IBM Plex Mono', monospace",
                        fontSize: "0.55em",
                        color: "#999",
                        letterSpacing: "0.1em",
                      }}
                    >
                      {presentation.topic?.toUpperCase()}
                    </span>
                    <span
                      style={{
                        fontFamily: "'IBM Plex Mono', monospace",
                        fontSize: "0.55em",
                        color: "#999",
                      }}
                    >
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
