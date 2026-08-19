import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * One numbered section, presented as a card in a deck.
 *
 * This is the landing page's organising idea: instead of sections running
 * edge to edge, each step is a physical card laid on the Timber Green table,
 * with its number set vertically down the left edge like an index tab.
 *
 * Two tones. `ecru` is the default paper card; `ink` inverts to near-black and
 * is used once, on the third card, so the sequence has a beat rather than
 * three identical slabs. Both are brand-ramp steps, not semantic tokens — see
 * LandingButton for why the landing page pins itself to the ramp.
 *
 * The vertical number becomes horizontal below `sm`, where a rotated element
 * in a single-column layout just wastes a row.
 */
export default function DeckCard({
  num,
  variant = "ecru",
  children,
  className,
}: {
  num: string;
  variant?: "ecru" | "ink";
  children: ReactNode;
  className?: string;
}) {
  const isInk = variant === "ink";

  return (
    <article
      data-reveal
      className={cn(
        "landing-lift grid gap-6 rounded-3xl px-6 py-9 sm:grid-cols-[3.5rem_1fr] sm:gap-9 sm:px-12 sm:py-14",
        isInk
          ? "bg-brand-ink text-brand-tertiary-100"
          : "bg-brand-tertiary-100 text-brand-ink",
        className,
      )}
    >
      <div
        className={cn(
          "self-start text-xs font-semibold tracking-widest sm:[writing-mode:vertical-rl] sm:rotate-180",
          isInk ? "text-brand-secondary-300" : "text-brand-primary-900",
        )}
      >
        {num}
      </div>

      <div className="flex min-w-0 flex-col gap-6">{children}</div>
    </article>
  );
}

/** The small uppercase kicker above a deck card's title. */
export function DeckEyebrow({
  children,
  variant = "ecru",
}: {
  children: ReactNode;
  variant?: "ecru" | "ink";
}) {
  return (
    <span
      className={cn(
        "text-xs font-semibold tracking-[0.04em] uppercase",
        variant === "ink"
          ? "text-brand-secondary-300"
          : "text-brand-primary-900",
      )}
    >
      {children}
    </span>
  );
}

/**
 * A deck card's headline. The second clause is set in italic to carry the
 * turn in the sentence — the inspiration's one typographic flourish, and the
 * reason the copy is stored as two halves rather than one string.
 */
export function DeckTitle({
  before,
  italic,
}: {
  before: string;
  italic: string;
}) {
  return (
    <h2 className="max-w-2xl text-[clamp(1.6rem,3.4vw,2.75rem)] leading-[1.05] font-bold tracking-[-0.025em]">
      {before} <span className="font-semibold italic">{italic}</span>
    </h2>
  );
}

export function DeckCopy({
  children,
  variant = "ecru",
}: {
  children: ReactNode;
  variant?: "ecru" | "ink";
}) {
  return (
    <p
      className={cn(
        "max-w-xl text-[1.05rem] leading-relaxed",
        variant === "ink" ? "text-brand-paper" : "text-brand-ink/80",
      )}
    >
      {children}
    </p>
  );
}

/** Hairline between a card's prose and its illustration row. */
export function DeckRule({ variant = "ecru" }: { variant?: "ecru" | "ink" }) {
  return (
    <div
      className={cn(
        "h-px w-full",
        variant === "ink" ? "bg-brand-paper/20" : "bg-brand-ink/12",
      )}
    />
  );
}
