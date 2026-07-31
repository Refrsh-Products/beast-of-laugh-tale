import { useNavigate } from "react-router-dom";
import BrandMark from "./BrandMark";
import { cn } from "@/lib/utils";

interface FreshrLogoProps {
  /**
   * Colour is set by the caller because these screens are not migrated yet and
   * each sits on a different surface. Defaults to text-primary (Timber Green),
   * which is correct on the light panels; pass text-secondary for the Sulu
   * treatment the brandbook specifies on a dark panel.
   */
  className?: string;
}

export default function FreshrLogo({
  className = "text-primary",
}: FreshrLogoProps) {
  const navigate = useNavigate();
  return (
    <button
      type="button"
      onClick={() => navigate("/")}
      aria-label="Freshr home"
      className={cn(
        "absolute top-8 left-9 flex cursor-pointer items-center gap-2 border-0 bg-transparent p-0",
        className,
      )}
    >
      <BrandMark size={28} />
      <span className="text-2xl font-bold tracking-[-0.02em]">FRESHR</span>
    </button>
  );
}
