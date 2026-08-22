/**
 * The colours a generated slide is drawn in.
 *
 * These are deliberately NOT design tokens and deliberately do NOT follow the
 * app theme. A slide is a fixed-design document, not app chrome:
 *
 *   - it has to render identically to the same deck on web, and
 *   - it has to look the same in the on-screen viewer, in the thumbnail grid,
 *     and in the exported PDF — a deck that inverted to dark because the reader
 *     happened to have dark mode on would export wrong and present wrong.
 *
 * So this file is the one place in `client/mobile` outside `lib/design/` that
 * is allowed to hold literal colours, and `scripts/check-tokens.mjs` allowlists
 * it by name. Everything *around* a slide — the sheet it sits in, the selected
 * border on a thumbnail, the slide number beneath it — is app chrome and uses
 * tokens like the rest of the app.
 *
 * Consumed by SlideRenderer (on-screen), SlideThumbnail (grid) and
 * exportPresentation (the print/PDF stylesheet).
 */
export const SLIDE_PALETTE = {
  /** The accent strip and bullet marks. */
  green: '#84e487',
  /** Headings and rules. */
  ink: '#000000',
  /** The page itself. */
  paper: '#FFFFFF',

  /** Body copy, a step off the heading ink. */
  body: '#333333',
  /** Captions and quote attributions. */
  caption: '#555555',
  /** Quote sources and other tertiary copy. */
  source: '#666666',
  /** Footer text and the bullet preview in thumbnails. */
  footer: '#888888',
  /** Slide numbers in the thumbnail grid. */
  muted: '#aaaaaa',

  /** Rules and dividers, lightest to darkest. */
  ruleLight: '#eeeeee',
  rule: '#dddddd',
} as const;
