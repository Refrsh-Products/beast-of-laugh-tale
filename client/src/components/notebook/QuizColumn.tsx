const G = "#84e487";
const B = "#000000";
const W = "#FFFFFF";

interface QuizColumnProps {
  onGenerateQuiz: () => void;
  isGenerating: boolean;
}

export default function QuizColumn({
  onGenerateQuiz,
  isGenerating,
}: QuizColumnProps) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        background: "#f5f5f0",
        borderRight: `2px solid ${B}`,
        overflow: "hidden",
      }}
    >
      {/* Column header */}
      <div
        style={{
          height: 44,
          padding: "0 16px",
          borderBottom: `2px solid ${B}`,
          background: W,
          display: "flex",
          alignItems: "center",
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
          QUIZ GENERATOR
        </span>
      </div>

      {/* Content */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "40px 32px",
          gap: 20,
          textAlign: "center",
        }}
      >
        {/* Icon */}
        <div
          style={{
            width: 64,
            height: 64,
            border: `2px solid ${B}`,
            background: W,
            boxShadow: `4px 4px 0 ${B}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
            <path
              d="M8 10h16M8 15h10M8 20h12"
              stroke={B}
              strokeWidth="2"
              strokeLinecap="round"
            />
            <circle cx="24" cy="22" r="6" fill={G} stroke={B} strokeWidth="2" />
            <path
              d="M22 22l1.5 1.5L26 20"
              stroke={B}
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        <div>
          <p
            style={{
              fontFamily: "'Syne', sans-serif",
              fontWeight: 800,
              fontSize: "1.1rem",
              color: B,
              margin: "0 0 8px",
              letterSpacing: "-0.01em",
            }}
          >
            Test your knowledge.
          </p>
          <p
            style={{
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: "0.72rem",
              color: "#666",
              margin: 0,
              lineHeight: 1.7,
              maxWidth: 340,
            }}
          >
            Freshr will read your uploaded files and generate a quiz to help you
            study. Make sure you have files uploaded before generating.
          </p>
        </div>

        <button
          onClick={onGenerateQuiz}
          disabled={isGenerating}
          onMouseEnter={(e) => { if (!isGenerating) { e.currentTarget.style.transform = "translate(-3px, -3px)"; e.currentTarget.style.boxShadow = `7px 7px 0 ${B}`; } }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = isGenerating ? "none" : `4px 4px 0 ${B}`; }}
          style={{
            background: isGenerating ? "#eee" : G,
            color: isGenerating ? "#aaa" : B,
            border: `2px solid ${isGenerating ? "#ccc" : B}`,
            boxShadow: isGenerating ? "none" : `4px 4px 0 ${B}`,
            padding: "12px 28px",
            fontFamily: "'IBM Plex Mono', monospace",
            fontWeight: 700,
            fontSize: "0.78rem",
            letterSpacing: "0.06em",
            cursor: isGenerating ? "not-allowed" : "pointer",
            transition: "transform 0.15s, box-shadow 0.15s",
            marginTop: 4,
          }}
        >
          {isGenerating ? "Generating..." : "Generate quiz →"}
        </button>

        {/* Coming soon note */}
        <p
          style={{
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: "0.62rem",
            color: "#bbb",
            margin: 0,
            letterSpacing: "0.04em",
          }}
        >
          More quiz options coming soon
        </p>
      </div>
    </div>
  );
}
