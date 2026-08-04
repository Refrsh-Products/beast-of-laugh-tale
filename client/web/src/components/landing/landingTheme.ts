/**
 * The pre-redesign palette, now used only by the landing page.
 *
 * Every migrated screen resolves colour from the design tokens in index.css.
 * The landing page is a bespoke marketing surface that is deliberately out of
 * that system (see the EXEMPT list in src/tests/colorLiterals.ts), so these
 * three constants moved here to live with their only remaining consumers
 * rather than sitting in src/constants as if they were app-wide.
 *
 * Do not import this from application code.
 */
export const GREEN = "#84e487";
export const BLACK = "#000000";
export const WHITE = "#FFFFFF";
