import { RiStarFill, RiStarLine } from "@remixicon/react";
import {
  TESTIMONIALS,
  TESTIMONIALS_INTRO,
} from "../../page/dto/LandingPage.dto";

/**
 * What students actually said.
 *
 * This section replaces the inspiration's "73% of students (n=412)" figure.
 * Freshr has run no such survey, and inventing one on a marketing page is the
 * kind of claim that is both untrue and, for a paid product, a real liability.
 * Five named students from IUB saying specific things is weaker on paper and
 * considerably stronger in practice.
 *
 * Sits on the Ecru band so it reads as a pause between the dark deck section
 * and the dark pricing section, which is the rhythm the stat block had.
 */
function Stars({ count }: { count: number }) {
  return (
    <div
      className="flex gap-0.5"
      role="img"
      aria-label={`${count} out of 5 stars`}
    >
      {Array.from({ length: 5 }, (_, i) =>
        i < count ? (
          <RiStarFill
            key={i}
            className="text-brand-secondary-600 size-3.5"
            aria-hidden="true"
          />
        ) : (
          <RiStarLine
            key={i}
            className="text-brand-ink/25 size-3.5"
            aria-hidden="true"
          />
        ),
      )}
    </div>
  );
}

export default function TestimonialDeck() {
  return (
    <section
      id="testimonials"
      className="bg-brand-tertiary-100 text-brand-ink px-5 py-16 sm:px-9"
    >
      <div className="mx-auto max-w-320">
        <span className="text-brand-primary-900 text-xs font-semibold tracking-[0.04em] uppercase">
          {TESTIMONIALS_INTRO.eyebrow}
        </span>
        <h2 className="mt-3 mb-9 max-w-2xl text-[clamp(1.6rem,3.4vw,2.75rem)] leading-[1.05] font-bold tracking-[-0.025em]">
          {TESTIMONIALS_INTRO.titleBefore}{" "}
          <span className="pe-[0.12em] font-semibold italic">
            {TESTIMONIALS_INTRO.titleItalic}
          </span>
        </h2>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {TESTIMONIALS.map((t) => (
            <figure
              key={t.name}
              data-reveal
              className="border-brand-ink/12 bg-brand-tertiary-50 flex flex-col gap-3 rounded-2xl border p-5"
            >
              <Stars count={t.stars} />
              <blockquote className="flex-1 text-sm leading-relaxed">
                {t.quote}
              </blockquote>
              <figcaption className="border-brand-ink/10 border-t pt-3">
                <span className="block text-sm font-semibold">{t.name}</span>
                <span className="text-brand-tertiary-950 block text-xs">
                  {t.university}
                </span>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
