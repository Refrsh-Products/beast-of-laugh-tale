/**
 * The design system's public surface.
 *
 * Day to day you shouldn't need this — colour reaches components through
 * Tailwind utilities (`bg-card`, `text-muted-foreground`), which resolve from
 * the same tokens via `global.css`. Import from here only for the cases a
 * className can't cover:
 *
 *   - a colour passed to a prop (`ActivityIndicator color=`,
 *     `placeholderTextColor`, `RefreshControl tintColor`, react-native-svg) —
 *     use the `useThemeColors()` hook rather than THEME directly
 *   - `fontMono` for code and transcript output
 *   - a brand ramp step, where a component genuinely needs one specific shade
 *
 * `tokens.ts` is the file to edit; everything else is derived from it.
 */

export { brand, hsl, ink, paper, primary, secondary, tertiary, white } from './brand';
export type { Ramp, RampStep } from './brand';

export { dark, light, radius, themes } from './tokens';
export type { ThemeName, TokenMap, TokenName } from './tokens';

export { fontMono, fontSans, fontWeights } from './typography';
export type { FontWeightName } from './typography';
