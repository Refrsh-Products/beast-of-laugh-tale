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

/**
 * The names of the colour entries only. `ThemeColors` also carries `radius`,
 * which is a number and not something you can hand to a colour prop — so
 * anything typed as "a token to colour something with" wants this, not
 * `keyof ThemeColors`.
 */
export type ThemeColorName = {
  [K in keyof ThemeColors]: ThemeColors[K] extends string ? K : never;
}[keyof ThemeColors];

export type { ThemeColors };

export default useThemeColors;
