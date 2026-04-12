import type { QuizSession } from "../../hooks/useQuizService.api";
import QuizCard from "../quiz/QuizCard";

const B = "#000000";
const W = "#FFFFFF";

interface PreviousQuizzesColumnProps {
  quizzes: QuizSession[];
  selectedQuizId: string | null;
  onQuizClick: (quiz: QuizSession) => void;
}

export default function PreviousQuizzesColumn({
  quizzes,
  selectedQuizId,
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
            <QuizCard
              key={quiz.id}
              quiz={quiz}
              selected={quiz.id === selectedQuizId}
              onClick={() => onQuizClick(quiz)}
            />
          ))
        )}
      </div>
    </div>
  );
}
