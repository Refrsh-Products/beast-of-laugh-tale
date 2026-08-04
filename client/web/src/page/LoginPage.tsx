import { useId, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import Loading from "../components/loading/Loading";
import useAuthService from "../services/auth";
import { NeedsVerificationError } from "@freshr/shared";
import GoogleAuthBtn from "../components/google-auth/GoogleAuthBtn";
import PasswordField from "../components/auth/PasswordField";
import {
  AUTH_LABEL,
  AuthDivider,
  AuthError,
  AuthFootLink,
  AuthHeading,
  AuthLegalNote,
  AuthSplitLayout,
} from "../components/auth/AuthShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function LoginPage() {
  const navigate = useNavigate();
  const authService = useAuthService();
  const emailId = useId();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [needsVerificationFor, setNeedsVerificationFor] = useState<
    string | null
  >(null);
  const [resendState, setResendState] = useState<
    "idle" | "sending" | "sent" | "rate-limited" | "error"
  >("idle");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      setError("Please fill in all fields.");
      return;
    }

    setError("");
    setNeedsVerificationFor(null);
    setResendState("idle");
    setIsLoading(true);

    try {
      await authService.login(email, password);
      navigate("/dashboard");
    } catch (err) {
      if (err instanceof NeedsVerificationError) {
        setNeedsVerificationFor(err.email);
      } else {
        setError("Incorrect email or password. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendVerification = async () => {
    if (!needsVerificationFor) return;
    setResendState("sending");
    try {
      await authService.requestEmailVerification(needsVerificationFor);
      setResendState("sent");
    } catch (err: any) {
      setResendState(err?.response?.status === 429 ? "rate-limited" : "error");
    }
  };

  if (isLoading) return <Loading />;

  return (
    <AuthSplitLayout brandSide="right">
      <AuthHeading>Welcome back</AuthHeading>

      <GoogleAuthBtn />
      <AuthDivider />

      <AuthError>{error}</AuthError>

      {needsVerificationFor && (
        <div className="border-border bg-muted mb-4 rounded-2xl border p-4 text-sm">
          <p className="text-foreground mb-2 font-semibold">
            Please verify your email before logging in.
          </p>
          <p className="text-muted-foreground mb-2.5">
            We sent a verification link to {needsVerificationFor}.
          </p>
          <Button
            variant="link"
            size="sm"
            className="h-auto p-0"
            disabled={resendState === "sending"}
            onClick={handleResendVerification}
          >
            {resendState === "sending"
              ? "Sending…"
              : resendState === "sent"
                ? "Sent! Check your inbox."
                : "Resend verification link"}
          </Button>
          {resendState === "rate-limited" && (
            <p role="alert" className="text-destructive mt-2">
              Too many resend attempts. Try again in a few minutes.
            </p>
          )}
          {resendState === "error" && (
            <p role="alert" className="text-destructive mt-2">
              Could not resend right now. Please try again.
            </p>
          )}
        </div>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleLogin();
        }}
        className="flex flex-col gap-4"
      >
        <div>
          <Label htmlFor={emailId} className={`${AUTH_LABEL} mb-1.5`}>
            Email
          </Label>
          <Input
            id={emailId}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            autoComplete="email"
          />
        </div>

        <PasswordField
          label="Password"
          value={password}
          onChange={setPassword}
          autoComplete="current-password"
        />

        <div className="text-right">
          <Link
            to="/forgot-password"
            className="text-muted-foreground hover:text-foreground text-xs underline underline-offset-[3px]"
          >
            Forgot password?
          </Link>
        </div>

        <Button type="submit" size="lg" className="mt-2 w-full">
          Log in
        </Button>

        <AuthLegalNote action="continuing" />
      </form>

      <p className="text-muted-foreground mt-7 text-center text-sm">
        Don't have an account? <AuthFootLink to="/signup">Sign up</AuthFootLink>
      </p>
      <p className="text-muted-foreground mt-2.5 text-center text-xs">
        Need help? <AuthFootLink to="/support">Contact support</AuthFootLink>
      </p>
    </AuthSplitLayout>
  );
}
