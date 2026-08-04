export type ThemePreference = "light" | "dark" | "system";
export type ResolvedTheme = "light" | "dark";

export const THEME_STORAGE_KEY = "freshr_theme";

/**
 * Theme preference, kept in a tiny module-level store rather than React
 * context.
 *
 * The app has no provider tree (see CLAUDE.md — no Context, no global state
 * library), and the preference has to be readable before React mounts anyway
 * so the inline script in index.html can paint the right colours on first
 * frame. A subscribable module keeps one source of truth for both.
 */

const listeners = new Set<() => void>();

function isPreference(value: unknown): value is ThemePreference {
  return value === "light" || value === "dark" || value === "system";
}

export function getThemePreference(): ThemePreference {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    return isPreference(stored) ? stored : "system";
  } catch {
    // Safari in private mode throws on localStorage access.
    return "system";
  }
}

export function getSystemTheme(): ResolvedTheme {
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

export function resolveTheme(
  preference: ThemePreference = getThemePreference(),
): ResolvedTheme {
  return preference === "system" ? getSystemTheme() : preference;
}

/** Writes the resolved theme onto <html>, which is what the CSS keys off. */
export function applyTheme(preference: ThemePreference = getThemePreference()) {
  const resolved = resolveTheme(preference);
  const root = document.documentElement;
  root.classList.toggle("dark", resolved === "dark");

  // Keeps the mobile browser chrome in step with the page. The value is read
  // back off the --background token rather than hardcoded, so it can never
  // drift from the palette. (index.html's pre-paint script has to inline the
  // colours because it runs before the stylesheet exists.)
  const background = getComputedStyle(root)
    .getPropertyValue("--background")
    .trim();
  if (background) {
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute("content", background);
  }
}

export function setThemePreference(preference: ThemePreference) {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, preference);
  } catch {
    // Preference simply won't persist; the in-memory switch still works.
  }
  applyTheme(preference);
  listeners.forEach((listener) => listener());
}

export function subscribeToTheme(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/**
 * Call once at startup. Applies the stored preference and keeps "system" in
 * step with the OS — without this listener, switching the OS to dark while the
 * tab is open would leave the app light until reload.
 */
export function initTheme() {
  applyTheme();
  const media = window.matchMedia("(prefers-color-scheme: dark)");
  media.addEventListener("change", () => {
    if (getThemePreference() === "system") {
      applyTheme("system");
      listeners.forEach((listener) => listener());
    }
  });
}
