import { useSyncExternalStore } from "react";
import {
  getThemePreference,
  resolveTheme,
  setThemePreference,
  subscribeToTheme,
  type ResolvedTheme,
  type ThemePreference,
} from "../lib/theme";

/**
 * React binding for the theme store. useSyncExternalStore keeps every mounted
 * toggle in step, so switching from the notebook rail also updates the one in
 * the dashboard header.
 */
export default function useTheme(): {
  preference: ThemePreference;
  resolved: ResolvedTheme;
  setTheme: (preference: ThemePreference) => void;
} {
  const preference = useSyncExternalStore(
    subscribeToTheme,
    getThemePreference,
    // Server snapshot: there is no SSR here, but useSyncExternalStore requires
    // it and "system" is the correct pre-hydration assumption.
    () => "system" as ThemePreference,
  );

  return {
    preference,
    resolved: resolveTheme(preference),
    setTheme: setThemePreference,
  };
}
