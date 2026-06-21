import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import Button from "../components/ui/Button";
import Loading from "../components/loading/Loading";
import useAuthService from "../services/auth";
import { NeedsVerificationError } from "@freshr/shared";
import GoogleAuthBtn from "../components/google-auth/GoogleAuthBtn";
import FreshrLogo from "../components/logo/FreshrLogo";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";

export default function LoginPage() {
  const navigate = useNavigate();
  const authService = useAuthService();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [needsVerificationFor, setNeedsVerificationFor] = useState<string | null>(null);
  const [resendState, setResendState] = useState<"idle" | "sending" | "sent" | "rate-limited" | "error">("idle");
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
      const user = await authService.login(email, password);
      console.log("[LoginPage] Logged in user:", user);
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
    <div className="min-h-dvh bg-background flex items-center justify-center px-6 py-16">
      <div className="w-full max-w-sm flex flex-col gap-6">
        <FreshrLogo />

        <div>
          <h1 className="text-xl font-semibold text-foreground">Welcome back</h1>
          <p className="text-sm text-muted-foreground mt-1">Sign in to your account</p>
        </div>

        {import.meta.env.VITE_USE_MOCK !== "true" && (
          <>
            <GoogleAuthBtn />
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-border" />
              <span className="text-xs text-muted-foreground">or</span>
              <div className="flex-1 h-px bg-border" />
            </div>
          </>
        )}

        {error && <p className="text-sm text-destructive">{error}</p>}

        {needsVerificationFor && (
          <div className="rounded-md border border-border bg-secondary/50 p-3 text-sm">
            <p className="font-medium text-foreground mb-1">Please verify your email before logging in.</p>
            <p className="text-muted-foreground mb-2">We sent a verification link to {needsVerificationFor}.</p>
            <button
              type="button"
              onClick={resendState === "sending" ? undefined : handleResendVerification}
              className="text-sm text-foreground underline underline-offset-4 hover:text-muted-foreground disabled:cursor-default"
            >
              {resendState === "sending" ? "Sending..." : resendState === "sent" ? "Sent! Check your inbox." : "Resend verification link"}
            </button>
            {resendState === "rate-limited" && <p className="mt-2 text-destructive text-xs">Too many resend attempts. Try again in a few minutes.</p>}
            {resendState === "error" && <p className="mt-2 text-destructive text-xs">Could not resend right now. Please try again.</p>}
          </div>
        )}

        <form
          onSubmit={(e) => { e.preventDefault(); handleLogin(); }}
          className="flex flex-col gap-4"
        >
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

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="pr-14"
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                {showPassword ? "HIDE" : "SHOW"}
              </button>
            </div>
          </div>

          <div className="text-right">
            <Link to="/forgot-password" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
              Forgot password?
            </Link>
          </div>

          <Button variant="green" fullWidth type="submit">
            Log in →
          </Button>

          <p className="text-xs text-muted-foreground text-center leading-relaxed">
            By continuing, you agree to FRESHR's{" "}
            <Link to="/terms-of-service" className="text-foreground hover:underline underline-offset-4">Terms of Service</Link>
            {" "}and{" "}
            <Link to="/privacy-policy" className="text-foreground hover:underline underline-offset-4">Privacy Policy</Link>.
          </p>
        </form>

        <div className="flex flex-col gap-2 text-center text-sm text-muted-foreground">
          <p>Don't have an account? <Link to="/signup" className="text-foreground hover:underline underline-offset-4">Sign up</Link></p>
          <p>Need help? <Link to="/support" className="text-foreground hover:underline underline-offset-4">Contact support</Link></p>
        </div>
      </div>
    </div>
  );
}
