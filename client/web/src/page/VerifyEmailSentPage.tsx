import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import useAuthService from "../services/auth";
import FreshrLogo from "../components/logo/FreshrLogo";
import { CheckCircle2 } from "lucide-react";

export default function VerifyEmailSentPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const authService = useAuthService();
  const email = (location.state as { email?: string })?.email ?? "";

  const [resendState, setResendState] = useState<"idle" | "sending" | "sent" | "rate-limited" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  async function handleResend() {
    if (!email) {
      setResendState("error");
      setErrorMessage("No email on file for this session. Please sign up again.");
      return;
    }
    setResendState("sending");
    setErrorMessage("");
    try {
      await authService.requestEmailVerification(email);
      setResendState("sent");
    } catch (err: any) {
      if (err?.response?.status === 429) {
        setResendState("rate-limited");
        setErrorMessage("Too many resend attempts. Please wait a few minutes and try again.");
      } else {
        setResendState("error");
        setErrorMessage("Could not resend right now. Please try again.");
      }
    }
  }

  return (
    <div className="min-h-dvh bg-background flex items-center justify-center px-6 py-16">
      <div className="w-full max-w-sm flex flex-col gap-6">
        <FreshrLogo />

        <CheckCircle2 className="w-10 h-10 text-primary" />

        <div>
          <h1 className="text-xl font-semibold text-foreground">Verify your email</h1>
          <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
            We sent a verification link to{" "}
            <span className="text-foreground font-medium">{email || "your email"}</span>.
            Click the link to activate your account.
          </p>
        </div>

        <div className="h-px bg-border" />

        <div className="flex flex-col gap-2">
          <p className="text-sm text-muted-foreground">Didn't get it?</p>
          <button
            type="button"
            onClick={resendState === "sending" ? undefined : handleResend}
            className="text-sm text-foreground hover:underline underline-offset-4 text-left w-fit disabled:cursor-default disabled:opacity-60"
            disabled={resendState === "sending"}
          >
            {resendState === "sending" ? "Sending..." : resendState === "sent" ? "Sent! Check your inbox again." : "Resend verification link"}
          </button>
          {(resendState === "rate-limited" || resendState === "error") && (
            <p className="text-xs text-destructive leading-relaxed">{errorMessage}</p>
          )}
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
