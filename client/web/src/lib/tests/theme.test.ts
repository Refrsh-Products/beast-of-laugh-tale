import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  THEME_STORAGE_KEY,
  applyTheme,
  getThemePreference,
  initTheme,
  resolveTheme,
  setThemePreference,
  subscribeToTheme,
} from "../theme";

/** Swaps in a controllable matchMedia so "system" can be driven from a test. */
function mockSystemDark(isDark: boolean) {
  const listeners: Array<(e: MediaQueryListEvent) => void> = [];
  vi.stubGlobal(
    "matchMedia",
    vi.fn(() => ({
      matches: isDark,
      addEventListener: (_: string, cb: (e: MediaQueryListEvent) => void) =>
        listeners.push(cb),
      removeEventListener: vi.fn(),
    })),
  );
  return { fire: () => listeners.forEach((cb) => cb({} as MediaQueryListEvent)) };
}

beforeEach(() => {
  localStorage.clear();
  document.documentElement.classList.remove("dark");
  mockSystemDark(false);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("theme preference", () => {
  it("defaults to system when nothing is stored", () => {
    expect(getThemePreference()).toBe("system");
  });

  it("ignores a corrupt stored value rather than throwing", () => {
    localStorage.setItem(THEME_STORAGE_KEY, "chartreuse");
    expect(getThemePreference()).toBe("system");
  });

  it("persists an explicit choice", () => {
    setThemePreference("dark");
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe("dark");
    expect(getThemePreference()).toBe("dark");
  });
});

describe("theme resolution", () => {
  it("follows the OS when set to system", () => {
    mockSystemDark(true);
    expect(resolveTheme("system")).toBe("dark");
    mockSystemDark(false);
    expect(resolveTheme("system")).toBe("light");
  });

  it("overrides the OS when set explicitly", () => {
    mockSystemDark(true);
    expect(resolveTheme("light")).toBe("light");
    mockSystemDark(false);
    expect(resolveTheme("dark")).toBe("dark");
  });
});

describe("applying the theme", () => {
  it("toggles the dark class that the CSS keys off", () => {
    applyTheme("dark");
    expect(document.documentElement.classList.contains("dark")).toBe(true);
    applyTheme("light");
    expect(document.documentElement.classList.contains("dark")).toBe(false);
  });

  it("notifies subscribers so every mounted toggle stays in step", () => {
    const listener = vi.fn();
    const unsubscribe = subscribeToTheme(listener);

    setThemePreference("dark");
    expect(listener).toHaveBeenCalledTimes(1);

    unsubscribe();
    setThemePreference("light");
    expect(listener).toHaveBeenCalledTimes(1);
  });
});

describe("system preference changes", () => {
  it("reacts to the OS flipping while set to system", () => {
    const media = mockSystemDark(false);
    initTheme();
    expect(document.documentElement.classList.contains("dark")).toBe(false);

    // The OS switches to dark with the tab already open.
    mockSystemDark(true);
    media.fire();
    expect(document.documentElement.classList.contains("dark")).toBe(true);
  });

  it("ignores the OS once the user has chosen explicitly", () => {
    const media = mockSystemDark(false);
    initTheme();
    setThemePreference("light");

    mockSystemDark(true);
    media.fire();
    expect(document.documentElement.classList.contains("dark")).toBe(false);
  });
});
