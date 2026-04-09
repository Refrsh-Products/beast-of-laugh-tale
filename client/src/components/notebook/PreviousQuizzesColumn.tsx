import type { QuizAttempt } from "../../storage";

const G = "#84e487";
const B = "#000000";
const W = "#FFFFFF";

interface PreviousQuizzesColumnProps {
  quizzes: QuizAttempt[];
  onQuizClick: (quiz: QuizAttempt) => void;
}

function timeAgo(isoDate: string): string {
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

function QuizCard({
  quiz,
  onClick,
}: {
  quiz: QuizAttempt;
  onClick: () => void;
}) {
  const scorePercent = Math.round((quiz.score / quiz.question_count) * 100);
  const accentColor =
    scorePercent >= 80 ? "#2a9e30" : scorePercent >= 50 ? "#c47d00" : "#cc3333";

  const topicLabel =
    quiz.topics.length > 0
      ? quiz.topics.slice(0, 2).join(", ") +
        (quiz.topics.length > 2 ? ` +${quiz.topics.length - 2}` : "")
      : quiz.prompt
      ? "Custom prompt"
      : "General";

  return (
    <div
      onClick={onClick}
      onMouseEnter={(e) => (e.currentTarget.style.background = "#f7f7f2")}
      onMouseLeave={(e) => (e.currentTarget.style.background = W)}
      style={{
        padding: "12px 14px 12px 12px",
        borderBottom: `2px solid ${B}`,
        borderLeft: `4px solid ${accentColor}`,
        cursor: "pointer",
        background: W,
        transition: "background 0.1s",
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
            fontSize: "0.72rem",
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
            border: `2px solid ${accentColor}`,
            padding: "2px 6px",
            flexShrink: 0,
          }}
        >
          <span
            style={{
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: "0.68rem",
              fontWeight: 700,
              color: accentColor,
            }}
          >
            {quiz.score}/{quiz.question_count}
          </span>
        </div>
      </div>

      {/* Meta row */}
      <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
        <span
          style={{
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: "0.58rem",
            color: "#999",
          }}
        >
          {timeAgo(quiz.created_at)}
        </span>
        <span style={{ color: "#ccc" }}>·</span>
        <span
          style={{
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: "0.58rem",
            fontWeight: 700,
            letterSpacing: "0.04em",
            color: "#666",
            textTransform: "capitalize",
          }}
        >
          {quiz.difficulty}
        </span>
        <span style={{ color: "#ccc" }}>·</span>
        <span
          style={{
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: "0.58rem",
            color: "#666",
          }}
        >
          {quiz.question_count}q
        </span>
        {quiz.timed && quiz.time_limit && (
          <>
            <span style={{ color: "#ccc" }}>·</span>
            <span
              style={{
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: "0.58rem",
                color: "#666",
              }}
            >
              {quiz.time_limit}min
            </span>
          </>
        )}
      </div>
    </div>
  );
}

export default function PreviousQuizzesColumn({
  quizzes,
  onQuizClick,
}: PreviousQuizzesColumnProps) {
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
      {/* Title */}
      <div style={{ padding: "14px 14px 10px", borderBottom: `2px solid ${B}`, flexShrink: 0 }}>
        <span
          style={{
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: "0.62rem",
            fontWeight: 700,
            letterSpacing: "0.14em",
            color: "#555",
          }}
        >
          PREVIOUS QUIZZES
        </span>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: "auto" }}>
        {quizzes.length === 0 ? (
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
              No quizzes yet.
              <br />
              Generate your first one.
            </p>
          </div>
        ) : (
          quizzes.map((quiz) => (
            <QuizCard key={quiz.id} quiz={quiz} onClick={() => onQuizClick(quiz)} />
          ))
        )}
      </div>
    </div>
  );
}
