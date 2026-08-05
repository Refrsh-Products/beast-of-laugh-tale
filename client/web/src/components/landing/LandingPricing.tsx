import { RiCheckLine } from "@remixicon/react";
import { PLANS, formatPrice } from "../../constants/plans";
import { PRICING } from "../../page/dto/LandingPage.dto";
import LandingButton from "./LandingButton";
import { cn } from "@/lib/utils";

/**
 * Pricing.
 *
 * Reads PLANS from src/constants/plans.ts, the same module the profile page's
 * billing tab uses, so the marketing page cannot quietly disagree with
 * checkout about what a plan costs.
 *
 * This replaces the inspiration's "free while you're a student, just use a
 * .edu address" pledge. Freshr has no .edu programme and does charge, so the
 * honest version of that promise is the one below: Basic really is free
 * forever, and the paid tiers are shown at their real prices.
 *
 * Every card leads to /signup rather than a checkout. An anonymous visitor
 * cannot be charged, and the real flow is sign up first, then upgrade from the
 * profile page — so the buttons say what actually happens next.
 */
export default function LandingPricing() {
  return (
    <section id="pricing" className="mx-auto max-w-320 px-5 py-20 sm:px-9">
      <div className="mx-auto max-w-2xl text-center">
        <span className="text-brand-secondary-300 text-xs font-semibold tracking-[0.08em] uppercase">
          {PRICING.eyebrow}
        </span>
        <h2 className="text-brand-tertiary-100 mt-3.5 text-[clamp(1.9rem,4.4vw,3.4rem)] leading-[1.05] font-bold tracking-[-0.025em]">
          {PRICING.titleBefore}{" "}
          <span className="pe-[0.12em] font-semibold italic">
            {PRICING.titleItalic}
          </span>
        </h2>
        <p className="text-brand-paper mx-auto mt-5 max-w-xl text-[1.05rem] leading-relaxed">
          {PRICING.body}
        </p>
      </div>

      <div className="mt-12 grid gap-4 md:grid-cols-3">
        {PLANS.map((plan) => {
          const isFree = plan.billingInterval === null;
          // PLANS stores labels uppercase because the billing page sets them
          // as tracked caps. Inside a sentence-case button that reads as
          // shouting, so title-case it here: BASIC -> Basic.
          const planName =
            plan.label.charAt(0) + plan.label.slice(1).toLowerCase();
          return (
            <div
              key={plan.id}
              data-reveal
              className={cn(
                "landing-lift relative flex flex-col rounded-3xl p-7",
                plan.featured
                  ? "bg-brand-ink text-brand-tertiary-100"
                  : "bg-brand-tertiary-100 text-brand-ink",
              )}
            >
              {plan.badge && (
                <span className="bg-brand-secondary-300 text-brand-primary-900 absolute -top-3 left-6 rounded-md px-2.5 py-1 text-[0.65rem] font-bold tracking-[0.1em]">
                  {plan.badge}
                </span>
              )}

              <span
                className={cn(
                  "text-xs font-semibold tracking-[0.14em] uppercase",
                  plan.featured
                    ? "text-brand-secondary-300"
                    : "text-brand-primary-900",
                )}
              >
                {plan.label}
              </span>

              <div className="mt-2 flex items-baseline gap-1.5">
                <span className="text-3xl leading-none font-bold">
                  ৳{formatPrice(plan.price)}
                </span>
                <span
                  className={cn(
                    "text-xs",
                    plan.featured
                      ? "text-brand-paper/70"
                      : "text-brand-tertiary-950",
                  )}
                >
                  {plan.unit}
                </span>
              </div>

              {plan.saving && (
                <span className="text-brand-secondary-600 mt-2 text-xs font-semibold">
                  ↓ {plan.saving}
                </span>
              )}

              <p
                className={cn(
                  "mt-3 text-sm leading-relaxed",
                  plan.featured
                    ? "text-brand-paper/80"
                    : "text-brand-tertiary-950",
                )}
              >
                {plan.tagline}
              </p>

              <ul
                className={cn(
                  "mt-5 mb-7 flex flex-1 flex-col gap-2 border-t pt-5 text-sm",
                  plan.featured ? "border-brand-paper/20" : "border-brand-ink/12",
                )}
              >
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <RiCheckLine
                      className={cn(
                        "mt-0.5 size-4 shrink-0",
                        plan.featured
                          ? "text-brand-secondary-300"
                          : "text-brand-primary-900",
                      )}
                      aria-hidden="true"
                    />
                    {f}
                  </li>
                ))}
              </ul>

              <LandingButton
                to="/signup"
                tone="sulu"
                size="default"
                className="w-full"
              >
                {isFree ? "Start free" : `Choose ${planName}`}
              </LandingButton>
            </div>
          );
        })}
      </div>

      <p className="text-brand-paper/70 mt-7 text-center text-xs">
        {PRICING.footnote}
      </p>
    </section>
  );
}
