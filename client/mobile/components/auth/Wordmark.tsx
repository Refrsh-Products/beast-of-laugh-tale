import { useColorScheme } from '@/hooks/useColorScheme';
import { cn } from '@/lib/utils';
import { Image } from 'react-native';

/** Brandbook palette: Timber Green reads on light, Sulu on dark. */
const TINT = { light: '#19392E', dark: '#B4FF6E' } as const;

/**
 * The FRESHR wordmark used at the top of the auth screens. The brand artwork is
 * a transparent silhouette, so a single asset covers both themes — it gets
 * tinted per colour scheme rather than shipped twice.
 */
export function Wordmark({ className }: { className?: string }) {
  const { isDarkColorScheme } = useColorScheme();

  return (
    <Image
      source={require('@/assets/images/wordmark.png')}
      resizeMode="contain"
      accessibilityRole="image"
      accessibilityLabel="FRESHR"
      className={cn('h-12 w-full self-center', className)}
      style={{ tintColor: isDarkColorScheme ? TINT.dark : TINT.light }}
    />
  );
}
