/**
 * ★ THE ONE PLACE ★
 *
 * Semantic design tokens for the mobile app. Every colour in the app resolves
 * here, and nothing below is written twice:
 *
 *   tokens.ts ──┬─ npm run tokens ─→ global.css   (NativeWind / className)
 *               └─ npm run tokens ─→ lib/theme.ts (THEME + NAV_THEME, for JS APIs)
 *
 * Both outputs are generated and committed. Never hand-edit them — edit this
 * file and re-run `npm run tokens`. (They used to be maintained by hand and had
 * already silently diverged, which is why the generator exists.)
 *
 * Components reference these through Tailwind utilities — `bg-card`,
 * `text-muted-foreground`, `border-border` — and never hardcode a colour.
 * Where an API can't take a className (ActivityIndicator, placeholderTextColor,
 * RefreshControl, react-native-svg) use the `useThemeColors()` hook.
 *
 * Two brandbook rules that are easy to get wrong:
 *
 *  1. Sulu is an ACCENT, never a text colour on a light surface. It scores
 *     1.3:1 on Ecru. Green text uses Timber Green, which is --primary in light
 *     mode, so `text-primary` is always the safe choice.
 *
 *  2. Dark mode inverts the brand's own logo rule: on a Timber Green surface the
 *     mark is Sulu, so --primary becomes the neon and carries Timber Green text.
 *     This matches the app icon exactly.
 *
 * Kept in step with `client/web/src/index.css` — same roles, same values, minus
 * the sidebar group, which mobile has no use for.
 */

// The `.ts` extension is deliberate and load-bearing: `npm run tokens` imports
// this module in plain Node, whose ESM resolver has no extension inference.
// Metro and TypeScript (moduleResolution: bundler) both resolve it unchanged.
import { ink, paper, primary, secondary, tertiary, white } from './brand.ts';

/**
 * The canonical token names, in CSS-variable form. The generator derives the
 * camelCase JS keys from these, so this list is the single naming authority —
 * adding a token means adding it here and nowhere else.
 */
export type TokenName =
  | 'background'
  | 'foreground'
  | 'card'
  | 'card-foreground'
  | 'popover'
  | 'popover-foreground'
  | 'primary'
  | 'primary-foreground'
  | 'secondary'
  | 'secondary-foreground'
  | 'muted'
  | 'muted-foreground'
  | 'accent'
  | 'accent-foreground'
  | 'destructive'
  | 'destructive-foreground'
  | 'success'
  | 'success-foreground'
  | 'border'
  | 'input'
  | 'field'
  | 'ring'
  | 'chart-1'
  | 'chart-2'
  | 'chart-3'
  | 'chart-4'
  | 'chart-5';

export type TokenMap = Record<TokenName, string>;

export const light: TokenMap = {
  background: tertiary['100'],
  foreground: ink,
  card: tertiary['50'],
  'card-foreground': ink,
  popover: tertiary['50'],
  'popover-foreground': ink,

  primary: primary['900'],
  'primary-foreground': paper,
  secondary: secondary['300'],
  'secondary-foreground': primary['900'],

  muted: tertiary['200'],
  'muted-foreground': '142.5 9.8% 32.2%', // #4a5a50
  // --accent backs hover/pressed and selected states across menus, ghost
  // buttons and card surfaces, so it has to be quiet. Sulu is far too loud
  // repeated at that density — it stays reserved for --secondary, where it
  // marks a deliberate call to action. This is the pale end of Timber Green.
  accent: primary['100'],
  'accent-foreground': primary['900'],

  destructive: '3.2 71.3% 41%', // #b3261e
  'destructive-foreground': white,

  // The affirmative counterpart to --destructive, for graded results: a marked
  // answer is right or wrong, and colour is how that reads at a glance. Like
  // --destructive it has to work both as text on a surface and as a fill
  // carrying --success-foreground, so it sits deep on the Sulu ramp rather than
  // on Sulu itself, which fails contrast on every light surface.
  success: secondary['800'],
  'success-foreground': white,

  // Three separate jobs, deliberately three tokens:
  //   --border  decorative dividers, may be soft
  //   --input   the OUTLINE of a control, so it must clear the 3:1 non-text
  //             minimum of WCAG 1.4.11 (the brand's tan border steps only reach
  //             1.3:1, hence not reusing --border)
  //   --field   the FILL inside a control. It has to stay near the surface
  //             colour or every input reads as a muddy block.
  border: tertiary['300'],
  input: tertiary['700'],
  field: tertiary['100'],
  ring: primary['600'],

  'chart-1': primary['900'],
  'chart-2': secondary['500'],
  'chart-3': primary['500'],
  'chart-4': secondary['700'],
  'chart-5': primary['300'],
};

export const dark: TokenMap = {
  background: primary['950'],
  foreground: paper,
  card: primary['900'],
  'card-foreground': paper,
  popover: primary['900'],
  'popover-foreground': paper,

  primary: secondary['300'],
  'primary-foreground': primary['900'],
  secondary: primary['700'],
  'secondary-foreground': paper,

  muted: primary['800'],
  'muted-foreground': '142.9 13.7% 70%', // #a8bdb0
  accent: primary['600'],
  'accent-foreground': tertiary['100'],

  destructive: '7.2 100% 73.9%', // #ff8a7a
  'destructive-foreground': ink,

  // Bright enough to read on the dark surfaces, and deliberately a step off
  // --primary (Sulu) so "correct" and "call to action" stay distinguishable.
  success: secondary['400'],
  'success-foreground': ink,

  border: primary['700'],
  input: primary['400'],
  field: primary['800'],
  ring: secondary['300'],

  'chart-1': secondary['300'],
  'chart-2': primary['300'],
  'chart-3': secondary['500'],
  'chart-4': primary['400'],
  'chart-5': secondary['200'],
};

export const themes = { light, dark };

export type ThemeName = keyof typeof themes;

/**
 * Corner rounding, in px. Matches web's 0.75rem. Expressed in px rather than
 * rem because NativeWind's rem base is not worth relying on — `radius.lg` is
 * the shadcn/RNR default radius and the rest of the scale is derived from it.
 */
export const radius = {
  sm: 7, // 0.6×
  md: 10, // 0.8×
  lg: 12, // ← the base
  xl: 17, // 1.4×
  '2xl': 22, // 1.8×
  '3xl': 26, // 2.2×
} as const;
