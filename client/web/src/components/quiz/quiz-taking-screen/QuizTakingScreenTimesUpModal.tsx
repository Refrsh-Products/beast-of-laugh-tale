import QuizTakingScreenModal from "./QuizTakingScreenModal";
import Button from "../../ui/Button";

export default function TimesUpModal({
  timeLimit,
  onSeeResults,
}: {
  timeLimit: number;
  onSeeResults: () => void;
}) {
  return (
    <QuizTakingScreenModal>
      <h2 className="text-lg font-semibold text-foreground mb-2">Time's Up</h2>
      <p className="text-sm text-muted-foreground leading-relaxed mb-6">
        You've used all {timeLimit} minutes.<br />Your answers have been recorded.
      </p>
      <div className="flex justify-center">
        <Button variant="green" onClick={onSeeResults}>See Results →</Button>
      </div>
    </QuizTakingScreenModal>
  );
}
