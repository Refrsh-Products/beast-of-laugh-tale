import { useState } from "react";
import { useNavigate } from "react-router-dom";
import type { ProfileTab } from "../profile-account/ProfileSidebar";
import usePaymentService from "../../services/payment";
import { BLACK as B, WHITE as W, GREEN as G } from "../../constants/theme";

type PaymentProvider = "zinipay" | "stripe";

interface PaymentContentAreaProps {
  activeTab: ProfileTab;
}

const PLANS = [
  {
    id: "free",
    label: "BASIC",
    tagline: "For students just getting started.",
    price: "0",
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
    cta: "Current Plan",
    billingInterval: null,
  },
  {
    id: "monthly",
    label: "MONTHLY",
    tagline: "For students who are serious.",
    price: "350",
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
    billingInterval: "MONTHLY" as const,
  },
  {
    id: "semester",
    label: "SEMESTER",
    tagline: "For students going all in.",
    price: "1,200",
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
    billingInterval: "YEARLY" as const,
  },
];

export default function PaymentContentArea({ activeTab }: PaymentContentAreaProps) {
  const paymentService = usePaymentService();
  const navigate = useNavigate();
  const [loading, setLoading] = useState<"MONTHLY" | "YEARLY" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [provider, setProvider] = useState<PaymentProvider>("stripe");

  const handlePayment = async (billing_interval: "MONTHLY" | "YEARLY") => {
    setLoading(billing_interval);
    setError(null);
    try {
      const { payment_url } =
        provider === "stripe"
          ? await paymentService.initializeStripePayment(billing_interval)
          : await paymentService.initializePayment(billing_interval);
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
          color: "#666",
          marginBottom: 24,
        }}
      >
        One semester can change everything. Priced like it.
      </p>

      {/* Provider toggle */}
      <div
        style={{
          display: "inline-flex",
          border: `2px solid ${B}`,
          marginBottom: 32,
          overflow: "hidden",
        }}
      >
        {(["stripe", "zinipay"] as PaymentProvider[]).map((p, i) => (
          <button
            key={p}
            onClick={() => setProvider(p)}
            style={{
              padding: "8px 20px",
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: "0.72rem",
              fontWeight: 700,
              letterSpacing: "0.1em",
              cursor: "pointer",
              background: provider === p ? B : W,
              color: provider === p ? W : B,
              border: "none",
              borderLeft: i > 0 ? `2px solid ${B}` : "none",
              transition: "background 0.12s, color 0.12s",
            }}
          >
            {p === "stripe" ? "STRIPE" : "ZINIPAY"}
          </button>
        ))}
      </div>

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
                  fontSize: "0.6rem",
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
                fontSize: "0.65rem",
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
              ৳{plan.price}
            </div>
            <div
              style={{
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: "0.7rem",
                color: "#555",
                marginBottom: 6,
              }}
            >
              {plan.unit}
            </div>

            {plan.saving && (
              <div
                style={{
                  fontFamily: "'IBM Plex Mono', monospace",
                  fontSize: "0.65rem",
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
                fontSize: "0.72rem",
                color: "#444",
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
                    fontSize: "0.72rem",
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <span style={{ fontWeight: 700 }}>◆</span> {f}
                </div>
              ))}
            </div>

            <button
              disabled={!plan.billingInterval || loading !== null}
              onClick={() => {
                if (plan.billingInterval) handlePayment(plan.billingInterval);
                else navigate("/dashboard");
              }}
              style={{
                background: !plan.billingInterval ? "#eee" : B,
                color: !plan.billingInterval ? "#999" : W,
                border: `2px solid ${!plan.billingInterval ? "#ccc" : B}`,
                padding: "10px 16px",
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: "0.72rem",
                fontWeight: 700,
                letterSpacing: "0.06em",
                cursor: !plan.billingInterval ? "default" : "pointer",
                width: "100%",
                textAlign: "center",
              }}
            >
              {loading === plan.billingInterval ? "REDIRECTING..." : plan.cta}
            </button>
          </div>
        ))}
      </div>

      <p
        style={{
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: "0.68rem",
          color: "#888",
          marginTop: 24,
          textAlign: "center",
        }}
      >
        * Pricing in Bangladeshi Taka (BDT). Features are placeholders — final limits subject to change.
      </p>
    </div>
  );
}
