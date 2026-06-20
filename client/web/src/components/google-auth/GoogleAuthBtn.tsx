import { useGoogleLogin } from "@react-oauth/google";
import { saveGoogleProfile } from "../../storage";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import useAuthServiceApi from "../../hooks/useAuthService.api";

const B = "#000000";
const W = "#FFFFFF";

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
        setError("Google sign-in failed. Please try again.");
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
        <p
          style={{
            color: "#cc0000",
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: "0.75rem",
            margin: "0 0 16px",
          }}
        >
          {error}
        </p>
      )}
      <button
        onClick={() => googleLogin()}
        disabled={isLoading}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = "translate(-3px, -3px)";
          e.currentTarget.style.boxShadow = `6px 6px 0 ${B}`;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "none";
          e.currentTarget.style.boxShadow = `3px 3px 0 ${B}`;
        }}
        style={{
          width: "100%",
          background: W,
          border: `2px solid ${B}`,
          boxShadow: `4px 4px 0 ${B}`,
          padding: "12px 22px",
          fontFamily: "'IBM Plex Mono', monospace",
          fontWeight: 600,
          fontSize: "0.78rem",
          letterSpacing: "0.08em",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 10,
          marginBottom: 24,
          transition: "transform 0.08s, box-shadow 0.08s",
        }}
        onMouseDown={(e) => {
          const el = e.currentTarget;
          el.style.boxShadow = `2px 2px 0 ${B}`;
          el.style.transform = "translate(2px, 2px)";
        }}
        onMouseUp={(e) => {
          const el = e.currentTarget;
          el.style.boxShadow = `4px 4px 0 ${B}`;
          el.style.transform = "none";
        }}
      >
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
          <path
            d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z"
            fill="#4285F4"
          />
          <path
            d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z"
            fill="#34A853"
          />
          <path
            d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z"
            fill="#FBBC05"
          />
          <path
            d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58Z"
            fill="#EA4335"
          />
        </svg>
        {isLoading ? "Signing in..." : "Continue with Google"}
      </button>
    </>
  );
}
