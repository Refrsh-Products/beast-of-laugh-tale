import { useNavigate } from "react-router-dom";
import { XCircle } from "lucide-react";
import FreshrLogo from "../components/logo/FreshrLogo";
import Button from "../components/ui/Button";

export default function PaymentCancelPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-dvh bg-background flex flex-col items-center justify-center px-6 py-16 text-center">
      <div className="flex flex-col items-center gap-4 max-w-sm">
        <FreshrLogo />
        <XCircle className="h-12 w-12 text-muted-foreground mt-4" />
        <div>
          <h1 className="text-xl font-semibold text-foreground">Payment cancelled</h1>
          <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
            No charge was made. You can try again whenever you're ready.
          </p>
        </div>
        <div className="flex flex-col gap-3 w-full">
          <Button variant="green" fullWidth onClick={() => navigate("/profile", { state: { tab: "payment" } })}>
            Try again
          </Button>
          <button
            onClick={() => navigate("/dashboard")}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            ← Back to dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
