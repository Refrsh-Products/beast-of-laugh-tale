import { useId, useState } from "react";
import { useNavigate } from "react-router-dom";
import useAuthService from "../services/auth";
import CenteredCard from "../components/layout/CenteredCard";
import {
  AUTH_LABEL,
    AuthError,
  AuthFootLink,
} from "../components/auth/AuthShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const authService = useAuthService();
  const emailId = useId();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) {
      setError("Please enter your email.");
      return;
    }
    setError("");
    setIsLoading(true);
    try {
      authService.requestPasswordReset(email);
      navigate("/forgot-password/sent", { state: { email } });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <CenteredCard
      title={
        <>
          Forgot your
          <br />
          password?
        </>
      }
      description="Enter your email and we'll send you a reset link."
    >
      <AuthError>{error}</AuthError>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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

        <Button
          type="submit"
          size="lg"
          className="mt-2 w-full"
          disabled={isLoading}
        >
          {isLoading ? "Sending…" : "Send reset link"}
        </Button>
      </form>

      <p className="text-muted-foreground mt-6 text-sm">
        <AuthFootLink to="/login">← Back to login</AuthFootLink>
      </p>
    </CenteredCard>
  );
}
