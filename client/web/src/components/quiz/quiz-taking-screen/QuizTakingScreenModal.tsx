export default function QuizTakingScreenModal({
  children,
  onClose,
}: {
  children: React.ReactNode;
  onClose?: () => void;
}) {
  return (
    <div
      onMouseDown={onClose}
      className="fixed inset-0 z-[4000] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm"
    >
      <div
        onMouseDown={(e) => e.stopPropagation()}
        className="w-full max-w-sm rounded-lg border border-border bg-card p-6 shadow-xl"
      >
        {children}
      </div>
    </div>
  );
}
