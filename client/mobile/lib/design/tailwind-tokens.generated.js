/**
 * GENERATED FILE — do not edit.
 * Run `npm run tokens` after changing lib/design/tokens.ts and lib/design/typography.ts.
 *
 * CommonJS because `tailwind.config.js` has to `require` it — Tailwind loads
 * its config in plain Node, where the TypeScript sources aren't reachable.
 */

/** Every semantic token, as the `hsl(var(--x))` form NativeWind resolves. */
const colors = {
  'background': 'hsl(var(--background))',
  'foreground': 'hsl(var(--foreground))',
  'card': 'hsl(var(--card))',
  'card-foreground': 'hsl(var(--card-foreground))',
  'popover': 'hsl(var(--popover))',
  'popover-foreground': 'hsl(var(--popover-foreground))',
  'primary': 'hsl(var(--primary))',
  'primary-foreground': 'hsl(var(--primary-foreground))',
  'secondary': 'hsl(var(--secondary))',
  'secondary-foreground': 'hsl(var(--secondary-foreground))',
  'muted': 'hsl(var(--muted))',
  'muted-foreground': 'hsl(var(--muted-foreground))',
  'accent': 'hsl(var(--accent))',
  'accent-foreground': 'hsl(var(--accent-foreground))',
  'destructive': 'hsl(var(--destructive))',
  'destructive-foreground': 'hsl(var(--destructive-foreground))',
  'success': 'hsl(var(--success))',
  'success-foreground': 'hsl(var(--success-foreground))',
  'border': 'hsl(var(--border))',
  'input': 'hsl(var(--input))',
  'field': 'hsl(var(--field))',
  'ring': 'hsl(var(--ring))',
  'chart-1': 'hsl(var(--chart-1))',
  'chart-2': 'hsl(var(--chart-2))',
  'chart-3': 'hsl(var(--chart-3))',
  'chart-4': 'hsl(var(--chart-4))',
  'chart-5': 'hsl(var(--chart-5))',
};

/**
 * The raw brandbook ramps. Reach for a semantic token above instead — these are
 * only for the rare component that needs one specific shade (a chart series, an
 * illustration fill) rather than a role. They are theme-invariant, so they carry
 * literal colours rather than variables.
 */
const brandColors = {
  'brand-primary': {
    '50': 'hsl(145.7 33.3% 95.9%)',
    '100': 'hsl(145.3 37.3% 90%)',
    '200': 'hsl(148.2 34% 80.4%)',
    '300': 'hsl(151.6 32.5% 66.9%)',
    '400': 'hsl(153.7 29.6% 51.6%)',
    '500': 'hsl(155.1 38.3% 39.4%)',
    '600': 'hsl(156.7 43.2% 30.4%)',
    '700': 'hsl(158.1 41.9% 24.3%)',
    '800': 'hsl(158 40.6% 19.8%)',
    '900': 'hsl(159.4 39% 16.1%)',
    '950': 'hsl(162 43.5% 9%)',
  },
  'brand-secondary': {
    '50': 'hsl(87.7 100% 94.9%)',
    '100': 'hsl(88.9 100% 89%)',
    '200': 'hsl(90 100% 79.2%)',
    '300': 'hsl(91 100% 71.6%)',
    '400': 'hsl(91.9 92.1% 55.5%)',
    '500': 'hsl(92.8 95.6% 44.3%)',
    '600': 'hsl(93.9 100% 34.7%)',
    '700': 'hsl(94.9 92.8% 27.3%)',
    '800': 'hsl(95.1 81% 22.7%)',
    '900': 'hsl(96.8 72.8% 20.2%)',
    '950': 'hsl(98 96.1% 10%)',
  },
  'brand-tertiary': {
    '50': 'hsl(60 26.3% 96.3%)',
    '100': 'hsl(60 26.3% 92.5%)',
    '200': 'hsl(60 26.3% 88.8%)',
    '300': 'hsl(60 26.1% 76.7%)',
    '400': 'hsl(57.4 26% 64.5%)',
    '500': 'hsl(54.7 25.6% 56.3%)',
    '600': 'hsl(49.4 24.4% 50.2%)',
    '700': 'hsl(43.6 24.7% 43.7%)',
    '800': 'hsl(37.3 23.8% 37.1%)',
    '900': 'hsl(35.3 21.2% 31.4%)',
    '950': 'hsl(33.3 20% 26.5%)',
  },
  'brand-ink': 'hsl(80 11.1% 5.3%)',
  'brand-paper': 'hsl(100 10% 88.2%)',
};

/** Weight utility → face. See lib/design/typography.ts for why both are needed. */
const fontWeights = {
  normal: { weight: '400', family: 'InstrumentSans_400Regular' },
  medium: { weight: '500', family: 'InstrumentSans_500Medium' },
  semibold: { weight: '600', family: 'InstrumentSans_600SemiBold' },
  bold: { weight: '700', family: 'InstrumentSans_700Bold' },
  extrabold: { weight: '700', family: 'InstrumentSans_700Bold' },
  black: { weight: '700', family: 'InstrumentSans_700Bold' },
};

const radius = {
  'sm': 7,
  'md': 10,
  'lg': 12,
  'xl': 17,
  '2xl': 22,
  '3xl': 26,
};

const fontSans = 'InstrumentSans_400Regular';

module.exports = { colors, brandColors, fontWeights, radius, fontSans };
