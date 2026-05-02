import type { PresentationSlide } from "../../services/presentation/Presentation.types";

export const B = "#000000";
export const W = "#FFFFFF";
export const G = "#84e487";

export function renderSlideContent(slide: PresentationSlide): React.ReactNode {
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
            <div style={{ fontFamily: "'Syne', sans-serif", fontSize: "3em", fontWeight: 800, color: B, letterSpacing: "-0.04em", lineHeight: 1.05 }}>
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
            <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "0.9em", color: "#333", lineHeight: 1.8 }}>
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
          <div style={{ display: "flex", marginBottom: "0.5em" }}>{strip}{title}</div>
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
          <div style={{ display: "flex", marginBottom: "0.5em" }}>{strip}{title}</div>
          <div style={{ display: "flex", flex: 1, gap: "1.5em", overflow: "hidden" }}>
            <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>{bullets}</div>
            <div style={{ width: "42%", flexShrink: 0 }}>
              {slide.images[0] && <img src={slide.images[0]} alt="" style={imgStyle} />}
            </div>
          </div>
        </div>
      );

    case "image-left":
      return (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <div style={{ display: "flex", marginBottom: "0.5em" }}>{strip}{title}</div>
          <div style={{ display: "flex", flex: 1, gap: "1.5em", overflow: "hidden" }}>
            <div style={{ width: "42%", flexShrink: 0 }}>
              {slide.images[0] && <img src={slide.images[0]} alt="" style={imgStyle} />}
            </div>
            <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>{bullets}</div>
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
          <div style={{ display: "flex" }}>{strip}{title}</div>
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
