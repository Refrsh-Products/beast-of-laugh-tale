import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { ProfileTab } from "../profile-account/ProfileSidebar";
import usePaymentService from "../../services/payment";
import useAccountService from "../../services/account";
import { BLACK as B, WHITE as W, GREEN as G } from "../../constants/theme";

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
    label: "BASIC",
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
    label: "PRO",
    tagline: "For students who are serious.",
    price: "350",
    originalPrice: null,
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
    cta: "Subscribe Monthly →",
    billingInterval: "MONTHLY",
  },
  {
    id: "semester",
    label: "SCHOLAR",
    tagline: "For students going all in.",
    price: "1,200",
    originalPrice: "1,400",
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
    cta: "Subscribe — One Semester →",
    billingInterval: "YEARLY",
  },
];

export default function PaymentContentArea({
  activeTab,
}: PaymentContentAreaProps) {
  const paymentService = usePaymentService();
  const accountService = useAccountService();
  const navigate = useNavigate();
  const [loading, setLoading] = useState<"MONTHLY" | "YEARLY" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [currentPlan, setCurrentPlan] = useState<PlanId>("free");

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

  const handlePayment = async (billing_interval: "MONTHLY" | "YEARLY") => {
    setLoading(billing_interval);
    setError(null);
    try {
      const { payment_url } =
        await paymentService.initializePayment(billing_interval);
      window.location.href = payment_url;
    } catch {
      setError("Failed to initiate payment. Please try again.");
      setLoading(null);
    }
  };

  if (activeTab !== "payment") return null;

  return (
    <div>
      <h2
        style={{
          fontFamily: "'Syne', sans-serif",
          fontWeight: 800,
          fontSize: "1.5rem",
          letterSpacing: "-0.02em",
          marginBottom: 8,
          lineHeight: 1.1,
        }}
      >
        Pick your edge.
      </h2>
      <p
        style={{
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: "0.78rem",
          color: "#000000",
          marginBottom: 24,
        }}
      >
        One semester can change everything. Priced like it.
      </p>

      {error && (
        <div
          style={{
            border: `2px solid ${B}`,
            background: "#ffe5e5",
            padding: "12px 16px",
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: "0.75rem",
            fontWeight: 700,
            marginBottom: 24,
          }}
        >
          {error}
        </div>
      )}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: 16,
        }}
      >
        {PLANS.map((plan) => (
          <div
            key={plan.id}
            style={{
              border: `3px solid ${B}`,
              padding: "28px 24px",
              display: "flex",
              flexDirection: "column",
              background: plan.id === "semester" ? G : W,
              boxShadow: plan.id === "semester" ? `4px 4px 0 ${B}` : "none",
              position: "relative",
            }}
          >
            {plan.badge && (
              <div
                style={{
                  position: "absolute",
                  top: -13,
                  left: 20,
                  background: B,
                  color: W,
                  fontFamily: "'IBM Plex Mono', monospace",
                  fontSize: "0.75rem",
                  fontWeight: 700,
                  letterSpacing: "0.14em",
                  padding: "4px 10px",
                }}
              >
                {plan.badge}
              </div>
            )}

            <div
              style={{
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: "0.75rem",
                fontWeight: 700,
                letterSpacing: "0.14em",
                marginBottom: 8,
              }}
            >
              {plan.label}
            </div>

            <div
              style={{
                fontFamily: "'Syne', sans-serif",
                fontWeight: 800,
                fontSize: "2rem",
                lineHeight: 1,
                marginBottom: 2,
              }}
            >
              {plan.originalPrice && (
                <div
                  style={{
                    fontFamily: "'IBM Plex Mono', monospace",
                    fontSize: "0.85rem",
                    fontWeight: 700,
                    color: "#000000",
                    textDecoration: "line-through",
                    marginBottom: 2,
                  }}
                >
                  ৳{plan.originalPrice}
                </div>
              )}
              ৳{plan.price}
            </div>
            <div
              style={{
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: "0.75rem",
                color: "#000000",
                marginBottom: 6,
              }}
            >
              {plan.unit}
            </div>

            {plan.saving && (
              <div
                style={{
                  fontFamily: "'IBM Plex Mono', monospace",
                  fontSize: "0.75rem",
                  fontWeight: 700,
                  marginBottom: 8,
                  color: "#1a6e1a",
                }}
              >
                ↓ {plan.saving}
              </div>
            )}

            <p
              style={{
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: "0.75rem",
                color: "#000000",
                marginBottom: 20,
                lineHeight: 1.6,
              }}
            >
              {plan.tagline}
            </p>

            <div
              style={{
                borderTop: `2px solid ${B}`,
                paddingTop: 16,
                marginBottom: 24,
                display: "flex",
                flexDirection: "column",
                gap: 8,
                flex: 1,
              }}
            >
              {plan.features.map((f) => (
                <div
                  key={f}
                  style={{
                    fontFamily: "'IBM Plex Mono', monospace",
                    fontSize: "0.75rem",
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <span style={{ fontWeight: 700 }}>◆</span> {f}
                </div>
              ))}
            </div>

            {(() => {
              const isCurrent = plan.id === currentPlan;
              const isPaidUserOnFreeCard =
                plan.id === "free" && currentPlan !== "free";
              const isInactive = isCurrent || isPaidUserOnFreeCard;
              const isLoading =
                plan.billingInterval !== null &&
                loading === plan.billingInterval;
              let label: string;
              if (isLoading) label = "REDIRECTING...";
              else if (isCurrent) label = "Current Plan";
              else if (isPaidUserOnFreeCard) label = "Included";
              else label = plan.cta;
              return (
                <button
                  disabled={isInactive || loading !== null}
                  onClick={() => {
                    if (isInactive) return;
                    if (plan.billingInterval)
                      handlePayment(plan.billingInterval);
                    else navigate("/dashboard");
                  }}
                  style={{
                    background: isInactive ? "#eee" : B,
                    color: isInactive ? B : W,
                    border: `2px solid ${isInactive ? "#ccc" : B}`,
                    padding: "10px 16px",
                    fontFamily: "'IBM Plex Mono', monospace",
                    fontSize: "0.75rem",
                    fontWeight: 700,
                    letterSpacing: "0.06em",
                    cursor: isInactive ? "default" : "pointer",
                    width: "100%",
                    textAlign: "center",
                  }}
                >
                  {label}
                </button>
              );
            })()}
          </div>
        ))}
      </div>

      <p
        style={{
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: "0.75rem",
          color: "#000000",
          marginTop: 24,
          textAlign: "center",
        }}
      >
        * Pricing in Bangladeshi Taka (BDT). Features are placeholders — final
        limits subject to change.
      </p>
    </div>
  );
}
