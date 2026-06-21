import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle2 } from "lucide-react";
import FreshrLogo from "../components/logo/FreshrLogo";
import Button from "../components/ui/Button";
import { track } from "../lib/analytics";

export default function PaymentSuccessPage() {
  const navigate = useNavigate();

  useEffect(() => {
    track("user-upgraded");
  }, []);

  return (
    <div className="min-h-dvh bg-background flex flex-col items-center justify-center px-6 py-16 text-center">
      <div className="flex flex-col items-center gap-4 max-w-sm">
        <FreshrLogo />
        <CheckCircle2 className="h-12 w-12 text-primary mt-4" />
        <div>
          <h1 className="text-xl font-semibold text-foreground">You're on Pro</h1>
          <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
            Your subscription is now active. You have full access to all premium features.
          </p>
        </div>
        <Button variant="green" fullWidth onClick={() => navigate("/dashboard")}>
          Go to dashboard
        </Button>
        <button
          onClick={() => navigate("/refund-policy")}
          className="text-sm text-muted-foreground hover:text-foreground underline underline-offset-4 transition-colors"
        >
          Read our Refund Policy
        </button>
      </div>
    </div>
  );
}
