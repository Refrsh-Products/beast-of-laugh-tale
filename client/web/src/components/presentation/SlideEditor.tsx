import { useState } from "react";
import type { PresentationSlide, SlideImage } from "@freshr/shared";
import { Button } from "@/components/ui/button";
import { RiAddLine, RiCloseLine } from "@remixicon/react";
import {
  DEFAULT_SLIDE_THEME,
  blendedSlideText,
  type SlideTheme,
} from "./presentationThemes";

interface SlideEditorProps {
  slide: PresentationSlide;
  totalSlides: number;
  onChange: (updated: PresentationSlide) => void;
  theme?: SlideTheme;
}

/**
 * The WYSIWYG slide canvas.
 *
 * The editing surface is painted in the *deck's* theme rather than the app's,
 * so what you type looks like what gets exported; that is why this file styles
 * inline from the theme object instead of using token classes. The chrome
 * around it — the add/remove controls and the status footer — is ordinary app
 * UI and follows the app's own light/dark tokens.
 */
export default function SlideEditor({
  slide,
  totalSlides,
  onChange,
  theme = DEFAULT_SLIDE_THEME,
}: SlideEditorProps) {
  const [localTitle, setLocalTitle] = useState(slide.title);
  const [localBullets, setLocalBullets] = useState<string[]>([
    ...slide.bullets,
  ]);
  const [localBodyText, setLocalBodyText] = useState(slide.body_text ?? "");
  const [localQuote, setLocalQuote] = useState(slide.quote ?? "");
  const [localQuoteSource, setLocalQuoteSource] = useState(
    slide.quote_source ?? "",
  );
  const [localCaption, setLocalCaption] = useState(slide.caption ?? "");
  const [localImages, setLocalImages] = useState<SlideImage[]>([
    ...slide.images,
  ]);

  const secondary = blendedSlideText(theme);
  const hairline = blendedSlideText(theme, 0.2);

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

  function setTitle(title: string) {
    setLocalTitle(title);
    emit({ title });
  }
  function setBodyText(body_text: string) {
    setLocalBodyText(body_text);
    emit({ body_text: body_text || undefined });
  }
  function setQuote(quote: string) {
    setLocalQuote(quote);
    emit({ quote: quote || undefined });
  }
  function setQuoteSource(s: string) {
    setLocalQuoteSource(s);
    emit({ quote_source: s || undefined });
  }
  function setCaption(caption: string) {
    setLocalCaption(caption);
    emit({ caption: caption || undefined });
  }

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
    const images = localImages.map((img, i) =>
      i === index ? { ...img, url } : img,
    );
    if (index >= images.length)
      images.push({ url, query: "", attribution: "", source_page: "" });
    setLocalImages(images);
    emit({ images });
  }

  // ── Shared field components ────────────────────────────────────────────────

  const inputBase: React.CSSProperties = {
    border: "none",
    outline: "none",
    background: "transparent",
    fontFamily: "'IBM Plex Mono', monospace",
    color: theme.text,
    caretColor: theme.accent,
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
      aria-label="Slide title"
      style={{
        ...inputBase,
        fontSize: "2.2rem",
        fontWeight: 800,
        letterSpacing: "-0.03em",
        lineHeight: 1.15,
        borderBottom: `3px solid ${theme.text}`,
        paddingBottom: 10,
      }}
    />
  );

  const hintStyle: React.CSSProperties = {
    fontFamily: "'IBM Plex Mono', monospace",
    fontSize: "0.6rem",
    color: secondary,
    letterSpacing: "0.08em",
  };

  const bulletsField = (hint?: string) => (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {hint && <span style={hintStyle}>{hint}</span>}
      {localBullets.map((bullet, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span
            style={{
              color: theme.accent,
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
            onChange={(e) => setBullet(i, e.target.value)}
            placeholder="Bullet point..."
            aria-label={`Bullet ${i + 1}`}
            style={{ ...inputBase, fontSize: "1.05rem", lineHeight: 1.6 }}
          />
          {localBullets.length > 1 && (
            <Button
              variant="ghost"
              size="icon-xs"
              aria-label={`Remove bullet ${i + 1}`}
              onClick={() => removeBullet(i)}
            >
              <RiCloseLine aria-hidden="true" />
            </Button>
          )}
        </div>
      ))}
      <Button
        variant="outline"
        size="xs"
        className="mt-1 self-start"
        onClick={addBullet}
      >
        <RiAddLine aria-hidden="true" />
        Add bullet
      </Button>
    </div>
  );

  const imageField = (index: number, label = "IMAGE URL") => (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <span style={{ ...hintStyle, fontWeight: 700, letterSpacing: "0.1em" }}>
        {label}
      </span>
      {localImages[index]?.url && (
        <img
          src={localImages[index].url}
          alt=""
          style={{
            width: "100%",
            maxHeight: 120,
            objectFit: "cover",
            border: `2px solid ${theme.text}`,
          }}
        />
      )}
      <input
        type="text"
        value={localImages[index]?.url ?? ""}
        onChange={(e) => setImage(index, e.target.value)}
        placeholder="https://..."
        aria-label={label.toLowerCase()}
        style={{
          border: `1.5px solid ${hairline}`,
          borderRadius: 8,
          outline: "none",
          padding: "6px 10px",
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: "0.7rem",
          color: theme.text,
          caretColor: theme.accent,
          background: "transparent",
          width: "100%",
          boxSizing: "border-box",
        }}
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
            aria-label="Slide statement"
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
              aria-label="Slide body text"
              rows={5}
              style={{
                ...inputBase,
                fontSize: "1rem",
                lineHeight: 1.8,
                resize: "vertical",
                color: secondary,
              }}
            />
          </>
        );

      case "two-col":
        return (
          <>
            {titleField}
            {bulletsField(
              "First half = left column · Second half = right column",
            )}
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
              aria-label="Image caption"
              style={{
                ...inputBase,
                fontSize: "1rem",
                color: secondary,
                fontStyle: "italic",
              }}
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
              <span
                style={{
                  fontFamily: "'Syne', sans-serif",
                  fontSize: "2.5rem",
                  fontWeight: 800,
                  color: theme.accent,
                  lineHeight: 1,
                  flexShrink: 0,
                }}
              >
                ❝
              </span>
              <textarea
                value={localQuote}
                onChange={(e) => setQuote(e.target.value)}
                placeholder="Quote text..."
                aria-label="Quote text"
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
              aria-label="Quote source"
              style={{
                ...inputBase,
                fontSize: "0.85rem",
                color: secondary,
                letterSpacing: "0.04em",
              }}
            />
          </>
        );

      case "two-images":
        return (
          <>
            {titleField}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 20,
              }}
            >
              {[0, 1].map((idx) => (
                <div
                  key={idx}
                  style={{ display: "flex", flexDirection: "column", gap: 8 }}
                >
                  {imageField(idx, `IMAGE ${idx + 1} URL`)}
                  <input
                    type="text"
                    value={localBullets[idx] ?? ""}
                    onChange={(e) => setBullet(idx, e.target.value)}
                    placeholder={`Caption for image ${idx + 1}...`}
                    aria-label={`Caption for image ${idx + 1}`}
                    style={{
                      ...inputBase,
                      fontSize: "0.85rem",
                      color: secondary,
                      fontStyle: "italic",
                    }}
                  />
                </div>
              ))}
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
    <div className="flex size-full flex-col overflow-hidden">
      <div
        className="flex flex-1 overflow-hidden"
        style={{ background: theme.bg }}
      >
        <div style={{ width: 10, background: theme.accent, flexShrink: 0 }} />
        <div className="flex flex-1 flex-col gap-6 overflow-y-auto px-8 py-9 sm:px-13">
          {renderFields()}
        </div>
      </div>

      <div className="border-border bg-card text-muted-foreground flex shrink-0 justify-between border-t px-5 py-1.5 text-xs tracking-[0.08em]">
        <span>
          SLIDE {slide.order_index + 1} OF {totalSlides}
        </span>
        <span>{slide.layout.toUpperCase()}</span>
      </div>
    </div>
  );
}
