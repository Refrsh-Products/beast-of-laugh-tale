import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import useAuthService from "../services/auth";
import Button from "../components/ui/Button";
import FreshrLogo from "../components/logo/FreshrLogo";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const authService = useAuthService();
  const [searchParams] = useSearchParams();
  const uid = searchParams.get("uid") ?? "";
  const token = searchParams.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const invalidLink = !uid || !token;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!password || !confirm) {
      setError("Please fill in all fields.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    setIsLoading(true);
    try {
      console.log(`uid: ${uid}, token: ${token}, pass: ${password}, confirm: ${confirm}`);
      authService.resetPassword(uid, token, password, confirm);
      navigate("/login", { state: { resetSuccess: true } });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-dvh bg-background flex items-center justify-center px-6 py-16">
      <div className="w-full max-w-sm flex flex-col gap-6">
        <FreshrLogo />

        {invalidLink ? (
          <>
            <div>
              <h1 className="text-xl font-semibold text-foreground">Invalid link</h1>
              <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                This reset link is invalid or has expired.
              </p>
            </div>
            <button
              type="button"
              onClick={() => navigate("/forgot-password")}
              className="text-sm text-foreground hover:underline underline-offset-4 text-left w-fit"
            >
              Request a new reset link →
            </button>
          </>
        ) : (
          <>
            <div>
              <h1 className="text-xl font-semibold text-foreground">Choose a new password</h1>
              <p className="text-sm text-muted-foreground mt-1">Pick something strong and memorable.</p>
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="password">New password</Label>
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

              <Button variant="green" fullWidth type="submit" disabled={isLoading}>
                {isLoading ? "Saving..." : "Set new password →"}
              </Button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
