import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import useAuthService from "../services/auth";
import PasswordField from "../components/auth/PasswordField";
import CenteredCard from "../components/layout/CenteredCard";
import {
    AuthError,
  AuthFootLink,
} from "../components/auth/AuthShell";
import { Button } from "@/components/ui/button";

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const authService = useAuthService();
  const [searchParams] = useSearchParams();
  const uid = searchParams.get("uid") ?? "";
  const token = searchParams.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
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
      authService.resetPassword(uid, token, password, confirm);
      navigate("/login", { state: { resetSuccess: true } });
    } finally {
      setIsLoading(false);
    }
  }

  if (invalidLink) {
    return (
      <CenteredCard
        title="Invalid link"
        description="This reset link is invalid or has expired."
      >
        <AuthFootLink to="/forgot-password">
          Request a new reset link →
        </AuthFootLink>
      </CenteredCard>
    );
  }

  return (
    <CenteredCard
      title={
        <>
          Choose a new
          <br />
          password
        </>
      }
      description="Pick something strong and memorable."
    >
      <AuthError>{error}</AuthError>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <PasswordField
          label="New password"
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

        <Button
          type="submit"
          size="lg"
          className="mt-2 w-full"
          disabled={isLoading}
        >
          {isLoading ? "Saving…" : "Set new password"}
        </Button>
      </form>
    </CenteredCard>
  );
}
