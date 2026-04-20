import { useState } from "react";
import { useNavigate } from "react-router-dom";
import type { ProfileTab } from "../profile-account/ProfileSidebar";
import usePaymentService from "../../services/payment";
import Button from "../ui/Button";

type PaymentProvider = "zinipay" | "stripe";

interface PaymentContentAreaProps {
  activeTab: ProfileTab;
}

const B = "#000000";
const W = "#FFFFFF";
const G = "#84e487";

export default function PaymentContentArea({
  activeTab,
}: PaymentContentAreaProps) {
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
          marginBottom: 32,
          lineHeight: 1.1,
        }}
      >
        Upgrade Plan
      </h2>

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

      {/* Plan cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 20,
        }}
      >
        {/* Free */}
        <div
          style={{
            background: W,
            border: `2px solid ${B}`,
            padding: 24,
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div
            style={{
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: "0.65rem",
              fontWeight: 700,
              letterSpacing: "0.14em",
              color: "#888",
              marginBottom: 10,
            }}
          >
            CURRENT PLAN
          </div>
          <div
            style={{
              fontFamily: "'Syne', sans-serif",
              fontWeight: 800,
              fontSize: "1.2rem",
              marginBottom: 12,
            }}
          >
            Free
          </div>
          <div
            style={{
              fontFamily: "'IBM Plex Mono', monospace",
              fontWeight: 700,
              fontSize: "1.75rem",
              lineHeight: 1,
              marginBottom: 4,
            }}
          >
            $0
          </div>
          <div
            style={{
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: "0.68rem",
              color: "#888",
              marginBottom: 20,
            }}
          >
            /forever
          </div>
          <p
            style={{
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: "0.73rem",
              color: "#555",
              lineHeight: 1.65,
              marginBottom: 24,
              flex: 1,
            }}
          >
            A great way to test out the basic features with no commitment
            required.
          </p>
          <Button variant="default" fullWidth onClick={() => navigate("/dashboard")}>
            CONTINUE FREE
          </Button>
        </div>

        {/* Monthly — featured */}
        <div
          style={{
            background: W,
            border: `3px solid ${B}`,
            boxShadow: `4px 4px 0 ${G}`,
            padding: 24,
            display: "flex",
            flexDirection: "column",
            position: "relative",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: -3,
              right: -3,
              background: B,
              color: W,
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: "0.6rem",
              fontWeight: 700,
              letterSpacing: "0.12em",
              padding: "4px 10px",
            }}
          >
            POPULAR
          </div>
          <div
            style={{
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: "0.65rem",
              fontWeight: 700,
              letterSpacing: "0.14em",
              color: "#888",
              marginBottom: 10,
            }}
          >
            FLEXIBLE
          </div>
          <div
            style={{
              fontFamily: "'Syne', sans-serif",
              fontWeight: 800,
              fontSize: "1.2rem",
              marginBottom: 12,
            }}
          >
            Monthly
          </div>
          <div
            style={{
              fontFamily: "'IBM Plex Mono', monospace",
              fontWeight: 700,
              fontSize: "1.75rem",
              lineHeight: 1,
              marginBottom: 4,
            }}
          >
            $15
          </div>
          <div
            style={{
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: "0.68rem",
              color: "#888",
              marginBottom: 20,
            }}
          >
            /month
          </div>
          <p
            style={{
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: "0.73rem",
              color: "#555",
              lineHeight: 1.65,
              marginBottom: 24,
              flex: 1,
            }}
          >
            Full access to all premium features on a flexible month-to-month
            basis.
          </p>
          <Button
            variant="green"
            fullWidth
            disabled={loading !== null}
            onClick={() => handlePayment("MONTHLY")}
          >
            {loading === "MONTHLY" ? "REDIRECTING..." : "SUBSCRIBE MONTHLY"}
          </Button>
        </div>

        {/* Yearly */}
        <div
          style={{
            background: W,
            border: `2px solid ${B}`,
            padding: 24,
            display: "flex",
            flexDirection: "column",
            position: "relative",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: -2,
              right: -2,
              background: B,
              color: W,
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: "0.6rem",
              fontWeight: 700,
              letterSpacing: "0.12em",
              padding: "4px 10px",
            }}
          >
            BEST VALUE
          </div>
          <div
            style={{
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: "0.65rem",
              fontWeight: 700,
              letterSpacing: "0.14em",
              color: "#888",
              marginBottom: 10,
            }}
          >
            SAVE 33%
          </div>
          <div
            style={{
              fontFamily: "'Syne', sans-serif",
              fontWeight: 800,
              fontSize: "1.2rem",
              marginBottom: 12,
            }}
          >
            Yearly
          </div>
          <div
            style={{
              fontFamily: "'IBM Plex Mono', monospace",
              fontWeight: 700,
              fontSize: "1.75rem",
              lineHeight: 1,
              marginBottom: 4,
            }}
          >
            $120
          </div>
          <div
            style={{
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: "0.68rem",
              color: "#888",
              marginBottom: 20,
            }}
          >
            /year
          </div>
          <p
            style={{
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: "0.73rem",
              color: "#555",
              lineHeight: 1.65,
              marginBottom: 24,
              flex: 1,
            }}
          >
            Best value. Get all features and save 33% by committing to an
            annual plan.
          </p>
          <Button
            variant="default"
            fullWidth
            disabled={loading !== null}
            onClick={() => handlePayment("YEARLY")}
          >
            {loading === "YEARLY" ? "REDIRECTING..." : "SUBSCRIBE YEARLY"}
          </Button>
        </div>
      </div>
    </div>
  );
}
