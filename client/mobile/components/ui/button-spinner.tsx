import { useThemeColors, type ThemeColorName } from '@/hooks/useThemeColors';
import { ActivityIndicator } from 'react-native';
import type { ButtonProps } from '@/components/ui/button';

type ButtonVariant = NonNullable<ButtonProps['variant']>;

/**
 * Which foreground each button variant puts on its own surface. Mirrors
 * `buttonTextVariants` in button.tsx — the spinner replaces the label, so it has
 * to be the colour the label would have been.
 */
const SPINNER_COLOR: Record<ButtonVariant, ThemeColorName> = {
  default: 'primaryForeground',
  destructive: 'destructiveForeground',
  secondary: 'secondaryForeground',
  outline: 'foreground',
  ghost: 'foreground',
  link: 'primary',
};

/**
 * The in-progress state of a `<Button>`.
 *
 * `ActivityIndicator` takes a colour prop rather than a className, so it can't
 * inherit from the button the way `<Text>` does through `TextClassContext`.
 * Every call site used to hardcode white, which was only ever right on a filled
 * primary button and never right in dark mode.
 *
 * @example
 * <Button onPress={submit} disabled={loading}>
 *   {loading ? <ButtonSpinner /> : <Text>Save</Text>}
 * </Button>
 */
export function ButtonSpinner({
  variant = 'default',
  size,
}: {
  variant?: ButtonVariant;
  size?: 'small' | 'large';
}) {
  const colors = useThemeColors();
  return <ActivityIndicator color={colors[SPINNER_COLOR[variant]]} size={size} />;
}
