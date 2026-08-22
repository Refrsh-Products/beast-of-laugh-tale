import { useThemeColors } from '@/hooks/useThemeColors';
import { cn } from '@/lib/utils';
import { Image } from 'react-native';

/**
 * The FRESHR wordmark used at the top of the auth screens. The brand artwork is
 * a transparent silhouette, so a single asset covers both themes — it gets
 * tinted per colour scheme rather than shipped twice.
 *
 * `--primary` is exactly the right token and needs no light/dark branch of its
 * own: the brandbook says the mark is Timber Green on a light surface and Sulu
 * on a dark one, which is the same inversion --primary already makes.
 */
export function Wordmark({ className }: { className?: string }) {
  const colors = useThemeColors();

  return (
    <Image
      source={require('@/assets/images/wordmark.png')}
      resizeMode="contain"
      accessibilityRole="image"
      accessibilityLabel="FRESHR"
      className={cn('h-12 w-full self-center', className)}
      style={{ tintColor: colors.primary }}
    />
  );
}
