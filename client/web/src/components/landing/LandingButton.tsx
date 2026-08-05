import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * A call to action on the landing page.
 *
 * Wraps the app's Button so the geometry, sizing and focus ring stay identical
 * to every other button in the product — someone who clicks "Start free" lands
 * on a signup form whose button looks the same.
 *
 * What it overrides is colour. The stock variants resolve from the semantic
 * tokens (`bg-primary`, `text-primary-foreground`), which invert in dark mode;
 * the landing page is a fixed marketing surface and must look the same
 * whatever theme the visitor's app is set to, so the two tones below name
 * brand-ramp steps directly.
 *
 * `to` renders a router Link for real routes; `href` renders a plain anchor,
 * which is what the in-page "#how" style jumps need.
 */
export default function LandingButton({
  id,
  to,
  href,
  tone = "sulu",
  size = "lg",
  className,
  children,
}: {
  /** Kept forwardable because the old landing page's ids are used as
      analytics and test selectors, and those should survive the rebuild. */
  id?: string;
  to?: string;
  href?: string;
  tone?: "sulu" | "ghost";
  size?: "default" | "lg";
  className?: string;
  children: ReactNode;
}) {
  const tones = {
    // Sulu on Timber Green: the brandbook's primary call to action.
    sulu: "bg-brand-secondary-300 text-brand-primary-900 hover:bg-brand-secondary-200 focus-visible:ring-brand-secondary-300/50",
    // Outlined, for the secondary action sitting on the dark hero.
    ghost:
      "border-brand-paper/30 text-brand-tertiary-100 hover:border-brand-secondary-300 hover:text-brand-secondary-300 bg-transparent focus-visible:ring-brand-secondary-300/50",
  } as const;

  const classes = cn(tones[tone], className);

  return (
    <Button
      asChild
      size={size}
      variant={tone === "ghost" ? "outline" : "default"}
      className={classes}
    >
      {to ? (
        <Link id={id} to={to}>
          {children}
        </Link>
      ) : (
        <a id={id} href={href}>
          {children}
        </a>
      )}
    </Button>
  );
}
