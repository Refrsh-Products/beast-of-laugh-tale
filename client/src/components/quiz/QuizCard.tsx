import type { QuizSession } from "../../hooks/useQuizService.api";

const G = "#84e487";
const B = "#000000";
const W = "#FFFFFF";
const R = "#FF4D4D";

export default function QuizCard({
  quiz,
  selected,
  onClick,
  bulkMode = false,
  bulkSelected = false,
  onToggleSelect,
}: {
  quiz: QuizSession;
  selected: boolean;
  onClick: () => void;
  bulkMode?: boolean;
  bulkSelected?: boolean;
  onToggleSelect?: (id: string) => void;
}) {
  const topics = quiz.topics ?? (quiz.topic ? [quiz.topic] : []);
  const topicLabel =
    topics.length > 0
      ? topics.slice(0, 2).join(", ") +
        (topics.length > 2 ? ` +${topics.length - 2}` : "")
      : "General";

  const numQuestions = quiz.num_questions ?? 0;
  const scoreCount = Math.round((quiz.score ?? 0) * numQuestions);
  const timed = quiz.quiz_type === "TIMED" || quiz.quiz_type === "timed";
  const timeLimitMinutes = quiz.time_limit
    ? Math.round(quiz.time_limit / 60)
    : null;
  const dateStr = quiz.started_at ?? quiz.generated_at ?? "";

  function handleClick() {
    if (bulkMode) {
      onToggleSelect?.(quiz.id!);
    } else {
      onClick();
    }
  }

  return (
    <div
      onClick={handleClick}
      onMouseEnter={(e) => {
        if (!selected && !bulkSelected) e.currentTarget.style.background = "#f7f7f2";
      }}
      onMouseLeave={(e) => {
        if (!selected && !bulkSelected) e.currentTarget.style.background = W;
      }}
      style={{
        padding: "12px 14px 12px 12px",
        borderBottom: `2px solid ${B}`,
        borderLeft: `4px solid ${bulkSelected ? R : G}`,
        cursor: "pointer",
        background: bulkSelected ? "#fff0f0" : selected ? "#f0fdf0" : W,
        transition: "background 0.1s",
        userSelect: "none",
      }}
    >
      {/* Topic + Score badge */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: 8,
          marginBottom: 8,
        }}
      >
        <p
          style={{
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: "0.75rem",
            fontWeight: 700,
            color: B,
            margin: 0,
            lineHeight: 1.4,
            flex: 1,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {topicLabel}
        </p>
        {/* Score badge */}
        <div
          style={{
            border: `2px solid ${B}`,
            padding: "2px 6px",
            flexShrink: 0,
          }}
        >
          <span
            style={{
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: "0.75rem",
              fontWeight: 700,
              color: B,
            }}
          >
            {scoreCount}/{numQuestions}
          </span>
        </div>
      </div>

      {/* Meta row */}
      <div
        style={{
          display: "flex",
          gap: 6,
          alignItems: "center",
          flexWrap: "wrap",
        }}
      >
        <span
          style={{
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: "0.75rem",
            color: "#000000",
          }}
        >
          {timeAgo(dateStr)}
        </span>
        <span style={{ color: "#000000" }}>·</span>
        <span
          style={{
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: "0.75rem",
            fontWeight: 700,
            letterSpacing: "0.04em",
            color: "#000000",
            textTransform: "capitalize",
          }}
        >
          {quiz.difficulty}
        </span>
        <span style={{ color: "#000000" }}>·</span>
        <span
          style={{
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: "0.75rem",
            color: "#000000",
          }}
        >
          {numQuestions}q
        </span>
        {timed && timeLimitMinutes && (
          <>
            <span style={{ color: "#000000" }}>·</span>
            <span
              style={{
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: "0.75rem",
                color: "#000000",
              }}
            >
              {timeLimitMinutes}min
            </span>
          </>
        )}
      </div>

      {/* Bulk mode checkbox */}
      {bulkMode && (
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 8 }}>
          <input
            type="checkbox"
            checked={bulkSelected}
            onChange={() => onToggleSelect?.(quiz.id!)}
            onClick={(e) => e.stopPropagation()}
            style={{
              cursor: "pointer",
              accentColor: R,
              width: 14,
              height: 14,
            }}
          />
        </div>
      )}
    </div>
  );
}

// ----------- HELPER FUNCTIONS -------------------
function timeAgo(isoDate: string): string {
  if (!isoDate) return "";
  const diff = Date.now() - new Date(isoDate).getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  const weeks = Math.floor(days / 7);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return `${weeks}w ago`;
}
