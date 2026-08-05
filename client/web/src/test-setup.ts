import "@testing-library/jest-dom";
import { vi } from "vitest";

/**
 * jsdom implements neither the Pointer Capture API nor scrollIntoView, both of
 * which Radix primitives (Select, DropdownMenu, Dialog…) call during normal
 * pointer interaction. Without these stubs those components throw
 * "target.hasPointerCapture is not a function" as soon as a test opens them.
 *
 * These fill environment gaps, not behaviour under test — the assertions still
 * exercise the real components.
 */
if (!Element.prototype.hasPointerCapture) {
  Element.prototype.hasPointerCapture = vi.fn(() => false);
  Element.prototype.setPointerCapture = vi.fn();
  Element.prototype.releasePointerCapture = vi.fn();
}
if (!Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = vi.fn();
}
/**
 * jsdom has no matchMedia. The theme store reads it to resolve "system", so
 * without this every screen rendering a ThemeToggle throws. Defaults to light;
 * theme.test.ts stubs its own controllable version where it matters.
 */
if (!window.matchMedia) {
  window.matchMedia = ((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  })) as typeof window.matchMedia;
}

if (!globalThis.ResizeObserver) {
  globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
}
