/**
 * FRESHR Brandbook V1 (2026) — the three brand ramps, verbatim.
 *
 * These are the raw scales. Components must never reach for a ramp step: use a
 * semantic token from `tokens.ts` instead, which is defined in terms of these.
 * The only exception is a component that genuinely needs one specific shade
 * (a chart series, an illustration fill) rather than a role.
 *
 * The brand anchors each scale at a different step:
 *   Primary   = brand-900 Timber Green  #19392E
 *   Secondary = brand-300 Sulu          #B4FF6E
 *   Tertiary  = brand-100 Ecru White    #F1F1E7
 *
 * Values are HSL triplets ("H S% L%") rather than hex because `tailwind.config.js`
 * wraps every colour as `hsl(var(--token))`, which is what NativeWind consumes.
 * The hex on each line is the brandbook original and the authority — if you ever
 * re-derive these, derive from the hex. They match
 * `client/web/src/index.css` step for step, so web and mobile stay one brand.
 *
 * This module is pure data with no platform dependency. If cross-platform token
 * sharing ever becomes worthwhile, this is the file to lift into @freshr/shared.
 */

export type RampStep =
  | '50'
  | '100'
  | '200'
  | '300'
  | '400'
  | '500'
  | '600'
  | '700'
  | '800'
  | '900'
  | '950';

export type Ramp = Record<RampStep, string>;

/** Timber Green. The brand's anchor is step 900. */
export const primary: Ramp = {
  '50': '145.7 33.3% 95.9%', // #f1f8f4
  '100': '145.3 37.3% 90%', // #dcefe4
  '200': '148.2 34% 80.4%', // #bcdecc
  '300': '151.6 32.5% 66.9%', // #8fc6ac
  '400': '153.7 29.6% 51.6%', // #5fa888
  '500': '155.1 38.3% 39.4%', // #3e8b6b
  '600': '156.7 43.2% 30.4%', // #2c6f55
  '700': '158.1 41.9% 24.3%', // #245845
  '800': '158 40.6% 19.8%', // #1e4738
  '900': '159.4 39% 16.1%', // #19392e  ← Timber Green
  '950': '162 43.5% 9%', // #0d211b
};

/** Sulu. The brand's anchor is step 300 — the neon accent. */
export const secondary: Ramp = {
  '50': '87.7 100% 94.9%', // #f3ffe5
  '100': '88.9 100% 89%', // #e4ffc7
  '200': '90 100% 79.2%', // #caff95
  '300': '91 100% 71.6%', // #b4ff6e  ← Sulu
  '400': '91.9 92.1% 55.5%', // #87f625
  '500': '92.8 95.6% 44.3%', // #67dd05
  '600': '93.9 100% 34.7%', // #4db100
  '700': '94.9 92.8% 27.3%', // #3b8605
  '800': '95.1 81% 22.7%', // #32690b
  '900': '96.8 72.8% 20.2%', // #2b590e
  '950': '98 96.1% 10%', // #133201
};

/** Ecru White. The brand's anchor is step 100 — the light surface. */
export const tertiary: Ramp = {
  '50': '60 26.3% 96.3%', // #f8f8f3
  '100': '60 26.3% 92.5%', // #f1f1e7  ← Ecru White
  '200': '60 26.3% 88.8%', // #eaeadb
  '300': '60 26.1% 76.7%', // #d3d3b4
  '400': '57.4 26% 64.5%', // #bcba8d
  '500': '54.7 25.6% 56.3%', // #aca773
  '600': '49.4 24.4% 50.2%', // #9f9461
  '700': '43.6 24.7% 43.7%', // #8b7c54
  '800': '37.3 23.8% 37.1%', // #756448
  '900': '35.3 21.2% 31.4%', // #61533f
  '950': '33.3 20% 26.5%', // #514536
};

/** The two brandbook neutrals, which sit outside the ramps. */
export const ink = '80 11.1% 5.3%'; // #0e0f0c
export const paper = '100 10% 88.2%'; // #e0e4de

export const white = '0 0% 100%';

export const brand = { primary, secondary, tertiary, ink, paper, white };
