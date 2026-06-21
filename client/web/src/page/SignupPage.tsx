import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import GoogleAuthBtn from "../components/google-auth/GoogleAuthBtn";
import FreshrLogo from "../components/logo/FreshrLogo";
import Button from "../components/ui/Button";
import useAuthService from "../services/auth";
import Loading from "../components/loading/Loading";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";

export default function SignupPage() {
  const navigate = useNavigate();
  const authService = useAuthService();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    setError("");
    if (!email || !password || !confirm) {
      setError("Please fill in all fields.");
      return;
    }
    if (!/^(?=.*?[a-z])(?=.*?[A-Z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-]).{8,}$/.test(password)) {
      setError("Password must be at least 8 characters long, contain 1 uppercase letter, 1 lowercase letter, 1 special character, and 1 number.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    setIsLoading(true);
    try {
      await authService.register(email, password, confirm);
      navigate("/verify-email/sent", { state: { email } });
    } catch (err) {
      console.error("[SignupPage] Error During Registration:", err);
      setError(`Failed to Register User: ${email}\nError: ${err}`);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) return <Loading />;

  return (
    <div className="min-h-dvh bg-background flex items-center justify-center px-6 py-16">
      <div className="w-full max-w-sm flex flex-col gap-6">
        <FreshrLogo />

        <div>
          <h1 className="text-xl font-semibold text-foreground">Create your account</h1>
          <p className="text-sm text-muted-foreground mt-1">Get started with Freshr for free</p>
        </div>

        <GoogleAuthBtn />

        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-border" />
          <span className="text-xs text-muted-foreground">or</span>
          <div className="flex-1 h-px bg-border" />
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <form
          onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}
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
                autoComplete="new-password"
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

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="confirm">Confirm password</Label>
            <div className="relative">
              <Input
                id="confirm"
                type={showConfirm ? "text" : "password"}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="••••••••"
                className="pr-14"
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowConfirm((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                {showConfirm ? "HIDE" : "SHOW"}
              </button>
            </div>
          </div>

          <Button variant="green" fullWidth type="submit">
            Sign up →
          </Button>

          <p className="text-xs text-muted-foreground text-center leading-relaxed">
            By signing up, you agree to FRESHR's{" "}
            <Link to="/terms-of-service" className="text-foreground hover:underline underline-offset-4">Terms of Service</Link>
            {" "}and{" "}
            <Link to="/privacy-policy" className="text-foreground hover:underline underline-offset-4">Privacy Policy</Link>.
          </p>
        </form>

        <div className="flex flex-col gap-2 text-center text-sm text-muted-foreground">
          <p>Already have an account? <Link to="/login" className="text-foreground hover:underline underline-offset-4">Log in</Link></p>
          <p>Need help? <Link to="/support" className="text-foreground hover:underline underline-offset-4">Contact support</Link></p>
        </div>
      </div>
    </div>
  );
}
