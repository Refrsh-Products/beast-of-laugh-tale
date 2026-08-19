import { useEffect, useRef, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import type { PaymentFallbackStatus } from "@freshr/shared";
import type { ProfileTab } from "../profile-account/ProfileSidebar";
import PaymentFallbackPanel from "./PaymentFallbackPanel";
import usePaymentService from "../../services/payment";
import useAccountService from "../../services/account";
import { useToast } from "../../hooks/useToast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { RiCheckLine } from "@remixicon/react";
import {
  PLANS,
  formatPrice,
  cycleTotalNote,
  planLabelForInterval,
  type BillingInterval,
  type Plan,
  type PlanId,
} from "../../constants/plans";

interface PaymentContentAreaProps {
  activeTab: ProfileTab;
}

type ReferralStatus = "idle" | "loading" | "valid" | "invalid" | "already_used";

export default function PaymentContentArea({
  activeTab,
}: PaymentContentAreaProps) {
  const paymentService = usePaymentService();
  const accountService = useAccountService();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [loading, setLoading] = useState<BillingInterval | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [currentPlan, setCurrentPlan] = useState<PlanId>("free");

  // Referral state
  const [referralInput, setReferralInput] = useState("");
  const [referralStatus, setReferralStatus] = useState<ReferralStatus>("idle");
  const [appliedCode, setAppliedCode] = useState("");
  const [discountPct, setDiscountPct] = useState(0);
  const [championName, setChampionName] = useState("");

  // Gateway-outage fallback state. `forcedByError` covers the gap between the
  // gateway going down and someone flipping the admin toggle: a 502 from
  // `initiate` puts us into the same contact-sales flow.
  const [fallback, setFallback] = useState<PaymentFallbackStatus | null>(null);
  const [forcedByError, setForcedByError] = useState(false);
  const [assistanceInterval, setAssistanceInterval] =
    useState<BillingInterval | null>(null);
  const [accountPhone, setAccountPhone] = useState("");
  const fallbackPanelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (activeTab !== "payment") return;
    accountService
      .getAccount()
      .then((res) => {
        if (!res) return;
        const { tier_plan, billing_interval, subscription_status, phone } =
          res.account;
        setAccountPhone(phone ?? "");
        if (tier_plan === "PAID" && subscription_status === "ACTIVE") {
          if (billing_interval === "MONTHLY") setCurrentPlan("monthly");
          // "YEARLY" is the legacy value for the same 4-month Scholar plan.
          else if (billing_interval === "SEMESTER" || billing_interval === "YEARLY")
            setCurrentPlan("semester");
        } else {
          setCurrentPlan("free");
        }
      })
      .catch(() => {});
  }, [activeTab]);

  useEffect(() => {
    if (activeTab !== "payment") return;
    paymentService
      .getFallbackStatus()
      .then(setFallback)
      // A failed status check must not block checkout — assume the gateway is
      // fine and let the 502 path catch it if it isn't.
      .catch(() => setFallback(null));
  }, [activeTab]);

  // Bring the form into view when a plan is picked; the panel sits above the
  // cards, so otherwise the click would appear to do nothing.
  useEffect(() => {
    if (assistanceInterval === null) return;
    fallbackPanelRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
  }, [assistanceInterval]);

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

  const handlePayment = async (billing_interval: BillingInterval) => {
    setLoading(billing_interval);
    setError(null);
    try {
      const { payment_url } = await paymentService.initializePayment(
        billing_interval,
        appliedCode || undefined,
      );
      window.location.href = payment_url;
    } catch (err) {
      const statusCode = (err as { response?: { status?: number } })?.response
        ?.status;
      if (statusCode === 502) {
        // The gateway is down and nobody has flipped the toggle yet — switch to
        // the contact-sales flow rather than dead-ending on an error message.
        setForcedByError(true);
        setAssistanceInterval(billing_interval);
      } else {
        setError("Failed to initiate payment. Please try again.");
      }
      setLoading(null);
    }
  };

  const handleAssistanceSubmit = (phone: string) => {
    if (!assistanceInterval) {
      return Promise.reject(new Error("No plan selected."));
    }
    return paymentService.requestAssistance(assistanceInterval, {
      referral_code: appliedCode || undefined,
      phone: phone || undefined,
    });
  };

  if (activeTab !== "payment") return null;

  const isDiscountApplied = referralStatus === "valid" && discountPct > 0;
  const fallbackActive = fallback?.enabled === true || forcedByError;

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

      {fallbackActive && (
        <div ref={fallbackPanelRef}>
          <PaymentFallbackPanel
            // Re-key on the plan so switching plans returns to the form.
            key={assistanceInterval ?? "none"}
            headline={
              fallback?.headline ?? "Online payment is temporarily unavailable"
            }
            message={
              fallback?.message ??
              "We're sorry for the inconvenience — our payment gateway is down right now. Leave your details and our team will contact you to get your paid access sorted."
            }
            whatsappUrl={fallback?.whatsapp_url ?? ""}
            planLabel={
              assistanceInterval
                ? planLabelForInterval(assistanceInterval)
                : null
            }
            defaultPhone={accountPhone}
            referralCode={isDiscountApplied ? appliedCode : ""}
            onSubmit={handleAssistanceSubmit}
          />
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

          const isSelectedForAssistance =
            fallbackActive &&
            plan.billingInterval !== null &&
            plan.billingInterval === assistanceInterval;

          let label: string;
          if (isLoading) label = "Redirecting…";
          else if (isCurrent) label = "Current plan";
          else if (isPaidUserOnFreeCard) label = "Included";
          else if (isSelectedForAssistance) label = "Selected";
          else if (fallbackActive && plan.billingInterval !== null)
            label = "Request paid access";
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

              {cycleTotalNote(plan, hasDiscount ? discountPct : 0) && (
                <div className="text-muted-foreground mb-1.5 text-xs">
                  {cycleTotalNote(plan, hasDiscount ? discountPct : 0)}
                </div>
              )}

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
                  if (!plan.billingInterval) {
                    navigate("/dashboard");
                  } else if (fallbackActive) {
                    // Checkout is off entirely while the gateway is down; the
                    // plan choice just feeds the contact-sales request.
                    setAssistanceInterval(plan.billingInterval);
                  } else {
                    handlePayment(plan.billingInterval);
                  }
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
