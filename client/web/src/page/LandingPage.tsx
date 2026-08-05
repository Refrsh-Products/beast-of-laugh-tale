import { useEffect } from "react";
import LandingNav from "../components/landing/LandingNav";
import LandingFooter from "../components/landing/LandingFooter";
import DeckCard, {
  DeckCopy,
  DeckEyebrow,
  DeckRule,
  DeckTitle,
} from "../components/landing/DeckCard";
import HeroCardStage from "../components/landing/HeroCardStage";
import LandingButton from "../components/landing/LandingButton";
import SubjectsStrip from "../components/landing/SubjectsStrip";
import DeckChips from "../components/landing/DeckChips";
import MiniCardRow from "../components/landing/MiniCardRow";
import TestimonialDeck from "../components/landing/TestimonialDeck";
import LandingPricing from "../components/landing/LandingPricing";
import { useRevealOnScroll } from "../hooks/useRevealOnScroll";
import { DECK_SECTIONS, HERO, PAGE_META } from "./dto/LandingPage.dto";
import { RiArrowRightLine, RiStackLine } from "@remixicon/react";

/**
 * The marketing page.
 *
 * Deliberately styled from the brand ramp rather than the semantic tokens, so
 * it looks identical whether a returning visitor's app is set to light or dark
 * — a marketing surface has one intended appearance, the way a printed
 * brochure does. See LandingButton for the same reasoning applied to CTAs.
 *
 * All copy lives in ./dto/LandingPage.dto.ts.
 */
export default function LandingPage() {
  const revealRoot = useRevealOnScroll<HTMLDivElement>();

  useEffect(() => {
    document.title = PAGE_META.title;
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute("content", PAGE_META.description);
  }, []);

  return (
    <div
      // #landing is what index.css keys the document scrollbar off, so it
      // stays on the brand ramp instead of following the app's theme.
      id="landing"
      ref={revealRoot}
      // overflow-x-CLIP, not hidden. The hero's rotated backing cards spill
      // sideways and have to be trimmed, but `hidden` turns this element into
      // a scroll container, which silently breaks position:sticky on the nav —
      // it would stick to this box instead of the viewport and scroll away.
      // `clip` trims without establishing a scroll container.
      className="bg-brand-primary-900 text-brand-paper min-h-dvh overflow-x-clip"
    >
      <LandingNav />

      <section
        id="hero"
        className="mx-auto grid max-w-320 items-center gap-14 px-5 pt-14 pb-12 sm:px-9 lg:grid-cols-2 lg:gap-12"
      >
        <div>
          <h1
            id="hero-heading"
            className="text-brand-tertiary-100 text-[clamp(2.5rem,5.6vw,4.9rem)] leading-[0.96] font-bold tracking-[-0.035em]"
          >
            {HERO.headingBefore}
            <br />
            {/* pe-[0.12em] because the italic's slant overhangs its advance
                width — without it the final "d" collides with the next word,
                and a plain space character does not reclaim the room. Set in
                em so it tracks the clamped font size. */}
            <span className="text-brand-secondary-300 pe-[0.12em] font-semibold italic">
              {HERO.headingAccent}
            </span>{" "}
            {HERO.headingAfter}
          </h1>

          <p
            id="hero-text"
            className="text-brand-paper mt-6 mb-8 max-w-lg text-lg leading-relaxed"
          >
            {HERO.body}
          </p>

          <div className="flex flex-wrap items-center gap-3.5">
            <LandingButton id="hero-cta" to={HERO.primaryCta.href}>
              {HERO.primaryCta.label}
              <RiArrowRightLine aria-hidden="true" />
            </LandingButton>
            <LandingButton tone="ghost" href={HERO.secondaryCta.href}>
              {HERO.secondaryCta.label}
              <RiStackLine aria-hidden="true" />
            </LandingButton>
          </div>
        </div>

        <HeroCardStage />
      </section>

      <SubjectsStrip />

      <section id="how" className="mx-auto max-w-320 px-5 py-16 sm:px-9">
        <div className="flex flex-col gap-7">
          {DECK_SECTIONS.map((section) => (
            <DeckCard
              key={section.num}
              num={section.num}
              variant={section.variant}
            >
              <DeckEyebrow variant={section.variant}>
                {section.eyebrow}
              </DeckEyebrow>
              <DeckTitle
                before={section.titleBefore}
                italic={section.titleItalic}
              />
              <DeckCopy variant={section.variant}>{section.body}</DeckCopy>

              {section.showMiniCards && <MiniCardRow />}

              {section.chips && (
                <>
                  <DeckRule variant={section.variant} />
                  <DeckChips chips={section.chips} variant={section.variant} />
                </>
              )}
            </DeckCard>
          ))}
        </div>
      </section>

      <TestimonialDeck />

      <LandingPricing />

      <LandingFooter />
    </div>
  );
}
