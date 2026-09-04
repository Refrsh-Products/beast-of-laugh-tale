# Design System

## Single source of truth

`lib/design/tokens.ts` is the one place every colour in the app is defined — a `light` and
a `dark` `TokenMap` built from the FRESHR Brandbook ramps (`lib/design/brand.ts`: Timber
Green / Sulu / Ecru, as HSL triplets) plus a `radius` scale. It's kept in step with
`client/web/src/index.css`, role for role, minus the sidebar group web has no use for on
mobile.

Three files are **generated** from `tokens.ts` by `npm run tokens` and must never be
hand-edited:

- `global.css` — the NativeWind CSS variables consumed via Tailwind utilities
- `lib/theme.ts` — `THEME` / `NAV_THEME`, for the JS APIs that can't take a `className`
- `lib/design/tailwind-tokens.generated.js` — consumed by `tailwind.config.js`

`npm run tokens:check` fails CI if any of the three have drifted from `tokens.ts`. (They
used to be maintained by hand and had already silently diverged — that's why the
generator exists at all.)

The generator loads `lib/design/*` through Node's type-stripping (`--experimental-strip-types`),
not a bundler, which is why that whole directory has to stay free of React Native imports
and non-erasable TypeScript syntax, and why `tokens.ts` imports `brand.ts` **with** the
`.ts` extension — Node's plain ESM resolver has no extension inference, while Metro and
TypeScript's `bundler` resolution both handle the explicit extension fine.

## How components consume it

Colour reaches components through Tailwind utilities — `bg-card`, `text-muted-foreground`,
`text-destructive` — never a hardcoded hex. Where a prop demands a literal value instead
of a className (`ActivityIndicator`'s `color`, `placeholderTextColor`, `RefreshControl`'s
`tintColor`, react-native-svg), components call `useThemeColors()`. Lucide icons take a
className via `components/ui/icon.tsx`'s `cssInterop`.

`npm run check:tokens` fails on any hex literal outside a documented allowlist (the brand
ramps themselves, the generated theme files, the fixed-design slide renderer/exporter, and
Google's own brand mark in `GoogleSignInButton`).

## The font-weight gotcha

RN can't pick the right font **file** from a `fontWeight` alone — it needs the specific
Instrument Sans face. A Tailwind plugin redefines `font-medium` / `font-semibold` /
`font-bold` to set family *and* weight together, which is what makes those weight
classNames actually render the right face. Instrument Sans ships no 800/900 weight, so
`font-extrabold` maps to Bold.

A plain `fontWeight` in a style object (not a className) gets no family resolution at all.
The few places that need one — chat markdown styles, a couple of slide-chrome labels — name
`fontWeights.<name>.family` from `lib/design/typography.ts` explicitly, alongside the
weight.

## What's deliberately outside the token system

Two kinds of surface stay theme-invariant on purpose, and should stay that way:

- **`components/presentation/slidePalette.ts`** — a slide is a fixed-design document that
  has to match web, the thumbnail grid, and the PDF export exactly. `SlideRenderer`,
  `SlideThumbnail`, and `exportPresentation` all read from this palette, not the theme.
- **The camera scan overlay** (`bg-black` / `text-white`, which has to read against the
  live viewfinder regardless of theme), **presenter mode**, and **the upgrade sheet** (a
  fixed dark Timber Green panel, matching web's landing page) are pinned to the brand ramp
  directly rather than the semantic tokens.

Slide *typography* is a separate, pre-existing mismatch, not part of this system: web
drives slide text from a per-deck presentation theme, while mobile's `SlideRenderer` uses
the system font and `exportPresentation` pins the PDF to Courier New.
