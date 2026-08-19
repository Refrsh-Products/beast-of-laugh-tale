import QuizTakingScreenModal from "./QuizTakingScreenModal";
import { Button } from "@/components/ui/button";

export default function ExitConfirmModal({
  onKeepGoing,
  onExit,
}: {
  onKeepGoing: () => void;
  onExit: () => void;
}) {
  return (
    <QuizTakingScreenModal
      title="Exit quiz?"
      description="Your progress will be lost."
      onClose={onKeepGoing}
    >
      <Button variant="outline" onClick={onKeepGoing}>
        Keep going
      </Button>
      <Button variant="destructive" onClick={onExit}>
        Exit quiz
      </Button>
    </QuizTakingScreenModal>
  );
}
