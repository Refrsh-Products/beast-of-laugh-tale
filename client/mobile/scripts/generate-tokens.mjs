#!/usr/bin/env node
/**
 * Generates every derived form of the design tokens from `lib/design/`.
 *
 *   lib/design/tokens.ts ──┬─→ global.css                          (NativeWind)
 *   lib/design/typography.ts ├─→ lib/theme.ts                      (JS colour access)
 *                          └─→ lib/design/tailwind-tokens.generated.js (Tailwind config)
 *
 * Three consumers need the same values in three syntaxes, and NativeWind can
 * only read CSS while react-navigation and `color=` props can only read JS.
 * Before this script the CSS and the JS mirror were maintained by hand and had
 * already diverged — `lib/theme.ts` claimed a blue background the CSS never had.
 *
 * Usage:
 *   npm run tokens          write the generated files
 *   npm run tokens:check    exit 1 if what's committed is stale (for CI / pre-push)
 *
 * Loads the TypeScript sources directly via Node's type stripping, so there's no
 * build step and no extra dependency. That's also why `lib/design/*` must stay
 * free of React Native imports and of non-erasable syntax (no enums, no
 * parameter properties).
 */

import { readFile, writeFile } from 'node:fs/promises';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

import { primary, secondary, tertiary, ink, paper } from '../lib/design/brand.ts';
import { radius, themes } from '../lib/design/tokens.ts';
import { fontSans, fontWeights } from '../lib/design/typography.ts';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const CHECK = process.argv.includes('--check');

const BANNER = (source) =>
  `GENERATED FILE — do not edit.\n` +
  `Run \`npm run tokens\` after changing ${source}.`;

/** `card-foreground` → `cardForeground`, `chart-1` → `chart1`. */
const camel = (name) => name.replace(/-(.)/g, (_, c) => c.toUpperCase());

const tokenNames = Object.keys(themes.light);

// ---------------------------------------------------------------- global.css

function buildGlobalCss() {
  const block = (map, indent) =>
    tokenNames.map((name) => `${indent}--${name}: ${map[name]};`).join('\n');

  return `/**
 * ${BANNER('lib/design/tokens.ts').split('\n').join('\n * ')}
 *
 * NativeWind reads the variables below; \`tailwind.config.js\` maps them onto
 * utilities, so \`bg-card\` and \`text-muted-foreground\` resolve from here.
 */

@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
${block(themes.light, '    ')}
    --radius: ${radius.lg}px;
  }

  .dark:root {
${block(themes.dark, '    ')}
    --radius: ${radius.lg}px;
  }
}
`;
}

// ---------------------------------------------------------------- lib/theme.ts

function buildTheme() {
  const block = (map, indent) =>
    tokenNames.map((name) => `${indent}${camel(name)}: 'hsl(${map[name]})',`).join('\n');

  // react-navigation v7 themes carry their own font map, which is what renders
  // native stack headers and back-button labels. Left unset it stays on the
  // system face, so the brand typeface would stop at the edge of our own views.
  const navFonts = Object.entries({
    regular: 'normal',
    medium: 'medium',
    bold: 'bold',
    heavy: 'extrabold',
  })
    .map(
      ([navKey, weightName]) =>
        `      ${navKey}: { fontFamily: '${fontWeights[weightName].family}', fontWeight: '${fontWeights[weightName].weight}' },`
    )
    .join('\n');

  return `/**
 * ${BANNER('lib/design/tokens.ts').split('\n').join('\n * ')}
 *
 * The JS-readable mirror of the CSS variables in \`global.css\`. Needed because
 * react-navigation's ThemeProvider, \`ActivityIndicator color=\`,
 * \`placeholderTextColor\`, \`RefreshControl tintColor\` and react-native-svg
 * cannot read a className.
 *
 * Prefer the \`useThemeColors()\` hook over importing THEME directly — it picks
 * the active scheme for you.
 */

import { DarkTheme, DefaultTheme, type Theme } from '@react-navigation/native';

export const THEME = {
  light: {
${block(themes.light, '    ')}
    radius: ${radius.lg},
  },
  dark: {
${block(themes.dark, '    ')}
    radius: ${radius.lg},
  },
};

export type ThemeColors = (typeof THEME)['light'];

export const NAV_THEME: Record<'light' | 'dark', Theme> = {
  light: {
    ...DefaultTheme,
    fonts: {
      ...DefaultTheme.fonts,
${navFonts}
    },
    colors: {
      background: THEME.light.background,
      border: THEME.light.border,
      card: THEME.light.card,
      notification: THEME.light.destructive,
      primary: THEME.light.primary,
      text: THEME.light.foreground,
    },
  },
  dark: {
    ...DarkTheme,
    fonts: {
      ...DarkTheme.fonts,
${navFonts}
    },
    colors: {
      background: THEME.dark.background,
      border: THEME.dark.border,
      card: THEME.dark.card,
      notification: THEME.dark.destructive,
      primary: THEME.dark.primary,
      text: THEME.dark.foreground,
    },
  },
};
`;
}

