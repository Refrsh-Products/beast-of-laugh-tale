import { DialogContent } from "../../ui/dialog";

export default function QuizTakingScreenModal({
  children,
  onClose,
}: {
  children: React.ReactNode;
  onClose?: () => void;
}) {
  return (
    <DialogContent onClose={onClose} className="z-[4000] max-w-sm">
      {children}
    </DialogContent>
  );
}
