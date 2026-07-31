import QuizTakingScreenModal from "./QuizTakingScreenModal";
import Button from "../../ui/LegacyButton";

const B = "#000000"

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
          color: "#000000",
          margin: "0 0 28px",
          lineHeight: 1.7,
        }}
      >
        Your progress will be lost.
      </p>
      <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
        <Button variant="default" onClick={onKeepGoing}>Keep Going</Button>
        <Button variant="danger" onClick={onExit}>Exit Quiz</Button>
      </div>
    </QuizTakingScreenModal>
  );
}
