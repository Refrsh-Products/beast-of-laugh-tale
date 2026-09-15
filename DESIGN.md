---
name: FRESHR
description: The AI study platform for university students
colors:
  timber-green: "#19392e"
  timber-green-deep: "#0d211b"
  timber-green-mid: "#2c6f55"
  timber-green-light: "#dcefe4"
  sulu-neon: "#b4ff6e"
  sulu-vivid: "#67dd05"
  sulu-dark: "#32690b"
  ecru-paper: "#f1f1e7"
  ecru-warm: "#f8f8f3"
  ecru-tan: "#d3d3b4"
  ecru-deep: "#8b7c54"
  ink: "#0e0f0c"
  paper: "#e0e4de"
  muted-olive: "#4a5a50"
  error-red: "#b3261e"
  error-light: "#ff8a7a"
typography:
  display:
    fontFamily: "Instrument Sans Variable, ui-sans-serif, system-ui, sans-serif"
    fontSize: "2.25rem"
    fontWeight: 700
    lineHeight: 1.1
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "Instrument Sans Variable, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "-0.02em"
  title:
    fontFamily: "Instrument Sans Variable, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: "normal"
  body:
    fontFamily: "Instrument Sans Variable, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.625
    letterSpacing: "normal"
  label:
    fontFamily: "Instrument Sans Variable, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 500
    lineHeight: 1.25
    letterSpacing: "normal"
rounded:
  sm: "7px"
  md: "10px"
  lg: "12px"
  xl: "17px"
  2xl: "22px"
  3xl: "26px"
  4xl: "31px"
  full: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
  2xl: "48px"
components:
  button-primary:
    backgroundColor: "{colors.timber-green}"
    textColor: "{colors.paper}"
    rounded: "{rounded.4xl}"
    padding: "8px 16px"
    height: "36px"
  button-primary-hover:
    backgroundColor: "{colors.timber-green}/80"
  button-secondary:
    backgroundColor: "{colors.sulu-neon}"
    textColor: "{colors.timber-green}"
    rounded: "{rounded.4xl}"
    padding: "8px 16px"
  button-outline:
    backgroundColor: "{colors.ecru-paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.4xl}"
    padding: "8px 16px"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    rounded: "{rounded.4xl}"
    padding: "8px 16px"
  button-ghost-hover:
    backgroundColor: "{colors.ecru-tan}/40"
  card:
    backgroundColor: "{colors.ecru-warm}"
    textColor: "{colors.ink}"
    rounded: "{rounded.2xl}"
    padding: "24px"
  input:
    backgroundColor: "{colors.ecru-paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.4xl}"
    padding: "8px 16px"
    height: "36px"
  chip:
    backgroundColor: "{colors.ecru-tan}/30"
    textColor: "{colors.ink}"
    rounded: "{rounded.full}"
    padding: "4px 12px"
  nav-pill:
    backgroundColor: "{colors.ecru-tan}/40"
    textColor: "{colors.muted-olive}"
    rounded: "{rounded.full}"
    padding: "6px 20px"
  nav-pill-active:
    backgroundColor: "{colors.timber-green-light}"
    textColor: "{colors.timber-green}"
---

# Design System: FRESHR

## Overview

**Creative North Star: "The Study Greenhouse"**

FRESHR's visual system is a warm, living space where knowledge grows. Timber Green forms the sheltering canopy — deep, institutional, serious about learning. Ecru provides the natural paper surface — warm, approachable, never clinical. Sulu is new growth — the electric neon highlighter that marks what matters, the accent that says "this is alive and responsive."

The system is clean and precise without being cold. Components have defined edges and clear hierarchy, but sit on warm surfaces that feel like quality paper rather than sterile screens. Density is moderate: enough breathing room for a student scanning between study tools, tight enough to feel purposeful. Dark mode inverts the greenhouse into a night study — deep Timber Green canopy becomes the surface, Sulu neon becomes the primary action colour, and the warm Ecru text ensures readability without the harshness of pure white on black.

This is not Silicon Valley EdTech. It is not a generic SaaS dashboard. It is a study tool built on a campus in Dhaka, and its visual identity carries that origin: warm local materials, academic green, student energy.

**Key Characteristics:**
- Warm paper surfaces (Ecru), not cool greys
- Deep institutional green (Timber Green) as the primary brand and action colour
- Electric neon highlighter (Sulu) as the secondary accent — used sparingly for maximum impact
- Instrument Sans throughout — clean, modern, legible at all sizes
- Pill-shaped interactive controls (web), gently rounded cards and containers
- Flat by default; shadows are functional signals, not decoration
- Both themes feel intentional — light is warm paper, dark is deep forest

