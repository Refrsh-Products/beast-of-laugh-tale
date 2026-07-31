import { useNavigate } from "react-router-dom";
import FullLogoMark from "./FullLogoMark";
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
      aria-label="FRESHR home"
      className={cn(
        "flex cursor-pointer items-center gap-2 self-start border-0 bg-transparent p-0",
        className,
      )}
    >
      <FullLogoMark className="h-6 md:h-10" />
    </button>
  );
}
