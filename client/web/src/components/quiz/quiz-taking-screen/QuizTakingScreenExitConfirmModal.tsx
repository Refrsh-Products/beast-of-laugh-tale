import QuizTakingScreenModal from "./QuizTakingScreenModal";
import Button from "../../ui/Button";

export default function ExitConfirmModal({
  onKeepGoing,
  onExit,
}: {
  onKeepGoing: () => void;
  onExit: () => void;
}) {
  return (
    <QuizTakingScreenModal onClose={onKeepGoing}>
      <h2 className="text-base font-semibold text-foreground mb-2">Exit quiz?</h2>
      <p className="text-sm text-muted-foreground leading-relaxed mb-6">
        Your progress will be lost.
      </p>
      <div className="flex gap-2 justify-end">
        <Button variant="default" onClick={onKeepGoing}>Keep Going</Button>
        <Button variant="danger" onClick={onExit}>Exit Quiz</Button>
      </div>
    </QuizTakingScreenModal>
  );
}
