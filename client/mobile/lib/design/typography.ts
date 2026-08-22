/**
 * Typography tokens. Instrument Sans is the brand's single typeface — headings,
 * body and UI all use it (Brandbook, Typography).
 *
 * React Native will not pick the right font *file* from a `fontWeight` when the
 * family is a custom static face: asking for `InstrumentSans_400Regular` at
 * weight 600 gets you Regular, or a synthesised fake-bold, depending on the
 * platform. So weight and family have to travel together.
 *
 * Rather than rewrite the ~566 existing `font-semibold` classNames, the Tailwind
 * config redefines the weight utilities to set BOTH properties, driven by the map
 * below. `className="font-semibold"` keeps working everywhere and simply resolves
 * to the SemiBold face.
 *
 * The faces come from @expo-google-fonts/instrument-sans and are registered in
 * `app/_layout.tsx`. The family strings must match its export names exactly.
 *
 * Kept free of React Native imports: `npm run tokens` loads this module in plain
 * Node to generate the Tailwind config's font map.
 */

/** Tailwind weight utility → the face that actually carries that weight. */
export const fontWeights = {
  normal: { weight: '400', family: 'InstrumentSans_400Regular' },
  medium: { weight: '500', family: 'InstrumentSans_500Medium' },
  semibold: { weight: '600', family: 'InstrumentSans_600SemiBold' },
  bold: { weight: '700', family: 'InstrumentSans_700Bold' },
  // Instrument Sans ships no 800/900 face. `font-extrabold` and `font-black`
  // fall back to Bold rather than letting the platform synthesise a smeared
  // fake-heavy, which is what happens if you ask for a weight with no file.
  extrabold: { weight: '700', family: 'InstrumentSans_700Bold' },
  black: { weight: '700', family: 'InstrumentSans_700Bold' },
} as const;

export type FontWeightName = keyof typeof fontWeights;

/** The default face. `font-sans` and unstyled `<Text>` resolve to this. */
export const fontSans = fontWeights.normal.family;

/**
 * Not a brand face. It exists only for code blocks and transcript output, and
 * deliberately stays on the platform's own monospace rather than shipping a
 * fourth font file for a handful of screens. Consumers resolve it with
 * `Platform.select(fontMono)`.
 */
export const fontMono = { ios: 'Menlo', default: 'monospace' } as const;

// Tracking is not a token here. The brandbook tightens headings to -0.02em and
// the heading variants in `components/ui/text.tsx` already carry Tailwind's
// `tracking-tight` (-0.025em), which is the same thing at UI sizes. Adding a
// token would mean a second way to say it, and letterSpacing in em is the one
// unit NativeWind resolves inconsistently on native.
