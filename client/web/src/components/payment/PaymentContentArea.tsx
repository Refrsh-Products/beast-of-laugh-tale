import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import type { ProfileTab } from "../profile-account/ProfileSidebar";
import usePaymentService from "../../services/payment";
import useAccountService from "../../services/account";
import { useToast } from "../../hooks/useToast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { RiCheckLine } from "@remixicon/react";

interface PaymentContentAreaProps {
  activeTab: ProfileTab;
}

type PlanId = "free" | "monthly" | "semester";

interface Plan {
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

const PLANS: Plan[] = [
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

function formatPrice(n: number): string {
  return n.toLocaleString("en-BD");
}

type ReferralStatus = "idle" | "loading" | "valid" | "invalid" | "already_used";

export default function PaymentContentArea({
  activeTab,
}: PaymentContentAreaProps) {
  const paymentService = usePaymentService();
  const accountService = useAccountService();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [loading, setLoading] = useState<"MONTHLY" | "YEARLY" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [currentPlan, setCurrentPlan] = useState<PlanId>("free");

  // Referral state
  const [referralInput, setReferralInput] = useState("");
  const [referralStatus, setReferralStatus] = useState<ReferralStatus>("idle");
  const [appliedCode, setAppliedCode] = useState("");
  const [discountPct, setDiscountPct] = useState(0);
  const [championName, setChampionName] = useState("");

  useEffect(() => {
    if (activeTab !== "payment") return;
    accountService
      .getAccount()
      .then((res) => {
        if (!res) return;
        const { tier_plan, billing_interval, subscription_status } =
          res.account;
        if (tier_plan === "PAID" && subscription_status === "ACTIVE") {
          if (billing_interval === "MONTHLY") setCurrentPlan("monthly");
          else if (billing_interval === "YEARLY") setCurrentPlan("semester");
        } else {
          setCurrentPlan("free");
        }
      })
      .catch(() => {});
  }, [activeTab]);

  const handleApplyReferral = async () => {
    const code = referralInput.trim();
    if (!code) return;

    setReferralStatus("loading");
    try {
      const res = await paymentService.validateReferralCode(code);
      if (res.valid) {
        setReferralStatus("valid");
        setAppliedCode(code);
        setDiscountPct(res.discount_percentage ?? 0);
        setChampionName(res.champion_name ?? "");
      } else if (res.reason === "already_used") {
        setReferralStatus("already_used");
        showToast("You have already used this code", "danger");
      } else {
        setReferralStatus("invalid");
        showToast("Invalid Code", "danger");
      }
    } catch {
      setReferralStatus("idle");
      showToast("Failed to validate code. Try again.", "danger");
    }
  };

  const handleRemoveReferral = () => {
    setReferralStatus("idle");
    setAppliedCode("");
    setDiscountPct(0);
    setChampionName("");
    setReferralInput("");
  };

  const getDiscountedPrice = (plan: Plan): number | null => {
    if (!appliedCode || discountPct <= 0 || plan.price === 0) return null;
    return Math.round(plan.price * (1 - discountPct / 100));
  };

  const handlePayment = async (billing_interval: "MONTHLY" | "YEARLY") => {
    setLoading(billing_interval);
    setError(null);
    try {
      const { payment_url } = await paymentService.initializePayment(
        billing_interval,
        appliedCode || undefined,
      );
      window.location.href = payment_url;
    } catch {
      setError("Failed to initiate payment. Please try again.");
      setLoading(null);
    }
  };

  if (activeTab !== "payment") return null;

  const isDiscountApplied = referralStatus === "valid" && discountPct > 0;

  return (
    <div>
      <h2 className="font-heading text-foreground mb-2 text-2xl leading-tight font-bold tracking-tight">
        Pick your edge.
      </h2>
      <p className="text-muted-foreground mb-6 text-sm">
        One semester can change everything. Priced like it.
      </p>

      {/* ── Referral code ── */}
      <div
        className={cn(
          "mb-6 rounded-2xl border p-5",
          isDiscountApplied
            ? "border-success bg-success/10"
            : "border-border bg-card",
        )}
      >
        <label
          htmlFor="referral-code-input"
          className="text-foreground mb-2.5 block text-sm font-semibold"
        >
          Have a referral code?
        </label>

        <div className="flex items-stretch gap-2">
          <Input
            id="referral-code-input"
            type="text"
            value={referralInput}
            onChange={(e) => {
              setReferralInput(e.target.value.toUpperCase());
              // Reset status if user edits after a failed attempt
              if (
                referralStatus === "invalid" ||
                referralStatus === "already_used"
              ) {
                setReferralStatus("idle");
              }
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleApplyReferral();
            }}
            placeholder="e.g. ABC-FRE-123"
            disabled={isDiscountApplied || referralStatus === "loading"}
            className="tracking-[0.06em]"
          />
          {!isDiscountApplied ? (
            <Button
              id="apply-referral-btn"
              onClick={handleApplyReferral}
              disabled={!referralInput.trim() || referralStatus === "loading"}
            >
              {referralStatus === "loading" ? "Checking…" : "Apply code"}
            </Button>
          ) : (
            <Button
              id="remove-referral-btn"
              variant="outline"
              onClick={handleRemoveReferral}
            >
              Remove
            </Button>
          )}
        </div>

        {isDiscountApplied && (
          <p className="text-success mt-2.5 flex items-center gap-1.5 text-sm font-semibold">
            <RiCheckLine className="size-4" aria-hidden="true" />
            {discountPct}% discount applied
            {championName ? ` (via ${championName})` : ""}
          </p>
        )}
      </div>

      {error && (
        <div
          role="alert"
          className="border-destructive bg-destructive/10 text-destructive mb-6 rounded-2xl border px-4 py-3 text-sm font-semibold"
        >
          {error}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-[repeat(auto-fit,minmax(13rem,1fr))]">
        {PLANS.map((plan) => {
          const discountedPrice = getDiscountedPrice(plan);
          const hasDiscount = discountedPrice !== null;

          const isCurrent = plan.id === currentPlan;
          const isPaidUserOnFreeCard =
            plan.id === "free" && currentPlan !== "free";
          const isInactive = isCurrent || isPaidUserOnFreeCard;
          const isLoading =
            plan.billingInterval !== null && loading === plan.billingInterval;

          let label: string;
          if (isLoading) label = "Redirecting…";
          else if (isCurrent) label = "Current plan";
          else if (isPaidUserOnFreeCard) label = "Included";
          else label = plan.cta;

          return (
            <div
              key={plan.id}
              className={cn(
                "relative flex flex-col rounded-3xl border p-6",
                plan.featured
                  ? "border-primary bg-card"
                  : "border-border bg-card",
              )}
            >
              {(plan.badge || hasDiscount) && (
                <div className="absolute -top-3 left-5 flex gap-1.5">
                  {plan.badge && (
                    <Badge variant="default">{plan.badge}</Badge>
                  )}
                  {hasDiscount && (
                    <Badge className="bg-success text-success-foreground">
                      {discountPct}% OFF
                    </Badge>
                  )}
                </div>
              )}

              <div className="text-muted-foreground mb-2 text-xs font-semibold tracking-[0.14em] uppercase">
                {plan.label}
              </div>

              {hasDiscount && (
                <div className="text-muted-foreground mb-0.5 text-sm font-semibold line-through">
                  ৳{formatPrice(plan.price)}
                </div>
              )}
              <div className="font-heading text-foreground mb-0.5 text-3xl leading-none font-bold">
                ৳{formatPrice(hasDiscount ? discountedPrice! : plan.price)}
              </div>
              <div className="text-muted-foreground mb-1.5 text-xs">
                {plan.unit}
              </div>

              {plan.saving && (
                <div className="text-success mb-2 text-xs font-semibold">
                  ↓ {plan.saving}
                </div>
              )}

              <p className="text-muted-foreground mb-5 text-xs leading-relaxed">
                {plan.tagline}
              </p>

              <ul className="border-border mb-6 flex flex-1 flex-col gap-2 border-t pt-4">
                {plan.features.map((f) => (
                  <li
                    key={f}
                    className="text-foreground flex items-center gap-2 text-xs"
                  >
                    <RiCheckLine
                      className="text-primary size-3.5 shrink-0"
                      aria-hidden="true"
                    />
                    {f}
                  </li>
                ))}
              </ul>

              <Button
                className="w-full"
                variant={plan.featured ? "default" : "outline"}
                disabled={isInactive || loading !== null}
                onClick={() => {
                  if (isInactive) return;
                  if (plan.billingInterval) handlePayment(plan.billingInterval);
                  else navigate("/dashboard");
                }}
              >
                {label}
              </Button>
            </div>
          );
        })}
      </div>

      <p className="text-muted-foreground mt-6 text-center text-xs">
        * Pricing in Bangladeshi Taka (BDT). Features are placeholders — final
        limits subject to change.
      </p>
      <p className="mt-2 text-center text-xs">
        <Link
          to="/refund-policy"
          className="text-primary font-semibold underline underline-offset-[3px] hover:no-underline"
        >
          Read our Refund Policy →
        </Link>
      </p>
    </div>
  );
}
