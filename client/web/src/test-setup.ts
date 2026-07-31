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
if (!globalThis.ResizeObserver) {
  globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
}
