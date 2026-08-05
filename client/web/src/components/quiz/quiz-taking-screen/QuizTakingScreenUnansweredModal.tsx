import QuizTakingScreenModal from "./QuizTakingScreenModal";
import { Button } from "@/components/ui/button";

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
    <QuizTakingScreenModal
      title={`${count} unanswered ${count === 1 ? "question" : "questions"}`}
      description="Skipped questions will be marked as incorrect."
      onClose={onGoBack}
    >
      <Button variant="outline" onClick={onGoBack}>
        Go back
      </Button>
      <Button onClick={onSubmit}>Submit anyway</Button>
    </QuizTakingScreenModal>
  );
}
