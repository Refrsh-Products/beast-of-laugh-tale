const G = "#84e487";
const B = "#000000";
const W = "#FFFFFF";

interface OptionsColumnProps {
  onGenerateQuiz: () => void;
  isGenerating: boolean;
}

export default function OptionsColumn({
  onGenerateQuiz,
  isGenerating,
}: OptionsColumnProps) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        background: W,
        overflow: "hidden",
      }}
    >
      {/* Column header */}
      <div
        style={{
          padding: "14px 14px 10px",
          borderBottom: `2px solid ${B}`,
          flexShrink: 0,
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
          OPTIONS
        </span>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: "auto", padding: 14 }}>
        {/* Quiz section */}
        <div
          style={{
            border: `2px solid ${B}`,
            padding: 16,
          }}
        >
          <p
            style={{
              fontFamily: "'Syne', sans-serif",
              fontWeight: 800,
              fontSize: "0.88rem",
              marginBottom: 8,
              letterSpacing: "-0.01em",
            }}
          >
            Quiz Generator
          </p>
          <p
            style={{
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: "0.68rem",
              color: "#555",
              lineHeight: 1.6,
              marginBottom: 16,
            }}
          >
            Generate a quiz from your uploaded files to test your knowledge.
          </p>
          <button
            onClick={onGenerateQuiz}
            disabled={isGenerating}
            style={{
              width: "100%",
              background: isGenerating ? "#eee" : G,
              color: isGenerating ? "#aaa" : B,
              border: `2px solid ${isGenerating ? "#ccc" : B}`,
              boxShadow: isGenerating ? "none" : `3px 3px 0 ${B}`,
              padding: "10px 14px",
              fontFamily: "'IBM Plex Mono', monospace",
              fontWeight: 700,
              fontSize: "0.72rem",
              letterSpacing: "0.06em",
              cursor: isGenerating ? "not-allowed" : "pointer",
              lineHeight: 1,
            }}
          >
            {isGenerating ? "Generating..." : "Generate quiz →"}
          </button>
        </div>
      </div>
    </div>
  );
}