## Colors

The palette is a three-ramp system derived from the FRESHR Brandbook. Each ramp has 11 steps (50–950). Semantic tokens map to specific ramp steps and swap between light and dark mode.

### Primary

- **Timber Green** (#19392e, step 900): The brand anchor. Primary action fills in light mode, card surfaces in dark mode. Deep, serious, institutional — the canopy of the greenhouse.
- **Timber Green Deep** (#0d211b, step 950): Dark mode background. The deepest green, nearly black but unmistakably green.
- **Timber Green Mid** (#2c6f55, step 600): Focus rings in light mode, accent surfaces in dark mode. The workhorse mid-tone.
- **Timber Green Light** (#dcefe4, step 100): Accent/hover surfaces in light mode. A pale wash of green — present but not demanding.

### Secondary

- **Sulu Neon** (#b4ff6e, step 300): The highlighter. Secondary action fills in light mode, primary action fills in dark mode. Electric, alive, unmistakable. Used sparingly — its rarity is the point.
- **Sulu Vivid** (#67dd05, step 500): Chart series, success states in dark mode. A deeper, more grounded green-yellow.
- **Sulu Dark** (#32690b, step 800): Success states in light mode. Sulu's serious register.

### Neutral

- **Ecru Paper** (#f1f1e7, tertiary 100): The main background in light mode. Warm off-white with a yellow undertone — paper, not screen.
- **Ecru Warm** (#f8f8f3, tertiary 50): Card and popover surfaces in light mode. The lightest warm tone, just above paper.
- **Ecru Tan** (#d3d3b4, tertiary 300): Borders and decorative dividers in light mode. Visible but quiet.
- **Ecru Deep** (#8b7c54, tertiary 700): Input outlines in light mode. Must clear 3:1 WCAG against Ecru Paper.
- **Ink** (#0e0f0c): Near-black foreground. Not pure black — carries a faint warm cast.
- **Paper** (#e0e4de): Light warm grey. Foreground text in dark mode, text on primary fills in light mode.
- **Muted Olive** (#4a5a50): Subdued text, placeholders, descriptions. A desaturated green-grey that reads as quiet without feeling dead.

### Named Rules

**The Highlighter Rule.** Sulu Neon appears on interactive elements and success signals. It never fills a large surface, never carries body text, and never appears as a background on cards or containers. Its rarity makes it visible.

**The Warm Surface Rule.** No cool greys anywhere in the palette. Every neutral — background, card, border, muted text — carries warmth from the Ecru or Timber Green ramps. The closest thing to grey is Muted Olive, which leans green.

## Typography

**Display Font:** Instrument Sans (with ui-sans-serif, system-ui fallback)
**Body Font:** Instrument Sans (same family throughout)
**Mono Font:** ui-monospace, SF Mono, Menlo (code blocks and transcripts only)

**Character:** One typeface, full range. Instrument Sans is clean and modern with just enough personality to avoid feeling generic. The single-family approach keeps the student-tool feel unified — no decorative display faces, no typographic drama. Weight and size do all the hierarchy work.

### Hierarchy

- **Display** (Bold 700, 2.25rem/36px, line-height 1.1, tracking -0.02em): Hero headings, landing page headlines. Tight tracking at large sizes gives them weight without shouting.
- **Headline** (SemiBold 600, 1.5rem/24px, line-height 1.2, tracking -0.02em): Section headings within the app — notebook titles, page headers.
- **Title** (SemiBold 600, 1.125rem/18px, line-height 1.3): Card titles, dialog headers, feature labels.
- **Body** (Regular 400, 1rem/16px, line-height 1.625): Running text, descriptions, chat messages. Generous line-height for readability during study sessions.
- **Label** (Medium 500, 0.875rem/14px, line-height 1.25): Form labels, metadata, secondary information, button text.

### Named Rules

**The One Family Rule.** Instrument Sans carries everything from display headings to button labels. No secondary typeface. Brand personality comes from the palette and spatial system, not typographic variety.

**The Weight Ladder Rule.** On mobile (React Native), each Tailwind weight class (`font-medium`, `font-semibold`, `font-bold`) sets both `fontFamily` AND `fontWeight` together because RN requires static font file references. A bare `fontWeight` in a style object gets no family — use the named exports from `typography.ts` when outside Tailwind classes.

## Layout

The system uses a moderate-density layout that prioritises scanability during study sessions.

**Web:** No fixed grid system. Container widths are page-specific — the landing page uses `max-w-7xl` centered content blocks, the dashboard uses a fluid card grid, and the notebook workspace is a single-column tool view that fills available width. Spacing follows Tailwind's default scale (`gap-4`, `gap-6`, `p-6`), with `--card-spacing` (1.5rem default, 1rem for compact cards) as the only custom spacing token on cards.

**Mobile:** Full-width layouts within safe-area insets. The notebook workspace is a stack navigator (not tabs) — each tool (Chat, Quiz, Presentations, Audio, Files) is a separate screen navigated via the floating bottom nav pill. No side-by-side panels on phone.

**Responsive breakpoints:** Tailwind v4 defaults on web (`sm: 640px`, `md: 768px`, `lg: 1024px`, `xl: 1280px`). Mobile components use `sm:` breakpoint internally for NativeWind's responsive utilities (tablet-like adjustments), but the primary target is a phone-width viewport.

**Spacing rhythm:** 4px base increment. Common gaps: 8px (tight), 16px (standard), 24px (section), 32px (major section), 48px (page-level). Card internal padding is 24px (default) or 16px (compact).

## Elevation & Depth

The system is flat by default. Shadows are functional signals — elevation communicates interactivity or layering, not decoration.

**Light mode:** Surfaces differentiate through the Ecru tonal ramp (paper → warm → tan). Cards sit on `ecru-warm` (#f8f8f3) against an `ecru-paper` (#f1f1e7) background — a 1-step tonal lift, no shadow required at rest.

**Dark mode:** Surfaces differentiate through the Timber Green tonal ramp (deep → 900 → 800). Cards sit on `timber-green` (#19392e) against `timber-green-deep` (#0d211b).

### Shadow Vocabulary

- **Ambient micro** (`shadow-sm shadow-black/5`): Buttons, inputs, cards on mobile. A nearly invisible lift — just enough to register as interactive on warm surfaces.
- **Elevated surface** (`shadow-lg`): Auth card wrappers, centered modal cards. The "this floats above the page" signal.
- **Overlay** (`shadow-2xl`): Dropdowns, selects, sheets, dialogs. Highest elevation — these sit above everything.
- **Landing lift** (custom multi-layer): `0 30px 60px -30px` in Timber Green at 45% + `0 8px 24px -12px` in Ink at 18%. Used only on the landing page's hero cards for dramatic depth against the dark brand background.

### Named Rules

**The Flat-By-Default Rule.** Cards, containers, and surfaces are flat at rest. Tonal layering (Ecru steps in light, Timber Green steps in dark) conveys depth. Shadows appear only for interactive controls (buttons, inputs), overlays (dropdowns, dialogs), and the landing page's hero moment.

## Shapes

The form language is rounded and approachable but not bubbly. Radii follow a 6-step scale derived from a 12px base.

**Radius scale:** 7px (sm) → 10px (md) → 12px (lg) → 17px (xl) → 22px (2xl) → 26px (3xl) → 31px (4xl) → full (pill).

**Web interactive controls** are pill-shaped (`rounded-4xl` = 31px on buttons, `rounded-4xl` on inputs). This is the most distinctive shape decision — pills feel friendly and tappable, distinct from the squared-off SaaS default.

**Mobile interactive controls** use `rounded-md` (10px) on buttons and inputs — following native platform conventions where full pills are less common.

**Cards and containers** use `rounded-xl` (17px) on mobile, `rounded-2xl` (22px) on web. Large enough to feel soft, small enough to not waste space.

**Overlays** (dropdowns, dialogs) use `rounded-4xl` (31px) on web with `backdrop-blur-xs` behind a `bg-black/80` overlay. On mobile, bottom sheets follow native conventions.

### Named Rules

**The Pill Button Rule (web).** All interactive controls on web — buttons, inputs, selects — are pill-shaped (`rounded-4xl`). This is the most visible brand shape and must not regress to squared or lightly-rounded alternatives.

**The Platform Shape Rule.** Mobile follows its own radius conventions (`rounded-md` for controls, `rounded-xl` for cards) rather than copying web's pills. Each platform should feel native; the brand lives in colour and typography, not in forcing web shapes onto native.

## Components

### Buttons

Clean, precise, no unnecessary weight. The pill shape (web) or rounded rectangle (mobile) is the primary recognition signal.

- **Shape:** Pill (`rounded-4xl`, 31px) on web; rounded rectangle (`rounded-md`, 10px) on mobile
- **Primary:** Timber Green fill (#19392e), Paper text (#e0e4de), Medium 500 weight, `h-9` (36px). Hover: 80% opacity. In dark mode: Sulu Neon fill (#b4ff6e), Timber Green text.
- **Secondary:** Sulu Neon fill, Timber Green text. Same in both themes on web; Timber Green 700 fill with Paper text in dark mode on mobile.
- **Outline:** Ecru Paper fill, Ecru Deep border (#8b7c54), Ink text. Hover: Accent fill (Timber Green Light).
- **Ghost:** Transparent, Ink text. Hover: Muted fill (Ecru 200 light, Timber Green 800 dark).
- **Destructive (web):** Transparent with 10% error-red fill, error-red text. Not a solid red button — the destructive action is signaled by colour, not by visual weight.
- **Focus:** 3px ring in `--ring` colour (Timber Green Mid light, Sulu Neon dark) at 50% opacity, with a border shift to `--ring`.

### Cards

- **Corner Style:** Gently rounded (22px on web, 17px on mobile)
- **Background:** Ecru Warm (#f8f8f3) in light, Timber Green (#19392e) in dark
- **Shadow:** `ring-1 ring-foreground/10` on web (a faint border-like ring, not a shadow); `shadow-sm shadow-black/5` on mobile
- **Internal Padding:** 24px default, 16px compact (`--card-spacing` on web)

### Inputs / Fields

- **Style:** Pill shape (web) / rounded rectangle (mobile), Ecru Paper fill (`--field`), Ecru Deep border (`--input`)
- **Focus:** 3px ring in `--ring` at 50% opacity, border shifts to `--ring` colour
- **Error:** Border shifts to `--destructive`, 3px ring in destructive at 20% opacity
- **Placeholder:** Muted Olive at 50% opacity on mobile, full Muted Olive on web

### Navigation

**Web:** No persistent nav bar in the app. The dashboard has a minimal top bar with the logo, user avatar, and a few action buttons. The notebook workspace has a horizontal tool switcher (tabs). The landing page has a fixed top nav with logo + CTA.

**Mobile:** A floating bottom nav pill (`bg-muted`, `rounded-full`) with fixed icon slots for Files and Chat, plus a dynamic third slot that opens a dropdown listing all sections. Active state: `bg-accent` fill with `text-accent-foreground`. Shadow cast in Ink regardless of theme (opacity 0.12 light, 0.4 dark). This is FRESHR's most distinctive native component — a Linear-style pill, not a standard tab bar.

### Scrollbar (web)

Custom thin scrollbar: 6px width, Timber Green thumb on Muted track, `rounded-sm` thumb corners. Landing page overrides: Timber Green 700 thumb on Timber Green 900 track (dark-on-dark, subtle).

## Do's and Don'ts

### Do:

- **Do** use Ecru ramp neutrals for all backgrounds and surfaces. The warm undertone is the greenhouse floor — every screen should feel like quality paper.
- **Do** swap the primary/secondary role between themes: Timber Green is primary action in light; Sulu Neon is primary action in dark. This inversion keeps both themes vibrant rather than just dimming the light theme.
- **Do** use the semantic token names (`bg-primary`, `text-muted-foreground`, `border-border`) rather than reaching for brand ramp steps directly. The ramps are for charts, the landing page, and the slide palette only.
- **Do** keep Sulu Neon to interactive elements and success states. Its electric character depends on scarcity.
- **Do** test both light and dark themes for every new surface. The token system handles most swaps automatically, but custom colours and opacity treatments need manual verification.

### Don't:

- **Don't** use cool greys, blue-greys, or pure white backgrounds anywhere in the app. The Ecru warmth is a brand invariant.
- **Don't** use Sulu Neon as a background fill on cards, containers, or large surfaces. It is an accent, not a surface colour.
- **Don't** mix icon sets. Web uses Lucide React; mobile uses Lucide React Native via the `cssInterop` wrapper in `components/ui/icon.tsx`. No Heroicons, no Material Icons, no SF Symbols.
- **Don't** use `fontWeight` alone in React Native style objects. The RN static font loader requires both `fontFamily` and `fontWeight` set together — use the Tailwind weight classes or the named exports from `typography.ts`.
- **Don't** hardcode hex values in component files. All colour must flow through the token system. The `check:tokens` script enforces an allowlist — only brand ramp definitions, generated theme files, the slide palette, camera overlays, presenter mode, and the upgrade sheet may contain literal hex.
