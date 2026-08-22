const { hairlineWidth } = require('nativewind/theme');
const plugin = require('tailwindcss/plugin');

// Generated from lib/design/ by `npm run tokens`. Tailwind loads this config in
// plain Node, so it can't read the TypeScript sources directly.
const tokens = require('./lib/design/tailwind-tokens.generated.js');

/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        ...tokens.colors,
        ...tokens.brandColors,
      },
      fontFamily: {
        sans: [tokens.fontSans],
      },
      borderRadius: {
        sm: tokens.radius.sm,
        md: tokens.radius.md,
        lg: tokens.radius.lg,
        xl: tokens.radius.xl,
        '2xl': tokens.radius['2xl'],
        '3xl': tokens.radius['3xl'],
      },
      borderWidth: {
        hairline: hairlineWidth(),
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
      },
    },
  },
  future: {
    hoverOnlyWhenSupported: true,
  },
  plugins: [
    require('tailwindcss-animate'),

    // Weight utilities have to carry the font FAMILY as well as the weight.
    // React Native won't pick InstrumentSans_600SemiBold out of a `fontWeight: 600`
    // when the family is a static face — it renders Regular, or a synthesised
    // fake-bold, depending on platform. Redefining the utilities here means the
    // ~566 existing `font-semibold`/`font-bold` classNames across the app resolve
    // to the right face with no edits. See lib/design/typography.ts.
    plugin(({ addUtilities }) => {
      const utilities = {};
      for (const [name, { weight, family }] of Object.entries(tokens.fontWeights)) {
        utilities[`.font-${name}`] = { fontFamily: family, fontWeight: weight };
      }
      addUtilities(utilities);
    }),
  ],
};
