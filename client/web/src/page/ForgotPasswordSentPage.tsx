import { useNavigate, useLocation } from "react-router-dom";
import { CheckCircle2 } from "lucide-react";
import FreshrLogo from "../components/logo/FreshrLogo";

export default function ForgotPasswordSentPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const email = (location.state as { email?: string })?.email ?? "your email";

  return (
    <div className="min-h-dvh bg-background flex items-center justify-center px-6 py-16">
      <div className="w-full max-w-sm flex flex-col gap-6">
        <FreshrLogo />

        <CheckCircle2 className="w-10 h-10 text-primary" />

        <div>
          <h1 className="text-xl font-semibold text-foreground">Check your email</h1>
          <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
            We sent a reset link to <span className="text-foreground font-medium">{email}</span>.
          </p>
        </div>

        <div className="h-px bg-border" />

        <div className="flex flex-col gap-1">
          <p className="text-sm text-muted-foreground">Didn't get it?</p>
          <button
            type="button"
            onClick={() => navigate("/forgot-password")}
            className="text-sm text-foreground hover:underline underline-offset-4 text-left w-fit"
          >
            Resend reset link
          </button>
        </div>

        <p className="text-sm text-center">
          <button
            type="button"
            onClick={() => navigate("/login")}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            ← Back to login
          </button>
        </p>
      </div>
    </div>
  );
}
