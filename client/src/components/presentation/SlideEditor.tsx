import { useState } from "react";
import type { PresentationSlide } from "../../services/presentation/Presentation.types";

const B = "#000000";
const G = "#84e487";
const W = "#FFFFFF";

interface SlideEditorProps {
  slide: PresentationSlide;
  totalSlides: number;
  onChange: (updated: PresentationSlide) => void;
}

export default function SlideEditor({ slide, totalSlides, onChange }: SlideEditorProps) {
  const [localTitle, setLocalTitle] = useState(slide.title);
  const [localBullets, setLocalBullets] = useState<string[]>([...slide.bullets]);

  function handleTitleChange(title: string) {
    setLocalTitle(title);
    onChange({ ...slide, title, bullets: localBullets });
  }

  function handleBulletChange(index: number, text: string) {
    const bullets = localBullets.map((b, i) => (i === index ? text : b));
    setLocalBullets(bullets);
    onChange({ ...slide, title: localTitle, bullets });
  }

  function addBullet() {
    const bullets = [...localBullets, ""];
    setLocalBullets(bullets);
    onChange({ ...slide, title: localTitle, bullets });
  }

  function removeBullet(index: number) {
    if (localBullets.length <= 1) return;
    const bullets = localBullets.filter((_, i) => i !== index);
    setLocalBullets(bullets);
    onChange({ ...slide, title: localTitle, bullets });
  }

  const inputBase: React.CSSProperties = {
    border: "none",
    outline: "none",
    background: "transparent",
    fontFamily: "'IBM Plex Mono', monospace",
    color: B,
    caretColor: G,
    width: "100%",
    padding: 0,
    margin: 0,
  };

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        background: W,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        {/* Green left strip */}
        <div style={{ width: 10, background: G, flexShrink: 0 }} />

        <div
          style={{
            flex: 1,
            padding: "36px 52px",
            display: "flex",
            flexDirection: "column",
            gap: 24,
            overflowY: "auto",
          }}
        >
          {/* Title */}
          <input
            type="text"
            value={localTitle}
            onChange={(e) => handleTitleChange(e.target.value)}
            placeholder="Slide title..."
            style={{
              ...inputBase,
              fontSize: "2.2rem",
              fontWeight: 800,
              letterSpacing: "-0.03em",
              lineHeight: 1.15,
              borderBottom: `3px solid ${B}`,
              paddingBottom: 10,
            }}
          />

          {/* Bullets */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {localBullets.map((bullet, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span
                  style={{
                    color: G,
                    fontWeight: 700,
                    fontSize: "1.2rem",
                    flexShrink: 0,
                    lineHeight: 1,
                  }}
                >
                  •
                </span>
                <input
                  type="text"
                  value={bullet}
                  onChange={(e) => handleBulletChange(i, e.target.value)}
                  placeholder="Bullet point..."
                  style={{
                    ...inputBase,
                    fontSize: "1.05rem",
                    lineHeight: 1.6,
                  }}
                />
                {localBullets.length > 1 && (
                  <button
                    onClick={() => removeBullet(i)}
                    onMouseEnter={(e) => (e.currentTarget.style.color = "#ff4444")}
                    onMouseLeave={(e) => (e.currentTarget.style.color = "#ccc")}
                    style={{
                      background: "transparent",
                      border: "none",
                      cursor: "pointer",
                      color: "#ccc",
                      fontSize: "1.1rem",
                      flexShrink: 0,
                      padding: "0 4px",
                      lineHeight: 1,
                      transition: "color 0.1s",
                    }}
                  >
                    ×
                  </button>
                )}
              </div>
            ))}

            <button
              onClick={addBullet}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = G;
                e.currentTarget.style.color = B;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "#ccc";
                e.currentTarget.style.color = "#aaa";
              }}
              style={{
                alignSelf: "flex-start",
                background: "transparent",
                border: "1px dashed #ccc",
                color: "#aaa",
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: "0.65rem",
                padding: "4px 10px",
                cursor: "pointer",
                marginTop: 4,
                transition: "border-color 0.1s, color 0.1s",
              }}
            >
              + Add bullet
            </button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div
        style={{
          borderTop: "1px solid #eee",
          padding: "6px 20px",
          display: "flex",
          justifyContent: "space-between",
          flexShrink: 0,
          background: "#fafafa",
        }}
      >
        <span
          style={{
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: "0.6rem",
            color: "#999",
            letterSpacing: "0.08em",
          }}
        >
          SLIDE {slide.order_index + 1} OF {totalSlides}
        </span>
      </div>
    </div>
  );
}
