import { useRef, useEffect } from "react";
import { Deck, Slide } from "@revealjs/react";
import resetCssUrl from "reveal.js/reset.css?url";
import revealCssUrl from "reveal.js/reveal.css?url";

const B = "#000000";

interface ThemeConfig {
  bg: string;
  text: string;
  accent: string;
  label: string;
}

interface PresentationPreviewProps {
  theme: string;
  themeConfig: ThemeConfig;
}

export default function PresentationPreview({ theme, themeConfig }: PresentationPreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const deckRef = useRef<any>(null);
  const fontFamily = theme === "serif" ? "'Georgia', serif" : "'IBM Plex Mono', monospace";

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

  return (
    <div
      ref={containerRef}
      style={{
        width: "100%",
        aspectRatio: "16 / 9",
        border: `2px solid ${B}`,
        overflow: "hidden",
        position: "relative",
      }}
    >
      <Deck
        key={theme}
        onReady={(d) => { deckRef.current = d; }}
        config={{
          embedded: true,
          width: 480,
          height: 270,
          margin: 0.08,
          controls: false,
          controlsTutorial: false,
          progress: false,
          center: true,
          transition: "none",
          backgroundTransition: "none",
        }}
      >
        <Slide background={themeConfig.bg}>
          <div
            style={{
              textAlign: "left",
              padding: "0 36px",
              display: "flex",
              flexDirection: "column",
              height: "100%",
              justifyContent: "space-between",
              paddingBottom: "0.8em",
            }}
          >
            {/* Main content */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75em" }}>

              {/* Title */}
              <div>
                <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "0.45em", fontWeight: 700, letterSpacing: "0.14em", color: themeConfig.accent, marginBottom: "0.2em", opacity: 0.9 }}>
                  TITLE
                </div>
                <div
                  style={{
                    fontFamily,
                    fontSize: "1.6em",
                    fontWeight: theme === "freshr" ? 800 : 700,
                    color: themeConfig.text,
                    letterSpacing: theme === "freshr" ? "-0.03em" : "normal",
                    lineHeight: 1.1,
                    borderBottom: theme === "freshr" ? `2px solid ${B}` : "none",
                    paddingBottom: theme === "freshr" ? "0.2em" : 0,
                  }}
                >
                  Presentation Slide Title
                </div>
              </div>

              {/* Body text */}
              <div>
                <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "0.45em", fontWeight: 700, letterSpacing: "0.14em", color: themeConfig.accent, marginBottom: "0.2em", opacity: 0.9 }}>
                  BODY TEXT
                </div>
                <div
                  style={{
                    fontFamily,
                    fontSize: "0.75em",
                    color: themeConfig.text,
                    opacity: 0.75,
                    lineHeight: 1.65,
                  }}
                >
                  Supporting paragraph text that provides context and detail for the main topic of this slide.
                </div>
              </div>

              {/* Bullet points */}
              <div>
                <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "0.45em", fontWeight: 700, letterSpacing: "0.14em", color: themeConfig.accent, marginBottom: "0.3em", opacity: 0.9 }}>
                  BULLETS
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.35em" }}>
                  {["First key point of the slide", "Second supporting argument", "Third takeaway for the audience"].map((bullet, i) => (
                    <div
                      key={i}
                      style={{
                        fontFamily,
                        fontSize: "0.72em",
                        color: themeConfig.text,
                        opacity: 0.85,
                        display: "flex",
                        gap: "0.5em",
                        alignItems: "flex-start",
                      }}
                    >
                      <span style={{ color: themeConfig.accent, fontWeight: 700, flexShrink: 0 }}>•</span>
                      {bullet}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div
              style={{
                borderTop: `1px solid ${themeConfig.text}`,
                opacity: 0.35,
                marginTop: "0.8em",
                paddingTop: "0.4em",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "0.42em", fontWeight: 700, letterSpacing: "0.1em", color: themeConfig.accent, opacity: 2.5 }}>
                FOOTER
              </div>
              <div style={{ fontFamily, fontSize: "0.42em", color: themeConfig.text }}>
                Notebook Title · Slide 1 of 10
              </div>
            </div>
          </div>
        </Slide>
      </Deck>
    </div>
  );
}
