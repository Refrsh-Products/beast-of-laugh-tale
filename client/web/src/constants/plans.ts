/**
 * The subscription plans, shared by the profile page's billing tab and the
 * landing page's pricing section.
 *
 * These lived inside PaymentContentArea. The landing page needs the same
 * prices and feature lists, and a marketing page quietly disagreeing with the
 * checkout page about what a plan costs is the kind of drift that only ever
 * gets noticed by a customer, so there is one copy.
 *
 * Prices are in Bangladeshi Taka. `billingInterval` is what the payment API
 * expects; `null` marks the free tier, which has nothing to charge for.
 */

export type PlanId = "free" | "monthly" | "semester";

/**
 * What the payment API accepts. `SEMESTER` is the 4-month academic-session plan;
 * the older `YEARLY` value is legacy — it meant the same "semester" product but
 * was wrongly granting a full year of access, so new checkouts use `SEMESTER`.
 * Existing `YEARLY` subscriptions are still recognised when reading an account.
 */
export type BillingInterval = "MONTHLY" | "SEMESTER";

export interface Plan {
  id: PlanId;
  label: string;
  tagline: string;
  /** Headline figure shown large. Per-month for the paid plans. */
  price: number;
  unit: string;
  /**
   * Months charged up-front in one cycle: 0 free, 1 monthly, 4 semester. The
   * total actually charged is `price * cycleMonths`; drives the "billed once
   * for N months" note so the big number can stay a per-month figure.
   */
  cycleMonths: number;
  badge: string | null;
  saving: string | null;
  featured: boolean;
  features: string[];
  cta: string;
  billingInterval: BillingInterval | null;
}

export const PLANS: Plan[] = [
  {
    id: "free",
    label: "BASIC",
    tagline: "For students just getting started.",
    price: 0,
    unit: "forever",
    cycleMonths: 0,
    badge: null,
    saving: null,
    featured: false,
    features: [
      "3 notebooks",
      "500 MB storage",
      "5 AI queries / day",
      "5 quizzes / day",
      "3 presentations / day",
      "Community support",
    ],
    cta: "Subscribe — Free",
    billingInterval: null,
  },
  {
    id: "monthly",
    label: "PRO",
    tagline: "For students who are serious.",
    price: 350,
    unit: "/ month",
    cycleMonths: 1,
    badge: null,
    saving: null,
    featured: false,
    features: [
      "Unlimited notebooks",
      "5 GB storage",
      "Unlimited AI queries",
      "Unlimited quizzes",
      "Unlimited presentations",
      "Priority support",
    ],
    cta: "Subscribe Monthly",
    billingInterval: "MONTHLY",
  },
  {
    id: "semester",
    label: "SCHOLAR",
    tagline: "For students going all in.",
    price: 300,
    unit: "/ month",
    cycleMonths: 4,
    badge: "POPULAR",
    saving: "Save ৳50/mo vs Pro",
    featured: true,
    features: [
      "Everything in Monthly",
      "10 GB storage",
      "Unlimited notebooks",
      "Unlimited AI queries",
      "Unlimited quizzes",
      "Unlimited presentations",
      "Priority support",
    ],
    cta: "Subscribe — One Semester",
    billingInterval: "SEMESTER",
  },
];

/** Taka amounts, grouped the way a Bangladeshi reader expects. */
export function formatPrice(n: number): string {
  return n.toLocaleString("en-BD");
}

/**
 * The "৳1,200 billed once for 4 months" line for multi-month plans, so the big
 * headline number can stay a per-month figure. `discountPct` is applied to the
 * full cycle total — the way the payment API charges it — so the previewed total
 * matches what the user is actually billed, rather than multiplying a rounded
 * per-month figure. Returns null for the free and single-month plans, which have
 * nothing extra to explain.
 */
export function cycleTotalNote(plan: Plan, discountPct = 0): string | null {
  if (plan.cycleMonths <= 1) return null;
  const fullTotal = plan.price * plan.cycleMonths;
  const total =
    discountPct > 0
      ? Math.round(fullTotal * (1 - discountPct / 100))
      : fullTotal;
  return `৳${formatPrice(total)} billed once for ${plan.cycleMonths} months`;
}

/**
 * The plan name to show for a billing interval, used where there's no plan card
 * to read it from (e.g. the gateway-outage contact-sales form).
 */
export function planLabelForInterval(billingInterval: BillingInterval): string {
  return (
    PLANS.find((plan) => plan.billingInterval === billingInterval)?.label ??
    billingInterval
  );
}
