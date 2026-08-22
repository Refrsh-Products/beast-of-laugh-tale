import { THEME, type ThemeColors } from '@/lib/theme';
import { useColorScheme } from '@/hooks/useColorScheme';

/**
 * The active theme's colours, as plain `hsl(...)` strings.
 *
 * This is the sanctioned escape hatch for the React Native APIs that take a
 * colour prop rather than a className — `ActivityIndicator color=`,
 * `placeholderTextColor`, `RefreshControl tintColor`, `Image tintColor`,
 * react-native-svg fills, and the react-native-markdown-display style objects.
 *
 * Anywhere a className works, use the className: `bg-card`, `text-destructive`,
 * `border-border`. Lucide icons take one too — `components/ui/icon.tsx` wires
 * `cssInterop`, so `<Icon as={X} className="text-destructive" />` is preferred
 * over passing `color` from here.
 *
 * Both this and the Tailwind utilities resolve from `lib/design/tokens.ts`, so
 * they can't disagree.
 *
 * @example
 * const colors = useThemeColors();
 * <ActivityIndicator color={colors.primaryForeground} />
 */
export function useThemeColors(): ThemeColors {
  const { isDarkColorScheme } = useColorScheme();
  return isDarkColorScheme ? THEME.dark : THEME.light;
}

export type { ThemeColors };

export default useThemeColors;
