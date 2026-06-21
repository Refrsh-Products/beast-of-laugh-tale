import { useNavigate } from "react-router-dom";
import { Check } from "lucide-react";
import Button from "../ui/Button";
import { DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "../ui/dialog";

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

  return (
    <DialogContent onClose={onClose}>
      <DialogHeader>
        <DialogTitle>{title}</DialogTitle>
        <DialogDescription>{description}</DialogDescription>
      </DialogHeader>

      <div className="rounded-md border border-border bg-secondary/30 p-4 flex flex-col gap-2 my-2">
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

      <DialogFooter>
        <Button variant="default" onClick={onClose}>Not now</Button>
        <Button
          variant="green"
          onClick={() => navigate("/profile", { state: { tab: "payment" } })}
        >
          Upgrade to Pro →
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}
