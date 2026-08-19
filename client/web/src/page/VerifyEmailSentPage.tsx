import { useState } from "react";
import { useLocation } from "react-router-dom";
import useAuthService from "../services/auth";
import CenteredCard from "../components/layout/CenteredCard";
import { AuthFootLink } from "../components/auth/AuthShell";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

export default function VerifyEmailSentPage() {
  const location = useLocation();
  const authService = useAuthService();
  const email = (location.state as { email?: string })?.email ?? "";

  const [resendState, setResendState] = useState<
    "idle" | "sending" | "sent" | "rate-limited" | "error"
  >("idle");
  const [errorMessage, setErrorMessage] = useState("");

  async function handleResend() {
    if (!email) {
      setResendState("error");
      setErrorMessage(
        "No email on file for this session. Please sign up again.",
      );
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
        setErrorMessage(
          "Too many resend attempts. Please wait a few minutes and try again.",
        );
      } else {
        setResendState("error");
        setErrorMessage("Could not resend right now. Please try again.");
      }
    }
  }

  return (
    <CenteredCard
      title={
        <>
          Verify your
          <br />
          email
        </>
      }
    >
      <p className="text-muted-foreground mb-2 text-sm">
        We sent a verification link to
      </p>
      <p className="text-foreground mb-8 text-sm font-semibold break-all">
        {email || "your email"}
      </p>

      <p className="text-muted-foreground mb-6 text-xs leading-relaxed">
        Click the link in the email to activate your account and continue to
        onboarding.
      </p>

      <Separator className="mb-6" />

      <p className="text-muted-foreground mb-1.5 text-xs">Didn't get it?</p>
      <Button
        variant="link"
        size="sm"
        className="h-auto p-0"
        disabled={resendState === "sending"}
        onClick={handleResend}
      >
        {resendState === "sending"
          ? "Sending…"
          : resendState === "sent"
            ? "Sent! Check your inbox again."
            : "Resend verification link"}
      </Button>

      {(resendState === "rate-limited" || resendState === "error") && (
        <p role="alert" className="text-destructive mt-3 text-xs leading-relaxed">
          {errorMessage}
        </p>
      )}

      <p className="text-muted-foreground mt-8 text-sm">
        <AuthFootLink to="/login">← Back to login</AuthFootLink>
      </p>
    </CenteredCard>
  );
}
