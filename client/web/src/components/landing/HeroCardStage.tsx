import { HERO_CARD } from "../../page/dto/LandingPage.dto";
import { cn } from "@/lib/utils";

/**
 * The hero illustration: a small stack of cards with a quiz card on top.
 *
 * The face deliberately mirrors the real quiz-taking screen — same header
 * layout, same lettered options, same progress rail — rather than inventing a
 * flashcard UI the product doesn't have. The first thing a visitor sees should
 * be a surface they will actually meet after signing up.
 *
 * The whole stage is aria-hidden. It is a static mock, not live data: a screen
 * reader announcing "A Cytoplasm, B Mitochondrial matrix" would imply an
 * answerable question that isn't there, and the hero copy beside it already
 * carries the message.
 */
export default function HeroCardStage() {
  return (
    <div
      className="relative flex h-95 items-center justify-center [perspective:1600px] sm:h-115"
      aria-hidden="true"
    >
      {/* Two cards peeking out behind, to imply a deck rather than a page. */}
      <div className="bg-brand-tertiary-300 absolute inset-0 rotate-3 rounded-2xl opacity-40" />
      <div className="bg-brand-tertiary-200 absolute inset-0 -rotate-4 rounded-2xl opacity-55" />

      <div className="landing-lift landing-tilt bg-brand-tertiary-50 text-brand-ink absolute inset-0 z-2 flex flex-col rounded-2xl p-5 sm:p-6">
        {/* Header — deck name left, tool tag right, mirroring the quiz screen */}
        <div className="flex items-center justify-between gap-3">
          <span className="text-brand-tertiary-950 truncate text-[0.7rem] font-semibold tracking-[0.04em] uppercase">
            {HERO_CARD.deckLabel}
          </span>
          <span className="bg-brand-ink text-brand-secondary-300 shrink-0 rounded-md px-2 py-1 text-[0.65rem] font-bold tracking-[0.08em]">
            {HERO_CARD.tag}
          </span>
        </div>

        {/* Progress rail, folded under the header exactly as the quiz screen
            does it. */}
        <div className="bg-brand-tertiary-300 mt-3 h-1 w-full overflow-hidden rounded-full">
          <div
            className="bg-brand-secondary-400 h-full rounded-full"
            // eslint-disable-next-line no-restricted-syntax -- width is derived from content data, not a style choice
            style={{ width: `${HERO_CARD.progressPercent}%` }}
          />
        </div>

        <div className="flex flex-1 flex-col justify-center gap-4 py-5">
          <p className="text-center text-[clamp(1.05rem,2.2vw,1.4rem)] leading-snug font-semibold tracking-[-0.01em]">
            {HERO_CARD.question}
          </p>

          <ul className="flex flex-col gap-2">
            {HERO_CARD.options.map((opt) => (
              <li
                key={opt.letter}
                className={cn(
                  "flex items-center gap-3 rounded-xl border-2 px-3 py-2 text-sm",
                  opt.correct
                    ? "border-brand-primary-900 bg-brand-secondary-300/35 font-medium"
                    : "border-brand-tertiary-300 text-brand-tertiary-950",
                )}
              >
                <span className="w-3 shrink-0 text-xs font-bold">
                  {opt.letter}
                </span>
                <span className="truncate">{opt.text}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Footer — the citation is the point of the whole product, so it is
            what the card leaves you looking at. */}
        <div className="text-brand-tertiary-950 flex items-center justify-between gap-3 text-xs">
          <span className="truncate">{HERO_CARD.footerHint}</span>
          <span className="shrink-0 tabular-nums">
            {HERO_CARD.progressLabel}
          </span>
        </div>
      </div>

      <div className="landing-peek-shadow absolute -bottom-5 left-0 h-8 w-full" />
    </div>
  );
}
