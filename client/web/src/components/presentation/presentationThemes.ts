/**
 * Slide themes — the palette a generated deck is rendered with.
 *
 * These are deliberately literal colour values and are exempt from the
 * design-token rule, for two reasons:
 *
 *  1. They are *content*, not UI chrome. A deck's theme must look the same
 *     wherever it is shown, and must NOT follow the app's light/dark mode —
 *     an "Academic" deck stays pale blue on a dark-mode screen.
 *  2. The exporters (jspdf / pptxgenjs / html2canvas) write these values into
 *     a PDF or PPTX file. They cannot resolve CSS custom properties, so the
 *     concrete values have to exist in JS.
 *
 * Keeping them in one module means the colour-literal baseline records a
 * single, explicable entry instead of the same hexes scattered across the
 * generator, the preview and the export path.
 */

import type { PresentationThemeKey } from "@freshr/shared";

/** The key a deck is stored under. Defined in @freshr/shared so the API
 *  payload and this palette table cannot drift apart. */
export type PresentationTheme = PresentationThemeKey;

export interface SlideTheme {
  label: string;
  bg: string;
  text: string;
  accent: string;
  /** Display face — the title-only slide and the quote mark. */
  titleFont: string;
  /** Everything else on the slide. */
  bodyFont: string;
  /** Single family name for PPTX: Office cannot take a CSS font stack. */
  pptxFont: string;
  /** Whether the slide carries the accent strip down its left edge. */
  accentStrip: boolean;
}

const MONO = "'IBM Plex Mono', monospace";
const DISPLAY = "'Syne', sans-serif";
const SANS = "'Helvetica Neue', Arial, sans-serif";
const SERIF = "'Georgia', 'Times New Roman', serif";

export const PRESENTATION_THEMES: Record<PresentationTheme, SlideTheme> = {
  freshr: {
    label: "Freshr",
    bg: "#ffffff",
    text: "#19392e",
    accent: "#b4ff6e",
    titleFont: DISPLAY,
    bodyFont: MONO,
    pptxFont: "Courier New",
    accentStrip: true,
  },
  minimal: {
    label: "Minimal",
    bg: "#ffffff",
    text: "#333333",
    accent: "#cccccc",
    titleFont: SANS,
    bodyFont: SANS,
    pptxFont: "Arial",
    // The whole point of Minimal is the absence of ornament.
    accentStrip: false,
  },
  dark: {
    label: "Dark",
    bg: "#1a1a1a",
    text: "#ffffff",
    accent: "#b4ff6e",
    titleFont: DISPLAY,
    bodyFont: MONO,
    pptxFont: "Courier New",
    accentStrip: true,
  },
  academic: {
    label: "Academic",
    bg: "#eef3f8",
    text: "#1e3a5f",
    accent: "#2a72b5",
    titleFont: SANS,
    bodyFont: SANS,
    pptxFont: "Arial",
    accentStrip: true,
  },
  serif: {
    label: "Serif",
    bg: "#faf7f2",
    text: "#3b2f1e",
    accent: "#8b6a1f",
    titleFont: SERIF,
    bodyFont: SERIF,
    pptxFont: "Georgia",
    accentStrip: true,
  },
};

export const PRESENTATION_THEME_KEYS = Object.keys(
  PRESENTATION_THEMES,
) as PresentationTheme[];

/**
 * What a deck is rendered with when no theme is known — decks generated before
 * `theme` existed on the session carry no key.
 */
export const DEFAULT_SLIDE_THEME: SlideTheme = PRESENTATION_THEMES.freshr;

/** Map a session's stored theme key onto a palette, tolerating a missing or
 *  unrecognised key rather than rendering nothing. */
export function resolveSlideTheme(
  key: PresentationThemeKey | string | null | undefined,
): SlideTheme {
  if (typeof key === "string" && key in PRESENTATION_THEMES) {
    return PRESENTATION_THEMES[key as PresentationThemeKey];
  }
  return DEFAULT_SLIDE_THEME;
}

/**
 * Slide text that is deliberately secondary — captions, attributions, the
 * body-text block — and the hairlines between blocks.
 *
 * Mixes the theme's own text colour toward its background rather than naming a
 * grey, so it stays legible on the dark theme where a fixed #555 would vanish.
 * The result is a flat hex on purpose: this value is also handed to pptxgenjs
 * and rendered through html2canvas, and neither resolves color-mix() or alpha
 * the way a browser would.
 */
export function blendedSlideText(theme: SlideTheme, weight = 0.65): string {
  const parse = (hex: string) => {
    const v = hex.replace("#", "");
    const full =
      v.length === 3
        ? v
            .split("")
            .map((c) => c + c)
            .join("")
        : v;
    const n = parseInt(full, 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  };
  const [tr, tg, tb] = parse(theme.text);
  const [br, bg, bb] = parse(theme.bg);
  const mix = (t: number, b: number) => Math.round(t * weight + b * (1 - weight));
  return `#${[mix(tr, br), mix(tg, bg), mix(tb, bb)]
    .map((c) => c.toString(16).padStart(2, "0"))
    .join("")}`;
}
