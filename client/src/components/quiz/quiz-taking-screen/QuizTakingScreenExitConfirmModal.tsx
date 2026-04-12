import QuizTakingScreenModal from "./QuizTakingScreenModal";
import QuizTakingScreenModalBtn from "./QuizTakingScreenModalBtn";

const B = "#000000";
const W = "#FFFFFF";
const R = "#FF4D4D";

export default function ExitConfirmModal({
  onKeepGoing,
  onExit,
}: {
  onKeepGoing: () => void;
  onExit: () => void;
}) {
  return (
    <QuizTakingScreenModal onClose={onKeepGoing}>
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
        Exit quiz?
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
        Your progress will be lost.
      </p>
      <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
        <QuizTakingScreenModalBtn
          onClick={onKeepGoing}
          bg={W}
          color={B}
          border={`2px solid ${B}`}
        >
          Keep Going
        </QuizTakingScreenModalBtn>
        <QuizTakingScreenModalBtn
          onClick={onExit}
          bg={R}
          color={W}
          border={`2px solid ${B}`}
        >
          Exit Quiz
        </QuizTakingScreenModalBtn>
      </div>
    </QuizTakingScreenModal>
  );
}
