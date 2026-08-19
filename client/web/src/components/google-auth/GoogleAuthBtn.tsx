import { useGoogleLogin } from "@react-oauth/google";
import { isAxiosError } from "axios";
import { saveGoogleProfile } from "../../storage";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import useAuthServiceApi from "../../hooks/useAuthService.api";
import GoogleGlyph from "./GoogleGlyph";
import { Button } from "@/components/ui/button";

export default function GoogleAuthBtn() {
  if (import.meta.env.VITE_USE_MOCK === "true") return null;

  const navigate = useNavigate();
  const authService = useAuthServiceApi();
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setError("");
      setIsLoading(true);
      try {
        // All token-exchange + session/account caching lives in the shared
        // AuthService; this component only owns the popup + navigation.
        const { isNewUser, profile } = await authService.googleLogin(
          tokenResponse.access_token,
        );
        if (isNewUser) {
          // Stash the Google name/picture so onboarding can prefill them.
          saveGoogleProfile(profile);
          navigate("/onboarding");
        } else {
          navigate("/dashboard");
        }
      } catch (err) {
        console.error("[GoogleAuth] Sign-in failed:", err);
        const backendMessage = isAxiosError<{ error?: string }>(err)
          ? err.response?.data?.error
          : undefined;
        setError(backendMessage || "Google sign-in failed. Please try again.");
      } finally {
        setIsLoading(false);
      }
    },
    onError: () => {
      console.error("[GoogleAuth] Google popup error");
      setError("Google sign-in failed. Please try again.");
    },
  });

  return (
    <>
      {error && (
        <p role="alert" className="text-destructive mb-4 text-sm">
          {error}
        </p>
      )}
      <Button
        type="button"
        variant="outline"
        size="lg"
        className="mb-6 w-full"
        onClick={() => googleLogin()}
        disabled={isLoading}
      >
        <GoogleGlyph />
        {isLoading ? "Signing in…" : "Continue with Google"}
      </Button>
    </>
  );
}
