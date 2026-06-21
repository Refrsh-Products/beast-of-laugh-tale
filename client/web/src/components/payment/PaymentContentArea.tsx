import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Check } from "lucide-react";
import type { ProfileTab } from "../profile-account/ProfileSidebar";
import usePaymentService from "../../services/payment";
import useAccountService from "../../services/account";
import { cn } from "../../lib/utils";

interface PaymentContentAreaProps {
  activeTab: ProfileTab;
}

type PlanId = "free" | "monthly" | "semester";

interface Plan {
  id: PlanId;
  label: string;
  tagline: string;
  price: string;
  originalPrice: string | null;
  unit: string;
  badge: string | null;
  saving: string | null;
  featured: boolean;
  features: string[];
  cta: string;
  billingInterval: "MONTHLY" | "YEARLY" | null;
}

const PLANS: Plan[] = [
  {
    id: "free",
    label: "Basic",
    tagline: "For students just getting started.",
    price: "0",
    originalPrice: null,
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
    cta: "Subscribe — Free →",
    billingInterval: null,
  },
  {
    id: "monthly",
    label: "Pro",
    tagline: "For students who are serious.",
    price: "350",
    originalPrice: null,
    unit: "/ month",
    badge: "Popular",
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
    cta: "Subscribe Monthly →",
    billingInterval: "MONTHLY",
  },
  {
    id: "semester",
    label: "Scholar",
    tagline: "For students going all in.",
    price: "1,200",
    originalPrice: "1,400",
    unit: "/ 4 months",
    badge: "Best Value",
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
    cta: "Subscribe — One Semester →",
    billingInterval: "YEARLY",
  },
];

export default function PaymentContentArea({ activeTab }: PaymentContentAreaProps) {
  const paymentService = usePaymentService();
  const accountService = useAccountService();
  const navigate = useNavigate();
  const [loading, setLoading] = useState<"MONTHLY" | "YEARLY" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [currentPlan, setCurrentPlan] = useState<PlanId>("free");

  useEffect(() => {
    if (activeTab !== "payment") return;
    accountService.getAccount().then((res) => {
      if (!res) return;
      const { tier_plan, billing_interval, subscription_status } = res.account;
      if (tier_plan === "PAID" && subscription_status === "ACTIVE") {
        if (billing_interval === "MONTHLY") setCurrentPlan("monthly");
        else if (billing_interval === "YEARLY") setCurrentPlan("semester");
      } else {
        setCurrentPlan("free");
      }
    }).catch(() => {});
  }, [activeTab]);

  const handlePayment = async (billing_interval: "MONTHLY" | "YEARLY") => {
    setLoading(billing_interval);
    setError(null);
    try {
      const { payment_url } = await paymentService.initializePayment(billing_interval);
      window.location.href = payment_url;
    } catch {
      setError("Failed to initiate payment. Please try again.");
      setLoading(null);
    }
  };

  if (activeTab !== "payment") return null;

  return (
    <div>
      <h2 className="text-lg font-semibold text-foreground mb-1">Pick your edge.</h2>
      <p className="text-sm text-muted-foreground mb-6">
        One semester can change everything. Priced like it.
      </p>

      {error && (
        <div className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive mb-5">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {PLANS.map((plan) => {
          const isCurrent = plan.id === currentPlan;
          const isPaidUserOnFreeCard = plan.id === "free" && currentPlan !== "free";
          const isInactive = isCurrent || isPaidUserOnFreeCard;
          const isLoadingPlan = plan.billingInterval !== null && loading === plan.billingInterval;

          let ctaLabel: string;
          if (isLoadingPlan) ctaLabel = "Redirecting...";
          else if (isCurrent) ctaLabel = "Current plan";
          else if (isPaidUserOnFreeCard) ctaLabel = "Included";
          else ctaLabel = plan.cta;

          const isFeatured = plan.id === "semester";

          return (
            <div
              key={plan.id}
              className={cn(
                "relative flex flex-col rounded-lg border p-6",
                isFeatured
                  ? "border-primary/50 bg-primary/5"
                  : plan.featured
                    ? "border-border/80 bg-card"
                    : "border-border bg-card",
              )}
            >
              {plan.badge && (
                <span
                  className={cn(
                    "absolute -top-3 left-4 rounded-full px-2.5 py-0.5 text-xs font-medium border",
                    isFeatured
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-secondary text-foreground border-border",
                  )}
                >
                  {plan.badge}
                </span>
              )}

              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
                {plan.label}
              </p>

              <div className="mb-1">
                {plan.originalPrice && (
                  <p className="text-sm text-muted-foreground line-through mb-0.5">
                    ৳{plan.originalPrice}
                  </p>
                )}
                <span className="text-3xl font-bold text-foreground">৳{plan.price}</span>
              </div>
              <p className="text-xs text-muted-foreground mb-2">{plan.unit}</p>

              {plan.saving && (
                <p className="text-xs font-medium text-primary mb-3">↓ {plan.saving}</p>
              )}

              <p className="text-sm text-muted-foreground mb-5 leading-relaxed">{plan.tagline}</p>

              <div className="border-t border-border pt-4 mb-6 flex flex-col gap-2 flex-1">
                {plan.features.map((f) => (
                  <div key={f} className="flex items-start gap-2 text-xs text-foreground">
                    <Check className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
                    {f}
                  </div>
                ))}
              </div>

              <button
                disabled={isInactive || loading !== null}
                onClick={() => {
                  if (isInactive) return;
                  if (plan.billingInterval) handlePayment(plan.billingInterval);
                  else navigate("/dashboard");
                }}
                className={cn(
                  "w-full rounded-md px-4 py-2.5 text-sm font-medium transition-colors",
                  isInactive
                    ? "bg-secondary text-muted-foreground cursor-default"
                    : isFeatured
                      ? "bg-primary text-primary-foreground hover:bg-primary/90"
                      : "bg-foreground text-background hover:bg-foreground/90",
                  (loading !== null && !isLoadingPlan) && "opacity-50 cursor-not-allowed",
                )}
              >
                {ctaLabel}
              </button>
            </div>
          );
        })}
      </div>

      <p className="text-xs text-muted-foreground mt-6 text-center leading-relaxed">
        * Pricing in Bangladeshi Taka (BDT). Features are placeholders — final limits subject to change.
      </p>
      <p className="text-xs text-center mt-2">
        <button
          onClick={() => navigate("/refund-policy")}
          className="text-muted-foreground hover:text-foreground underline underline-offset-4 transition-colors"
        >
          Read our Refund Policy →
        </button>
      </p>
    </div>
  );
}
