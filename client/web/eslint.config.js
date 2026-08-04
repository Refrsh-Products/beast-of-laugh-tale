import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

/**
 * Screens that predate the design-token redesign and still style themselves
 * with inline `style={{ … }}` objects. The no-inline-style rule is switched off
 * for these, and the list may only ever SHRINK — delete a path as its screen is
 * migrated to token utilities, and never add one.
 *
 * A genuinely computed value (a width percentage, a transform) is a legitimate
 * use of `style` even in migrated code; those carry an eslint-disable comment
 * with a reason at the call site instead of being listed here.
 */
/**
 * Files that render *deck content* rather than app chrome, and are exempt
 * permanently rather than pending migration.
 *
 * A generated slide is styled from the deck's own theme (see
 * presentationThemes.ts), which must not follow the app's light/dark mode, and
 * the same trees are mounted detached and rasterised by html2canvas for the
 * PDF export — where Tailwind's stylesheet and CSS custom properties are out
 * of scope and only concrete values survive. Their colours still come from a
 * single module; they just cannot be expressed as utility classes.
 */
const SLIDE_RENDERING_FILES = [
  'src/components/presentation/PresentationViewer.tsx',
  'src/components/presentation/SlideEditor.tsx',
  'src/components/presentation/SlideLayouts.tsx',
  'src/components/presentation/exportPresentation.tsx',
]

const LEGACY_INLINE_STYLE_FILES = [
  'src/components/landing/FeatureCard.tsx',
  'src/components/landing/PricingSection.tsx',
  'src/components/landing/RotatingText.tsx',
  'src/components/landing/TestimonialSection.tsx',
  'src/page/LandingPage.tsx',
]

const NO_INLINE_STYLE_MESSAGE =
  'Inline style={{…}} bypasses the design tokens in src/index.css. Use Tailwind token utilities (bg-card, text-muted-foreground, p-4) instead. If the value is genuinely computed at runtime, add an eslint-disable-next-line comment explaining why.'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector: "JSXAttribute[name.name='style']",
          message: NO_INLINE_STYLE_MESSAGE,
        },
      ],
    },
  },
  {
    // The shrinking legacy list — see the comment above it.
    files: [...LEGACY_INLINE_STYLE_FILES, ...SLIDE_RENDERING_FILES],
    rules: {
      'no-restricted-syntax': 'off',
    },
  },
])
