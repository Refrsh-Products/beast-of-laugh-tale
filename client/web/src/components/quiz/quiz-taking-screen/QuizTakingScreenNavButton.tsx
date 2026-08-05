import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * The footer's Prev / Next / Submit control.
 *
 * Adapter over the shared Button so the three call sites keep their existing
 * `green` vocabulary. The hover/press state this used to track by hand is now
 * CSS, which also retires the "stuck shadow" bug it carried a useEffect to
 * work around — there is no imperative style left to get out of step.
 */
export default function NavButton({
  onClick,
  disabled = false,
  green = false,
  children,
}: {
  onClick: () => void;
  disabled?: boolean;
  green?: boolean;
  children: React.ReactNode;
}) {
  return (
    <Button
      onClick={onClick}
      disabled={disabled}
      variant={green ? "default" : "outline"}
      className={cn("min-w-0 sm:min-w-[10rem]")}
    >
      {children}
    </Button>
  );
}
