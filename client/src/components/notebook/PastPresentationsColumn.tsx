const B = "#000000";
const W = "#FFFFFF";

export default function PastPresentationsColumn() {
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
          PREVIOUS SLIDES
        </span>
      </div>

      <div style={{ flex: 1, overflowY: "auto" }}>
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
      </div>
    </div>
  );
}
