import { View } from 'react-native';
import { cn } from '@/lib/utils';

/**
 * Position indicator for a short linear flow. Mirrors web's StepDots.
 *
 * `total` is a prop rather than a constant because onboarding's last step is
 * conditional — telling someone "step 2 of 3" and then finishing at 2 is worse
 * than a dot appearing late.
 */
export function StepDots({
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
    <View
      className={cn('flex-row items-center justify-center gap-1.5', className)}
      accessibilityRole="progressbar"
      accessibilityLabel={`Step ${current} of ${total}`}>
      {Array.from({ length: total }, (_, i) => {
        const step = i + 1;
        return (
          <View
            key={step}
            className={cn(
              'h-1.5 rounded-full',
              step === current && 'bg-primary w-6',
              step < current && 'bg-primary/40 w-1.5',
              step > current && 'bg-border w-1.5'
            )}
          />
        );
      })}
    </View>
  );
}
