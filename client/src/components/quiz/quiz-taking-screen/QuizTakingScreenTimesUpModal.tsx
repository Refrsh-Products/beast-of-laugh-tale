import QuizTakingScreenModal from "./QuizTakingScreenModal";
import QuizTakingScreenModalBtn from "./QuizTakingScreenModalBtn";

const G = "#84e487";
const B = "#000000";

export default function TimesUpModal({
  timeLimit,
  onSeeResults,
}: {
  timeLimit: number;
  onSeeResults: () => void;
}) {
  return (
    <QuizTakingScreenModal>
      <h2
        style={{
          fontFamily: "'Syne', sans-serif",
          fontSize: "1.4rem",
          fontWeight: 800,
          color: B,
          margin: "0 0 12px",
          letterSpacing: "-0.02em",
        }}
      >
        Time's Up
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
        You've used all {timeLimit} minutes.
        <br />
        Your answers have been recorded.
      </p>
      <div style={{ display: "flex", justifyContent: "center" }}>
        <QuizTakingScreenModalBtn
          onClick={onSeeResults}
          bg={G}
          color={B}
          border={`2px solid ${B}`}
        >
          See Results →
        </QuizTakingScreenModalBtn>
      </div>
    </QuizTakingScreenModal>
  );
}
