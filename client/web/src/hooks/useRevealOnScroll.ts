import { useEffect, useRef } from "react";

/**
 * Fades sections in as they scroll into view.
 *
 * Returns a ref for a container; every descendant carrying `data-reveal` gets
 * `data-revealed="true"` the first time it enters the viewport, which the CSS
 * transitions off. One observer for the whole page rather than one per
 * section, and each element is unobserved once shown — the animation is a
 * one-way door, so there is nothing to keep watching.
 *
 * Two ways this stays out of the user's way:
 *
 *  - `prefers-reduced-motion` short-circuits the whole thing: everything is
 *    marked revealed on mount and no observer is created.
 *  - If IntersectionObserver is missing (old browser, jsdom in tests), the
 *    same fallback runs. Content is never left invisible because an
 *    enhancement failed to load.
 */
export function useRevealOnScroll<T extends HTMLElement = HTMLDivElement>() {
  const containerRef = useRef<T>(null);

  useEffect(() => {
    const root = containerRef.current;
    if (!root) return;

    const targets = Array.from(
      root.querySelectorAll<HTMLElement>("[data-reveal]"),
    );

    const revealAll = () =>
      targets.forEach((el) => el.setAttribute("data-revealed", "true"));

    const prefersReducedMotion = window.matchMedia?.(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    if (prefersReducedMotion || typeof IntersectionObserver === "undefined") {
      revealAll();
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          entry.target.setAttribute("data-revealed", "true");
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.12 },
    );

    targets.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return containerRef;
}
