import { useCallback } from "react";

interface UseRevealOnScrollOptions {
  threshold?: number;
}

const DEFAULT_THRESHOLD = 0.12;

export function useRevealOnScroll(
  options: UseRevealOnScrollOptions = {},
): React.RefCallback<Element> {
  const { threshold = DEFAULT_THRESHOLD } = options;

  return useCallback(
    (element: Element | null) => {
      if (!element) return;

      const revealEls = element.querySelectorAll<HTMLElement>(".reveal");
      if (revealEls.length === 0) return;

      const prefersReducedMotion =
        typeof window !== "undefined" &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      if (prefersReducedMotion) {
        revealEls.forEach((el) => el.classList.add("in"));
        return;
      }

      const revealAll = () => revealEls.forEach((el) => el.classList.add("in"));

      // Marker gates the hidden state in CSS — content is never invisible
      // unless this JS successfully arms the observer.
      element.classList.add("reveal-active");

      if (typeof IntersectionObserver === "undefined") {
        revealAll();
        return;
      }

      try {
        const observer = new IntersectionObserver(
          (entries) => {
            entries.forEach((entry) => {
              if (entry.isIntersecting) {
                entry.target.classList.add("in");
                observer.unobserve(entry.target);
              }
            });
          },
          { threshold },
        );

        revealEls.forEach((el) => observer.observe(el));
      } catch {
        revealAll();
      }
    },
    [threshold],
  );
}
