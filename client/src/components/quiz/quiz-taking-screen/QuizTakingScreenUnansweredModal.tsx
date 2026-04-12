import QuizTakingScreenModal from "./QuizTakingScreenModal";
import QuizTakingScreenModalBtn from "./QuizTakingScreenModalBtn";

const G = "#84e487";
const B = "#000000";
const W = "#FFFFFF";

export default function UnansweredModal({
  count,
  onGoBack,
  onSubmit,
}: {
  count: number;
  onGoBack: () => void;
  onSubmit: () => void;
}) {
  return (
    <QuizTakingScreenModal onClose={onGoBack}>
      <h2
        style={{
          fontFamily: "'Syne', sans-serif",
          fontSize: "1.2rem",
          fontWeight: 800,
          color: B,
          margin: "0 0 12px",
          letterSpacing: "-0.02em",
        }}
      >
        {count} unanswered {count === 1 ? "question" : "questions"}
      </h2>
      <p
        style={{
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: "0.78rem",
          color: "#555",
          margin: "0 0 28px",
          lineHeight: 1.7,
        }}
      >
        Skipped questions will be marked as incorrect.
      </p>
      <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
        <QuizTakingScreenModalBtn
          onClick={onGoBack}
          bg={W}
          color={B}
          border={`2px solid ${B}`}
        >
          Go Back
        </QuizTakingScreenModalBtn>
        <QuizTakingScreenModalBtn
          onClick={onSubmit}
          bg={G}
          color={B}
          border={`2px solid ${B}`}
        >
          Submit Anyway →
        </QuizTakingScreenModalBtn>
      </div>
    </QuizTakingScreenModal>
  );
}
