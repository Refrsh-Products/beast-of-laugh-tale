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

export interface Plan {
  id: PlanId;
  label: string;
  tagline: string;
  price: number;
  unit: string;
  badge: string | null;
  saving: string | null;
  featured: boolean;
  features: string[];
  cta: string;
  billingInterval: "MONTHLY" | "YEARLY" | null;
}

export const PLANS: Plan[] = [
  {
    id: "free",
    label: "BASIC",
    tagline: "For students just getting started.",
    price: 0,
    unit: "forever",
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
    badge: "POPULAR",
    saving: null,
    featured: true,
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
    price: 1200,
    unit: "/ 4 months",
    badge: "BEST VALUE",
    saving: "Save 200 BDT vs monthly",
    featured: false,
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
    billingInterval: "YEARLY",
  },
];

/** Taka amounts, grouped the way a Bangladeshi reader expects. */
export function formatPrice(n: number): string {
  return n.toLocaleString("en-BD");
}
