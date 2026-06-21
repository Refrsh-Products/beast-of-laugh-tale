import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { Check } from "lucide-react";
import Button from "../ui/Button";

const PRO_FEATURES = [
  "Unlimited notebooks",
  "50 GB storage",
  "Unlimited daily quizzes",
  "Unlimited presentations",
  "Priority support",
];

interface UpgradeModalProps {
  onClose: () => void;
  title?: string;
  description?: string;
}

export default function UpgradeModal({ onClose, title, description }: UpgradeModalProps) {
  const navigate = useNavigate();

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onMouseDown={onClose}
    >
      <div
        className="w-full max-w-md rounded-lg border border-border bg-card p-6 shadow-xl flex flex-col gap-5"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div>
          <h2 className="text-base font-semibold text-foreground">{title}</h2>
          <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{description}</p>
        </div>

        <div className="rounded-md border border-border bg-secondary/30 p-4 flex flex-col gap-2">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Pro plan includes
          </span>
          {PRO_FEATURES.map((feature) => (
            <div key={feature} className="flex items-center gap-2 text-sm text-foreground">
              <Check className="h-3.5 w-3.5 text-primary shrink-0" />
              {feature}
            </div>
          ))}
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="default" onClick={onClose}>Not now</Button>
          <Button
            variant="green"
            onClick={() => navigate("/profile", { state: { tab: "payment" } })}
          >
            Upgrade to Pro →
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
