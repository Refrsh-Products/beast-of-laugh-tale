import { useState } from "react";
import type { PresentationSlide, SlideImage } from "@freshr/shared";

const B = "#000000";
const G = "#84e487";
const W = "#FFFFFF";

interface SlideEditorProps {
  slide: PresentationSlide;
  totalSlides: number;
  onChange: (updated: PresentationSlide) => void;
}

export default function SlideEditor({ slide, totalSlides, onChange }: SlideEditorProps) {
  const [localTitle, setLocalTitle]           = useState(slide.title);
  const [localBullets, setLocalBullets]       = useState<string[]>([...slide.bullets]);
  const [localBodyText, setLocalBodyText]     = useState(slide.body_text ?? "");
  const [localQuote, setLocalQuote]           = useState(slide.quote ?? "");
  const [localQuoteSource, setLocalQuoteSource] = useState(slide.quote_source ?? "");
  const [localCaption, setLocalCaption]       = useState(slide.caption ?? "");
  const [localImages, setLocalImages]         = useState<SlideImage[]>([...slide.images]);

  function emit(overrides: Partial<PresentationSlide> = {}) {
    onChange({
      ...slide,
      title: localTitle,
      bullets: localBullets,
      body_text: localBodyText || undefined,
      quote: localQuote || undefined,
      quote_source: localQuoteSource || undefined,
      caption: localCaption || undefined,
      images: localImages,
      ...overrides,
    });
  }

  function setTitle(title: string)          { setLocalTitle(title);          emit({ title }); }
  function setBodyText(body_text: string)   { setLocalBodyText(body_text);   emit({ body_text: body_text || undefined }); }
  function setQuote(quote: string)          { setLocalQuote(quote);          emit({ quote: quote || undefined }); }
  function setQuoteSource(s: string)        { setLocalQuoteSource(s);        emit({ quote_source: s || undefined }); }
  function setCaption(caption: string)      { setLocalCaption(caption);      emit({ caption: caption || undefined }); }

  function setBullet(index: number, text: string) {
    const bullets = localBullets.map((b, i) => (i === index ? text : b));
    setLocalBullets(bullets);
    emit({ bullets });
  }
  function addBullet() {
    const bullets = [...localBullets, ""];
    setLocalBullets(bullets);
    emit({ bullets });
  }
  function removeBullet(index: number) {
    if (localBullets.length <= 1) return;
    const bullets = localBullets.filter((_, i) => i !== index);
    setLocalBullets(bullets);
    emit({ bullets });
  }
  function setImage(index: number, url: string) {
    const images = localImages.map((img, i) => (i === index ? { ...img, url } : img));
    if (index >= images.length) images.push({ url, query: "", attribution: "", source_page: "" });
    setLocalImages(images);
    emit({ images });
  }

  // ── Shared field components ────────────────────────────────────────────────

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

  const titleField = (
    <input
      type="text"
      value={localTitle}
      onChange={(e) => setTitle(e.target.value)}
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
  );

  const bulletsField = (hint?: string) => (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {hint && (
        <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "0.6rem", color: "#000000", letterSpacing: "0.08em" }}>
          {hint}
        </span>
      )}
      {localBullets.map((bullet, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ color: G, fontWeight: 700, fontSize: "1.2rem", flexShrink: 0, lineHeight: 1 }}>•</span>
          <input
            type="text"
            value={bullet}
            onChange={(e) => setBullet(i, e.target.value)}
            placeholder="Bullet point..."
            style={{ ...inputBase, fontSize: "1.05rem", lineHeight: 1.6 }}
          />
          {localBullets.length > 1 && (
            <button
              onClick={() => removeBullet(i)}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#ff4444")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "#ccc")}
              style={{ background: "transparent", border: "none", cursor: "pointer", color: "#000000", fontSize: "1.1rem", flexShrink: 0, padding: "0 4px", lineHeight: 1, transition: "color 0.1s" }}
            >
              ×
            </button>
          )}
        </div>
      ))}
      <button
        onClick={addBullet}
        onMouseEnter={(e) => { e.currentTarget.style.borderColor = G; e.currentTarget.style.color = B; }}
        onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#ccc"; e.currentTarget.style.color = "#aaa"; }}
        style={{ alignSelf: "flex-start", background: "transparent", border: "1px dashed #ccc", color: "#000000", fontFamily: "'IBM Plex Mono', monospace", fontSize: "0.65rem", padding: "4px 10px", cursor: "pointer", marginTop: 4, transition: "border-color 0.1s, color 0.1s" }}
      >
        + Add bullet
      </button>
    </div>
  );

  const imageField = (index: number, label = "IMAGE URL") => (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.1em", color: "#000000" }}>
        {label}
      </span>
      {localImages[index]?.url && (
        <img
          src={localImages[index].url}
          alt=""
          style={{ width: "100%", maxHeight: 120, objectFit: "cover", border: `2px solid ${B}` }}
        />
      )}
      <input
        type="text"
        value={localImages[index]?.url ?? ""}
        onChange={(e) => setImage(index, e.target.value)}
        placeholder="https://..."
        style={{
          border: `1.5px solid #ddd`,
          outline: "none",
          padding: "6px 10px",
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: "0.7rem",
          color: B,
          caretColor: G,
          background: "#fafafa",
          width: "100%",
          boxSizing: "border-box",
        }}
        onFocus={(e) => (e.currentTarget.style.borderColor = B)}
        onBlur={(e) => (e.currentTarget.style.borderColor = "#ddd")}
      />
    </div>
  );

  // ── Layout-specific fields ─────────────────────────────────────────────────

  function renderFields() {
    switch (slide.layout) {

      case "bullets":
        return (
          <>
            {titleField}
            {bulletsField()}
          </>
        );

      case "title-only":
        return (
          <input
            type="text"
            value={localTitle}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Your statement here..."
            style={{
              ...inputBase,
              fontSize: "2.8rem",
              fontWeight: 800,
              letterSpacing: "-0.04em",
              lineHeight: 1.1,
            }}
          />
        );

      case "body-text":
        return (
          <>
            {titleField}
            <textarea
              value={localBodyText}
              onChange={(e) => setBodyText(e.target.value)}
              placeholder="Write your paragraph here..."
              rows={5}
              style={{
                ...inputBase,
                fontSize: "1rem",
                lineHeight: 1.8,
                resize: "vertical",
                color: "#000000",
              }}
            />
          </>
        );

      case "two-col":
        return (
          <>
            {titleField}
            {bulletsField("First half = left column · Second half = right column")}
          </>
        );

      case "image-right":
      case "image-left":
        return (
          <>
            {titleField}
            {bulletsField()}
            {imageField(0)}
          </>
        );

      case "full-image":
        return (
          <>
            {imageField(0)}
            <input
              type="text"
              value={localCaption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Caption..."
              style={{ ...inputBase, fontSize: "1rem", color: "#000000", fontStyle: "italic" }}
            />
          </>
        );

      case "image-top":
        return (
          <>
            {imageField(0)}
            {titleField}
            {bulletsField("Max 2 bullets shown in this layout")}
          </>
        );

      case "quote":
        return (
          <>
            <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
              <span style={{ fontFamily: "'Syne', sans-serif", fontSize: "2.5rem", fontWeight: 800, color: G, lineHeight: 1, flexShrink: 0 }}>❝</span>
              <textarea
                value={localQuote}
                onChange={(e) => setQuote(e.target.value)}
                placeholder="Quote text..."
                rows={4}
                style={{
                  ...inputBase,
                  fontSize: "1.3rem",
                  fontWeight: 700,
                  lineHeight: 1.35,
                  resize: "vertical",
                }}
              />
            </div>
            <input
              type="text"
              value={localQuoteSource}
              onChange={(e) => setQuoteSource(e.target.value)}
              placeholder="— Source / attribution"
              style={{ ...inputBase, fontSize: "0.85rem", color: "#000000", letterSpacing: "0.04em" }}
            />
          </>
        );

      case "two-images":
        return (
          <>
            {titleField}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {imageField(0, "IMAGE 1 URL")}
                <input
                  type="text"
                  value={localBullets[0] ?? ""}
                  onChange={(e) => setBullet(0, e.target.value)}
                  placeholder="Caption for image 1..."
                  style={{ ...inputBase, fontSize: "0.85rem", color: "#000000", fontStyle: "italic" }}
                />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {imageField(1, "IMAGE 2 URL")}
                <input
                  type="text"
                  value={localBullets[1] ?? ""}
                  onChange={(e) => setBullet(1, e.target.value)}
                  placeholder="Caption for image 2..."
                  style={{ ...inputBase, fontSize: "0.85rem", color: "#000000", fontStyle: "italic" }}
                />
              </div>
            </div>
          </>
        );

      default:
        return (
          <>
            {titleField}
            {bulletsField()}
          </>
        );
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div style={{ width: "100%", height: "100%", background: W, display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        <div style={{ width: 10, background: G, flexShrink: 0 }} />
        <div style={{ flex: 1, padding: "36px 52px", display: "flex", flexDirection: "column", gap: 24, overflowY: "auto" }}>
          {renderFields()}
        </div>
      </div>

      <div style={{ borderTop: "1px solid #eee", padding: "6px 20px", display: "flex", justifyContent: "space-between", flexShrink: 0, background: "#fafafa" }}>
        <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "0.6rem", color: "#000000", letterSpacing: "0.08em" }}>
          SLIDE {slide.order_index + 1} OF {totalSlides}
        </span>
        <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "0.6rem", color: "#000000", letterSpacing: "0.08em" }}>
          {slide.layout.toUpperCase()}
        </span>
      </div>
    </div>
  );
}
