import { useId, useState } from "react";
import { useNavigate } from "react-router-dom";
import GoogleAuthBtn from "../components/google-auth/GoogleAuthBtn";
import useAuthService from "../services/auth";
import Loading from "../components/loading/Loading";
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

export default function SignupPage() {
  const navigate = useNavigate();
  const authService = useAuthService();
  const emailId = useId();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    setError("");

    if (!email || !password || !confirm) {
      setError("Please fill in all fields.");
      return;
    }
    if (
      !/^(?=.*?[a-z])(?=.*?[A-Z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-]).{8,}$/.test(
        password,
      )
    ) {
      setError(
        "Password must be at least 8 characters long, contain 1 uppercase letter, 1 lowercase letter, 1 special character, and 1 number.",
      );
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
      setError(
        err instanceof Error
          ? err.message
          : "Failed to register. Please try again.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) return <Loading />;

  return (
    <AuthSplitLayout brandSide="left">
      <AuthHeading>Create your account</AuthHeading>

      <GoogleAuthBtn />
      <AuthDivider />

      <AuthError>{error}</AuthError>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSubmit();
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
          autoComplete="new-password"
        />

        <PasswordField
          label="Confirm password"
          value={confirm}
          onChange={setConfirm}
          autoComplete="new-password"
        />

        <Button type="submit" size="lg" className="mt-2 w-full">
          Sign up
        </Button>

        <AuthLegalNote action="signing up" />
      </form>

      <p className="text-muted-foreground mt-7 text-center text-sm">
        Already have an account? <AuthFootLink to="/login">Log in</AuthFootLink>
      </p>
      <p className="text-muted-foreground mt-2.5 text-center text-xs">
        Need help? <AuthFootLink to="/support">Contact support</AuthFootLink>
      </p>
    </AuthSplitLayout>
  );
}
