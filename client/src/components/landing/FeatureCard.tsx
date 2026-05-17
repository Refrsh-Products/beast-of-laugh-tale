const B = "#000000"; // black
const W = "#FFFFFF"; // white

interface FeatureCardProps {
  icon: string;
  title: string;
  desc: string;
}

export default function FeatureCard({ title, icon, desc }: FeatureCardProps) {
  return (
    <div
      style={{
        background: W,
        border: `2px solid ${B}`,
        padding: "28px 24px",
      }}
    >
      <div style={{ fontSize: "1.75rem", marginBottom: 14 }}>{icon}</div>
      <h3
        style={{
          fontFamily: "'Syne', sans-serif",
          fontWeight: 700,
          fontSize: "0.8rem",
          letterSpacing: "0.1em",
          marginBottom: 10,
        }}
      >
        {title}
      </h3>
      <p
        style={{
          fontSize: "0.78rem",
          lineHeight: 1.85,
          color: "#000000",
          fontFamily: "'IBM Plex Mono', monospace",
          margin: 0,
        }}
      >
        {desc}
      </p>
    </div>
  );
}
