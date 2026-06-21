import { useState } from "react";
import { useNavigate } from "react-router-dom";
import useAuthService from "../services/auth";
import Button from "../components/ui/Button";
import FreshrLogo from "../components/logo/FreshrLogo";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const authService = useAuthService();
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
    <div className="min-h-dvh bg-background flex items-center justify-center px-6 py-16">
      <div className="w-full max-w-sm flex flex-col gap-6">
        <FreshrLogo />

        <div>
          <h1 className="text-xl font-semibold text-foreground">Forgot your password?</h1>
          <p className="text-sm text-muted-foreground mt-1">Enter your email and we'll send you a reset link.</p>
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
            />
          </div>

          <Button variant="green" fullWidth type="submit" disabled={isLoading}>
            {isLoading ? "Sending..." : "Send reset link →"}
          </Button>
        </form>

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
