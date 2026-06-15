const B = "#000000";
const W = "#FFFFFF";

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
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.5)",
        zIndex: 4000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
      }}
    >
      <div
        onMouseDown={(e) => e.stopPropagation()}
        style={{
          background: W,
          border: `2px solid ${B}`,
          boxShadow: `4px 4px 0 ${B}`,
          padding: 32,
          maxWidth: 380,
          width: "100%",
        }}
      >
        {children}
      </div>
    </div>
  );
}
