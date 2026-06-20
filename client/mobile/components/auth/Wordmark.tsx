import { Text } from '@/components/ui/text';
import { cn } from '@/lib/utils';

/**
 * The FRESHR wordmark used at the top of the auth screens. Rendered as styled
 * text (serif, wide tracking, brand green) so there's no image asset to ship.
 */
export function Wordmark({ className }: { className?: string }) {
  return (
    <Text
      className={cn(
        'text-center font-serif text-5xl font-bold tracking-[8px] text-[#34c759]',
        className
      )}
    >
      FRESHR
    </Text>
  );
}
