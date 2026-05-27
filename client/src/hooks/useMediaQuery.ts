import { useSyncExternalStore } from "react";

function subscribe(query: string, callback: () => void): () => void {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return () => {};
  }
  const mql = window.matchMedia(query);
  mql.addEventListener("change", callback);
  return () => mql.removeEventListener("change", callback);
}

export function useMediaQuery(query: string): boolean {
  const getSnapshot = () =>
    typeof window !== "undefined" && typeof window.matchMedia === "function"
      ? window.matchMedia(query).matches
      : false;

  const getServerSnapshot = () => false;

  return useSyncExternalStore(
    (cb) => subscribe(query, cb),
    getSnapshot,
    getServerSnapshot,
  );
}
