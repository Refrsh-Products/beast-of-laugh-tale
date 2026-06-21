import { useNavigate } from "react-router-dom";

export default function FreshrLogo() {
  const navigate = useNavigate();
  return (
    <button
      onClick={() => navigate("/")}
      className="text-base font-bold text-foreground tracking-tight hover:opacity-80 transition-opacity self-start"
    >
      FRESHR
    </button>
  );
}
