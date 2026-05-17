import { useNavigate } from "react-router-dom";

interface FreshrLogoProps {
  color?: string;
}

export default function FreshrLogo({ color = "#FFFFFF" }: FreshrLogoProps) {
  const navigate = useNavigate();
  return (
    <div
      style={{
        position: "absolute",
        top: 32,
        left: 36,
        fontFamily: "'Syne', sans-serif",
        fontWeight: 800,
        fontSize: "1.5rem",
        letterSpacing: "-0.02em",
        color,
        cursor: "pointer",
      }}
      onClick={() => navigate("/")}
    >
      FRESHR
    </div>
  );
}