// ------------------------------------------------- tailwind-tokens.generated.js

function buildTailwindTokens() {
  const colors = tokenNames.map((name) => `  '${name}': 'hsl(var(--${name}))',`).join('\n');

  const weights = Object.entries(fontWeights)
    .map(
      ([name, { weight, family }]) =>
        `  ${name}: { weight: '${weight}', family: '${family}' },`
    )
    .join('\n');

  const radii = Object.entries(radius)
    .map(([name, px]) => `  '${name}': ${px},`)
    .join('\n');

  // The ramps are theme-invariant, so unlike the semantic tokens they need no
  // CSS-variable indirection — they go in as literal colours.
  const ramp = (name, steps) =>
    Object.entries(steps)
      .map(([step, hsl]) => `    '${step}': 'hsl(${hsl})',`)
      .join('\n');

  const brandColors = `  'brand-primary': {
${ramp('primary', primary)}
  },
  'brand-secondary': {
${ramp('secondary', secondary)}
  },
  'brand-tertiary': {
${ramp('tertiary', tertiary)}
  },
  'brand-ink': 'hsl(${ink})',
  'brand-paper': 'hsl(${paper})',`;

  return `/**
 * ${BANNER('lib/design/tokens.ts and lib/design/typography.ts').split('\n').join('\n * ')}
 *
 * CommonJS because \`tailwind.config.js\` has to \`require\` it — Tailwind loads
 * its config in plain Node, where the TypeScript sources aren't reachable.
 */

/** Every semantic token, as the \`hsl(var(--x))\` form NativeWind resolves. */
const colors = {
${colors}
};

/**
 * The raw brandbook ramps. Reach for a semantic token above instead — these are
 * only for the rare component that needs one specific shade (a chart series, an
 * illustration fill) rather than a role. They are theme-invariant, so they carry
 * literal colours rather than variables.
 */
const brandColors = {
${brandColors}
};

/** Weight utility → face. See lib/design/typography.ts for why both are needed. */
const fontWeights = {
${weights}
};

const radius = {
${radii}
};

const fontSans = '${fontSans}';

module.exports = { colors, brandColors, fontWeights, radius, fontSans };
`;
}

// ---------------------------------------------------------------------- main

const outputs = [
  ['global.css', buildGlobalCss()],
  ['lib/theme.ts', buildTheme()],
  ['lib/design/tailwind-tokens.generated.js', buildTailwindTokens()],
];

let stale = false;

for (const [path, content] of outputs) {
  const full = join(ROOT, path);
  const existing = await readFile(full, 'utf8').catch(() => null);

  if (existing === content) continue;

  if (CHECK) {
    stale = true;
    console.error(
      `✗ ${relative(process.cwd(), full)} is out of date${existing === null ? ' (missing)' : ''}`
    );
    continue;
  }

  await writeFile(full, content, 'utf8');
  console.log(`✓ wrote ${relative(process.cwd(), full)}`);
}

if (CHECK) {
  if (stale) {
    console.error('\nGenerated token files are stale. Run `npm run tokens` and commit the result.');
    process.exit(1);
  }
  console.log('✓ generated token files are up to date');
} else {
  console.log('Done. Restart Metro with `-c` so NativeWind picks up the new CSS.');
}
