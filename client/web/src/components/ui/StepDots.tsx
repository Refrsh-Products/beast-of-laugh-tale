import { cn } from "@/lib/utils";

/**
 * Position indicator for a short linear flow.
 *
 * The dots are decorative and hidden from assistive tech; a live region carries
 * the same information as text instead, since "filled circle, empty circle" is
 * useless read aloud.
 *
 * `total` is a prop rather than a constant because onboarding's last step is
 * conditional — telling someone "step 2 of 3" and then finishing at 2 is worse
 * than a dot appearing late.
 */
export default function StepDots({
  total,
  current,
  className,
}: {
  total: number;
  /** 1-based. */
  current: number;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center justify-center gap-1.5", className)}>
      <div aria-hidden="true" className="flex items-center gap-1.5">
        {Array.from({ length: total }, (_, i) => {
          const step = i + 1;
          return (
            <span
              key={step}
              className={cn(
                "h-1.5 rounded-full transition-all",
                step === current && "bg-primary w-6",
                step < current && "bg-primary/40 w-1.5",
                step > current && "bg-border w-1.5",
              )}
            />
          );
        })}
      </div>
      <span className="sr-only" role="status" aria-live="polite">
        Step {current} of {total}
      </span>
    </div>
  );
}
