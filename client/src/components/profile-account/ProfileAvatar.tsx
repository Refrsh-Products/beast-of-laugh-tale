const G = "#84e487";
const B = "#000000";

export default function ProfileAvatar({
  letter,
  size = 80,
}: {
  letter: string;
  size?: number;
}) {
  return (
    <div
      style={{
        width: size,
        height: size,
        background: G,
        border: `3px solid ${B}`,
        borderRadius: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "'Syne', sans-serif",
        fontWeight: 800,
        fontSize: `${Math.round(size * 0.375)}px`,
        color: B,
        flexShrink: 0,
        boxShadow: `4px 4px 0 ${B}`,
        userSelect: "none",
      }}
    >
      {letter}
    </div>
  );
}
