import type { PresentationSlide } from "@freshr/shared";
import {
  DEFAULT_SLIDE_THEME,
  blendedSlideText,
  type SlideTheme,
} from "./presentationThemes";

/**
 * Renders a slide's body.
 *
 * Every colour comes from the passed theme rather than a constant in this
 * file, so the deck's palette has exactly one home (presentationThemes.ts).
 * The inline styles are deliberate and cannot become classes: this tree is
 * also mounted detached and rasterised by html2canvas for the PDF export,
 * where Tailwind's stylesheet and CSS custom properties are not in scope.
 */
export function renderSlideContent(
  slide: PresentationSlide,
  theme: SlideTheme = DEFAULT_SLIDE_THEME,
): React.ReactNode {
  const secondary = blendedSlideText(theme);
  const hairline = blendedSlideText(theme, 0.15);

  const strip = theme.accentStrip ? (
    <div
      style={{
        width: 10,
        background: theme.accent,
        flexShrink: 0,
        marginRight: "0.8em",
        borderRadius: 2,
      }}
    />
  ) : null;

  const title = (
    <div
      style={{
        fontFamily: theme.bodyFont,
        fontSize: "2em",
        fontWeight: 800,
        color: theme.text,
        letterSpacing: "-0.03em",
        lineHeight: 1.1,
        borderBottom: `3px solid ${theme.text}`,
        paddingBottom: "0.2em",
        marginBottom: "0.25em",
      }}
    >
      {slide.title}
    </div>
  );

  const bulletRow = (b: string, i: number, fontSize = "1em") => (
    <div
      key={i}
      style={{
        display: "flex",
        gap: "0.55em",
        alignItems: "flex-start",
        fontFamily: theme.bodyFont,
        fontSize,
        color: theme.text,
        lineHeight: 1.55,
      }}
    >
      <span style={{ color: theme.accent, fontWeight: 700, flexShrink: 0 }}>
        •
      </span>
      {b}
    </div>
  );

  const bullets = (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.45em" }}>
      {slide.bullets.map((b, i) => bulletRow(b, i))}
    </div>
  );

  const imgStyle: React.CSSProperties = {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    border: `2px solid ${theme.text}`,
    display: "block",
  };

  switch (slide.layout) {
    case "bullets":
      return (
        <>
          {strip}
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
            {title}
            {bullets}
          </div>
        </>
      );

    case "title-only":
      return (
        <>
          {strip}
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
            }}
          >
            <div
              style={{
                fontFamily: theme.titleFont,
                fontSize: "3em",
                fontWeight: 800,
                color: theme.text,
                letterSpacing: "-0.04em",
                lineHeight: 1.05,
              }}
            >
              {slide.title}
            </div>
          </div>
        </>
      );

    case "body-text":
      return (
        <>
          {strip}
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
            {title}
            <div
              style={{
                fontFamily: theme.bodyFont,
                fontSize: "0.9em",
                color: secondary,
                lineHeight: 1.8,
              }}
            >
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
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          <div style={{ display: "flex", marginBottom: "0.5em" }}>
            {strip}
            {title}
          </div>
          <div
            style={{
              display: "flex",
              flex: 1,
              gap: "1.5em",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                gap: "0.45em",
                borderRight: `1px solid ${hairline}`,
                paddingRight: "1.5em",
              }}
            >
              {left.map((b, i) => bulletRow(b, i, "0.9em"))}
            </div>
            <div
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                gap: "0.45em",
              }}
            >
              {right.map((b, i) => bulletRow(b, i, "0.9em"))}
            </div>
          </div>
        </div>
      );
    }

    case "image-right":
      return (
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          <div style={{ display: "flex", marginBottom: "0.5em" }}>
            {strip}
            {title}
          </div>
          <div
            style={{
              display: "flex",
              flex: 1,
              gap: "1.5em",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
              }}
            >
              {bullets}
            </div>
            <div style={{ width: "42%", flexShrink: 0 }}>
              {slide.images[0] && (
                <img src={slide.images[0].url} alt="" style={imgStyle} />
              )}
            </div>
          </div>
        </div>
      );

    case "image-left":
      return (
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          <div style={{ display: "flex", marginBottom: "0.5em" }}>
            {strip}
            {title}
          </div>
          <div
            style={{
              display: "flex",
              flex: 1,
              gap: "1.5em",
              overflow: "hidden",
            }}
          >
            <div style={{ width: "42%", flexShrink: 0 }}>
              {slide.images[0] && (
                <img src={slide.images[0].url} alt="" style={imgStyle} />
              )}
            </div>
            <div
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
              }}
            >
              {bullets}
            </div>
          </div>
        </div>
      );

    case "full-image":
      return (
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            gap: "0.4em",
            overflow: "hidden",
          }}
        >
          <div style={{ flex: 1, overflow: "hidden" }}>
            {slide.images[0] && (
              <img
                src={slide.images[0].url}
                alt=""
                style={{ ...imgStyle, height: "100%" }}
              />
            )}
          </div>
          {(slide.caption || slide.title) && (
            <div
              style={{
                fontFamily: theme.bodyFont,
                fontSize: "0.75em",
                color: secondary,
                fontStyle: "italic",
                paddingLeft: "0.3em",
                flexShrink: 0,
              }}
            >
              {slide.caption || slide.title}
            </div>
          )}
        </div>
      );

    case "image-top":
      return (
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            gap: "0.6em",
            overflow: "hidden",
          }}
        >
          <div style={{ flex: "0 0 50%", overflow: "hidden" }}>
            {slide.images[0] && (
              <img
                src={slide.images[0].url}
                alt=""
                style={{ ...imgStyle, height: "100%" }}
              />
            )}
          </div>
          <div style={{ display: "flex", overflow: "hidden" }}>
            {strip}
            <div
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                gap: "0.35em",
              }}
            >
              <div
                style={{
                  fontFamily: theme.bodyFont,
                  fontSize: "1.4em",
                  fontWeight: 800,
                  color: theme.text,
                  borderBottom: `2px solid ${theme.text}`,
                  paddingBottom: "0.15em",
                }}
              >
                {slide.title}
              </div>
              {slide.bullets.slice(0, 2).map((b, i) => bulletRow(b, i, "0.85em"))}
            </div>
          </div>
        </div>
      );

    case "quote":
      return (
        <div
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div style={{ textAlign: "center", padding: "0 2em" }}>
            <div
              style={{
                fontFamily: theme.titleFont,
                fontSize: "2.5em",
                fontWeight: 800,
                color: theme.accent,
                lineHeight: 1,
                marginBottom: "0.2em",
              }}
            >
              ❝
            </div>
            <div
              style={{
                fontFamily: theme.titleFont,
                fontSize: "1.4em",
                fontWeight: 700,
                color: theme.text,
                lineHeight: 1.35,
                letterSpacing: "-0.02em",
                marginBottom: "0.6em",
              }}
            >
              {slide.quote || slide.title}
            </div>
            {(slide.quote_source || slide.bullets[0]) && (
              <div
                style={{
                  fontFamily: theme.bodyFont,
                  fontSize: "0.7em",
                  color: secondary,
                  letterSpacing: "0.06em",
                }}
              >
                — {slide.quote_source || slide.bullets[0]}
              </div>
            )}
          </div>
        </div>
      );

    case "two-images":
      return (
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            gap: "0.5em",
          }}
        >
          <div style={{ display: "flex" }}>
            {strip}
            {title}
          </div>
          <div
            style={{ display: "flex", flex: 1, gap: "1em", overflow: "hidden" }}
          >
            {[0, 1].map((idx) => (
              <div
                key={idx}
                style={{
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.3em",
                  overflow: "hidden",
                }}
              >
                <div style={{ flex: 1, overflow: "hidden" }}>
                  {slide.images[idx] && (
                    <img
                      src={slide.images[idx].url}
                      alt=""
                      style={{ ...imgStyle, height: "100%" }}
                    />
                  )}
                </div>
                {slide.bullets[idx] && (
                  <div
                    style={{
                      fontFamily: theme.bodyFont,
                      fontSize: "0.65em",
                      color: secondary,
                      textAlign: "center",
                      flexShrink: 0,
                    }}
                  >
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
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              gap: "0.6em",
            }}
          >
            {title}
            {bullets}
          </div>
        </>
      );
  }
}
