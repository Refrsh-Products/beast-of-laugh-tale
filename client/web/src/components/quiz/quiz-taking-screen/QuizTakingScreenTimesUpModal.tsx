import QuizTakingScreenModal from "./QuizTakingScreenModal";
import { Button } from "@/components/ui/button";

export default function TimesUpModal({
  timeLimit,
  onSeeResults,
}: {
  timeLimit: number;
  onSeeResults: () => void;
}) {
  return (
    // No onClose: the quiz is already over, so there is nothing to go back to.
    <QuizTakingScreenModal
      title="Time's up"
      description={`You've used all ${timeLimit} minutes. Your answers have been recorded.`}
    >
      <Button onClick={onSeeResults}>See results</Button>
    </QuizTakingScreenModal>
  );
}
