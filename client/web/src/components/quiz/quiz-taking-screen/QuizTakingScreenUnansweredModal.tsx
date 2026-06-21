import QuizTakingScreenModal from "./QuizTakingScreenModal";
import Button from "../../ui/Button";

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
      <h2 className="text-base font-semibold text-foreground mb-2">
        {count} unanswered {count === 1 ? "question" : "questions"}
      </h2>
      <p className="text-sm text-muted-foreground leading-relaxed mb-6">
        Skipped questions will be marked as incorrect.
      </p>
      <div className="flex gap-2 justify-end">
        <Button variant="default" onClick={onGoBack}>Go Back</Button>
        <Button variant="green" onClick={onSubmit}>Submit Anyway →</Button>
      </div>
    </QuizTakingScreenModal>
  );
}
