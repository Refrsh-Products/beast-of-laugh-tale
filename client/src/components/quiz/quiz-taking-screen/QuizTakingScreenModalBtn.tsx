const B = "#000000";

export default function QuizTakingScreenModalBtn({
  onClick,
  bg,
  color,
  border,
  children,
}: {
  onClick: () => void;
  bg: string;
  color: string;
  border: string;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translate(-2px, -2px)";
        e.currentTarget.style.boxShadow = `6px 6px 0 ${B}`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "none";
        e.currentTarget.style.boxShadow = `4px 4px 0 ${B}`;
      }}
      onMouseDown={(e) => {
        e.currentTarget.style.transform = "translate(2px, 2px)";
        e.currentTarget.style.boxShadow = `2px 2px 0 ${B}`;
      }}
      onMouseUp={(e) => {
        e.currentTarget.style.transform = "translate(-2px, -2px)";
        e.currentTarget.style.boxShadow = `6px 6px 0 ${B}`;
      }}
      style={{
        background: bg,
        color,
        border,
        boxShadow: `4px 4px 0 ${B}`,
        padding: "10px 20px",
        fontFamily: "'IBM Plex Mono', monospace",
        fontWeight: 700,
        fontSize: "0.72rem",
        letterSpacing: "0.04em",
        cursor: "pointer",
        transition: "transform 0.15s, box-shadow 0.15s",
      }}
    >
      {children}
    </button>
  );
}
