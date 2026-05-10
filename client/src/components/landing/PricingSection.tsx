import { useNavigate } from "react-router-dom";
import { GREEN as G, BLACK as B, WHITE as W } from "../../constants/theme";

const PLANS = [
  {
    id: "free",
    label: "BASIC",
    price: "0",
    unit: "forever",
    outcome: "Start learning smarter.",
    detail: "No credit card. No commitment. Just better studying.",
    badge: null,
    saving: null,
    features: ["3 notebooks", "5 AI queries / day", "5 quizzes / day", "500 MB storage"],
    cta: "Get started free →",
    highlighted: false,
  },
  {
    id: "monthly",
    label: "PRO",
    price: "350",
    unit: "/ month",
    outcome: "Study without limits.",
    detail: "Full access. Cancel any time.",
    badge: "POPULAR",
    saving: null,
    features: ["Unlimited notebooks", "Unlimited AI queries", "Unlimited quizzes", "5 GB storage", "Priority support"],
    cta: "Subscribe monthly →",
    highlighted: false,
  },
  {
    id: "semester",
    label: "SCHOLAR",
    price: "1,200",
    unit: "/ 4 months",
    outcome: "Own the whole semester.",
    detail: "One payment. One less thing to think about.",
    badge: "BEST VALUE",
    saving: "Save 200 BDT vs monthly",
    features: ["Everything in Monthly", "10 GB storage", "Priority support"],
    cta: "Subscribe — one semester →",
    highlighted: true,
  },
];

export default function PricingSection() {
  const navigate = useNavigate();

  return (
    <section
      id="pricing"
      style={{
        background: B,
        borderBottom: `3px solid ${B}`,
        padding: "80px 0 64px",
      }}
    >
      {/* Header */}
      <div style={{ padding: "0 48px", maxWidth: 1200, margin: "0 auto" }}>
        <div
          style={{
            display: "inline-block",
            background: G,
            color: B,
            border: `2px solid ${G}`,
            padding: "6px 14px",
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: "0.65rem",
            fontWeight: 700,
            letterSpacing: "0.15em",
            marginBottom: 20,
          }}
        >
          ◆ Pricing
        </div>
        <h2
          style={{
            fontFamily: "'Syne', sans-serif",
            fontWeight: 800,
            fontSize: "clamp(2rem, 4vw, 3.5rem)",
            lineHeight: 1.05,
            letterSpacing: "-0.02em",
            color: W,
            marginBottom: 12,
          }}
        >
          One semester.
          <br />
          One price.
          <br />
          <span style={{ color: G }}>Total clarity.</span>
        </h2>
        <p
          style={{
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: "0.82rem",
            color: "#888",
            marginBottom: 56,
            maxWidth: 420,
            lineHeight: 1.7,
          }}
        >
          Built for students. Priced like it.
          All plans include the full AI-powered RAG experience.
        </p>

        {/* Cards */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: 20,
            alignItems: "stretch",
          }}
        >
          {PLANS.map((plan) => (
            <div
              key={plan.id}
              style={{
                background: plan.highlighted ? G : W,
                border: `3px solid ${plan.highlighted ? B : "#333"}`,
                padding: "32px 28px",
                display: "flex",
                flexDirection: "column",
                position: "relative",
                boxShadow: plan.highlighted ? `6px 6px 0 ${B}` : "none",
              }}
            >
              {plan.badge && (
                <div
                  style={{
                    position: "absolute",
                    top: -13,
                    left: 24,
                    background: plan.highlighted ? B : W,
                    color: plan.highlighted ? W : B,
                    border: `2px solid ${plan.highlighted ? B : "#333"}`,
                    fontFamily: "'IBM Plex Mono', monospace",
                    fontSize: "0.58rem",
                    fontWeight: 700,
                    letterSpacing: "0.14em",
                    padding: "3px 10px",
                  }}
                >
                  {plan.badge}
                </div>
              )}

              {/* Label */}
              <div
                style={{
                  fontFamily: "'IBM Plex Mono', monospace",
                  fontSize: "0.62rem",
                  fontWeight: 700,
                  letterSpacing: "0.16em",
                  color: plan.highlighted ? B : "#888",
                  marginBottom: 16,
                }}
              >
                {plan.label}
              </div>

              {/* Price */}
              <div
                style={{
                  fontFamily: "'Syne', sans-serif",
                  fontWeight: 800,
                  fontSize: "2.8rem",
                  lineHeight: 1,
                  color: B,
                  marginBottom: 2,
                }}
              >
                ৳{plan.price}
              </div>
              <div
                style={{
                  fontFamily: "'IBM Plex Mono', monospace",
                  fontSize: "0.7rem",
                  color: plan.highlighted ? "#1a4a1a" : "#666",
                  marginBottom: plan.saving ? 6 : 20,
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
                    color: "#1a4a1a",
                    marginBottom: 20,
                  }}
                >
                  ↓ {plan.saving}
                </div>
              )}

              {/* Outcome */}
              <p
                style={{
                  fontFamily: "'Syne', sans-serif",
                  fontWeight: 700,
                  fontSize: "1rem",
                  color: B,
                  marginBottom: 6,
                  lineHeight: 1.2,
                }}
              >
                {plan.outcome}
              </p>
              <p
                style={{
                  fontFamily: "'IBM Plex Mono', monospace",
                  fontSize: "0.72rem",
                  color: plan.highlighted ? "#1a4a1a" : "#555",
                  marginBottom: 24,
                  lineHeight: 1.65,
                }}
              >
                {plan.detail}
              </p>

              {/* Features */}
              <div
                style={{
                  borderTop: `2px solid ${plan.highlighted ? B : "#ddd"}`,
                  paddingTop: 16,
                  marginBottom: 28,
                  display: "flex",
                  flexDirection: "column",
                  gap: 9,
                  flex: 1,
                }}
              >
                {plan.features.map((f) => (
                  <div
                    key={f}
                    style={{
                      fontFamily: "'IBM Plex Mono', monospace",
                      fontSize: "0.72rem",
                      color: B,
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    <span style={{ fontWeight: 700, color: plan.highlighted ? B : G }}>◆</span>
                    {f}
                  </div>
                ))}
              </div>

              {/* CTA */}
              <button
                onClick={() => navigate("/signup")}
                style={{
                  background: plan.highlighted ? B : "transparent",
                  color: plan.highlighted ? W : B,
                  border: `2px solid ${plan.highlighted ? B : "#333"}`,
                  padding: "12px 16px",
                  fontFamily: "'IBM Plex Mono', monospace",
                  fontSize: "0.72rem",
                  fontWeight: 700,
                  letterSpacing: "0.08em",
                  cursor: "pointer",
                  width: "100%",
                  textAlign: "center",
                  transition: "background 0.12s, color 0.12s",
                }}
                onMouseEnter={(e) => {
                  if (!plan.highlighted) {
                    e.currentTarget.style.background = B;
                    e.currentTarget.style.color = W;
                  }
                }}
                onMouseLeave={(e) => {
                  if (!plan.highlighted) {
                    e.currentTarget.style.background = "transparent";
                    e.currentTarget.style.color = B;
                  }
                }}
              >
                {plan.cta}
              </button>
            </div>
          ))}
        </div>

        {/* Footer note */}
        <p
          style={{
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: "0.68rem",
            color: "#555",
            marginTop: 40,
            textAlign: "center",
          }}
        >
          * Pricing in Bangladeshi Taka (BDT). Features subject to change before launch.
        </p>
      </div>
    </section>
  );
}
