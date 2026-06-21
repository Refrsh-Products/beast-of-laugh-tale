import { useNavigate } from "react-router-dom";
import { Check } from "lucide-react";
import { cn } from "../../lib/utils";

const PLANS = [
  {
    id: "free",
    label: "Basic",
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
    label: "Pro",
    price: "350",
    originalPrice: null,
    unit: "/ month",
    outcome: "Study without limits.",
    detail: "Full access. Cancel any time.",
    badge: "Popular",
    saving: null,
    features: ["Unlimited notebooks", "Unlimited AI queries", "Unlimited quizzes", "5 GB storage", "Priority support"],
    cta: "Subscribe monthly →",
    highlighted: false,
  },
  {
    id: "semester",
    label: "Scholar",
    price: "1,200",
    originalPrice: "1,400",
    unit: "/ 4 months",
    outcome: "Own the whole semester.",
    detail: "One payment. One less thing to think about.",
    badge: "Best Value",
    saving: "Save 200 BDT vs monthly",
    features: ["Everything in Pro", "10 GB storage", "Priority support"],
    cta: "Subscribe — one semester →",
    highlighted: true,
  },
];

export default function PricingSection() {
  const navigate = useNavigate();

  return (
    <section className="py-24 px-6 md:px-16 border-b border-border bg-background">
      <div className="max-w-5xl mx-auto">
        <div className="mb-12">
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wider border border-border rounded-full px-3 py-1 mb-4">
            ◆ Pricing
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight leading-tight mb-3">
            One semester.<br />
            One price.<br />
            <span className="text-primary">Total clarity.</span>
          </h2>
          <p className="text-sm text-muted-foreground max-w-sm leading-relaxed">
            Built for students. Priced like it. All plans include the full AI-powered experience.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {PLANS.map((plan) => (
            <div
              key={plan.id}
              className={cn(
                "relative rounded-lg border flex flex-col p-6",
                plan.highlighted
                  ? "border-primary/50 bg-primary/5"
                  : "border-border bg-card",
              )}
            >
              {plan.badge && (
                <div className="absolute -top-3 left-4">
                  <span className={cn(
                    "rounded-full px-2.5 py-0.5 text-xs font-medium border",
                    plan.highlighted
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-secondary text-foreground border-border",
                  )}>
                    {plan.badge}
                  </span>
                </div>
              )}

              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-4">{plan.label}</p>

              <div className="mb-1">
                {plan.originalPrice && (
                  <p className="text-sm text-muted-foreground line-through mb-0.5">৳{plan.originalPrice}</p>
                )}
                <span className="text-4xl font-bold text-foreground">৳{plan.price}</span>
              </div>
              <p className="text-xs text-muted-foreground mb-2">{plan.unit}</p>

              {plan.saving && (
                <p className="text-xs font-medium text-primary mb-4">↓ {plan.saving}</p>
              )}

              <p className="text-sm font-semibold text-foreground mb-1">{plan.outcome}</p>
              <p className="text-xs text-muted-foreground mb-5 leading-relaxed">{plan.detail}</p>

              <div className="border-t border-border pt-4 mb-5 flex flex-col gap-2 flex-1">
                {plan.features.map((f) => (
                  <div key={f} className="flex items-center gap-2 text-xs text-foreground">
                    <Check className="h-3.5 w-3.5 text-primary shrink-0" />
                    {f}
                  </div>
                ))}
              </div>

              <button
                onClick={() => navigate("/signup")}
                className={cn(
                  "w-full rounded-md px-4 py-2.5 text-sm font-medium transition-colors",
                  plan.highlighted
                    ? "bg-primary text-primary-foreground hover:bg-primary/90"
                    : "bg-secondary text-foreground border border-border hover:bg-secondary/80",
                )}
              >
                {plan.cta}
              </button>
            </div>
          ))}
        </div>

        <p className="text-xs text-muted-foreground mt-8 text-center">
          * Pricing in Bangladeshi Taka (BDT). Features subject to change before launch.{" "}
          <button
            onClick={() => navigate("/refund-policy")}
            className="underline underline-offset-4 hover:text-foreground transition-colors"
          >
            Refund Policy →
          </button>
        </p>
      </div>
    </section>
  );
}
