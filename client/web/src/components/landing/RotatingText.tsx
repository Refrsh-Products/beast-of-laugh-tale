import { useState, useEffect } from "react";

interface RotatingTextProps {
  words: string[];
  interval?: number;
  duration?: number;
}

type Phase = "visible" | "exiting" | "entering";

export function RotatingText({
  words,
  interval = 2200,
  duration = 380,
}: RotatingTextProps) {
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>("visible");

  useEffect(() => {
    const cycle = setInterval(() => {
      setPhase("exiting");

      setTimeout(() => {
        setIndex((i) => (i + 1) % words.length);
        setPhase("entering");

        // Double rAF lets the browser paint the entering position
        // before we kick off the visible transition
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            setPhase("visible");
          });
        });
      }, duration);
    }, interval + duration);

    return () => clearInterval(cycle);
  }, [words, interval, duration]);

  const style = (): React.CSSProperties => {
    if (phase === "visible")
      return {
        opacity: 1,
        transform: "translateY(0)",
        transition: `opacity ${duration}ms ease, transform ${duration}ms ease`,
      };
    if (phase === "exiting")
      return {
        opacity: 0,
        transform: "translateY(-14px)",
        transition: `opacity ${duration}ms ease, transform ${duration}ms ease`,
      };
    // entering: no transition, snaps to below before animating in
    return {
      opacity: 0,
      transform: "translateY(14px)",
      transition: "none",
    };
  };

  const longestWord = words.reduce((a, b) => (a.length >= b.length ? a : b), "");

  return (
    <span style={{ position: "relative", display: "inline-block" }}>
      {/* Ghost of the longest word — always holds the full width */}
      <span style={{ visibility: "hidden" }}>{longestWord}</span>
      {/* Animated word sits on top */}
      <span aria-live="polite" style={{ position: "absolute", left: 0, top: 0, ...style() }}>
        {words[index]}
      </span>
    </span>
  );
}
