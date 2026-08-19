import { useNavigate } from "react-router-dom";
import { GREEN as G, BLACK as B, WHITE as W } from "./landingTheme";
import LineWaves from "./LineWaves";

const PLANS = [
  {
    id: "free",
    label: "BASIC",
    price: "0",
    originalPrice: null,
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
    originalPrice: null,
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
    originalPrice: "1,400",
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
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Line Waves background */}
      <div style={{ position: "absolute", inset: 0, zIndex: 0, opacity: 0.4 }}>
        <LineWaves
          color1="#84e487"
          color2="#84e487"
          color3="#84e487"
          brightness={0.28}
          speed={0.3}
          warpIntensity={1}
          rotation={-45}
          edgeFadeWidth={0}
          innerLineCount={32}
          outerLineCount={36}
        />
      </div>
      {/* Header */}
      <div style={{ padding: "0 clamp(16px, 5vw, 48px)", maxWidth: 1200, margin: "0 auto", position: "relative", zIndex: 1 }}>
        <div
          style={{
            display: "inline-block",
            background: G,
            color: B,
            border: `2px solid ${G}`,
            padding: "6px 14px",
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: "0.75rem",
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
            color: "#FFFFFF",
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
            gridTemplateColumns: "repeat(auto-fit, minmax(min(260px, 100%), 1fr))",
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
                    fontSize: "0.75rem",
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
                  fontSize: "0.75rem",
                  fontWeight: 700,
                  letterSpacing: "0.16em",
                  color: B,
                  marginBottom: 16,
                }}
              >
                {plan.label}
              </div>

              {/* Price */}
              {plan.originalPrice && (
                <div
                  style={{
                    fontFamily: "'IBM Plex Mono', monospace",
                    fontSize: "0.9rem",
                    fontWeight: 700,
                    color: "#000000",
                    textDecoration: "line-through",
                    marginBottom: 2,
                  }}
                >
                  ৳{plan.originalPrice}
                </div>
              )}
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
                  fontSize: "0.75rem",
                  color: plan.highlighted ? "#1a4a1a" : B,
                  marginBottom: plan.saving ? 6 : 20,
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
                  fontSize: "0.75rem",
                  color: plan.highlighted ? "#1a4a1a" : B,
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
                      fontSize: "0.75rem",
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
                  fontSize: "0.75rem",
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
            fontSize: "0.75rem",
            color: "#FFFFFF",
            marginTop: 40,
            textAlign: "center",
          }}
        >
          * Pricing in Bangladeshi Taka (BDT). Features subject to change before launch.
        </p>
        <p
          style={{
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: "0.75rem",
            color: "#FFFFFF",
            marginTop: 8,
            textAlign: "center",
          }}
        >
          <span
            onClick={() => navigate("/refund-policy")}
            onMouseEnter={(e) =>
              (e.currentTarget.style.textDecoration = "underline")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.textDecoration = "none")
            }
            style={{
              cursor: "pointer",
              fontWeight: 700,
              textUnderlineOffset: 3,
            }}
          >
            Read our Refund Policy →
          </span>
        </p>
      </div>
    </section>
  );
}
