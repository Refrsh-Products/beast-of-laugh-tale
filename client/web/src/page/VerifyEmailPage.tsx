import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import useAuthService from "../services/auth";
import FreshrLogo from "../components/logo/FreshrLogo";

type Status = "verifying" | "success" | "missing-params" | "invalid" | "error";

export default function VerifyEmailPage() {
  const navigate = useNavigate();
  const authService = useAuthService();
  const [searchParams] = useSearchParams();
  const uid = searchParams.get("uid") ?? "";
  const token = searchParams.get("token") ?? "";

  const [status, setStatus] = useState<Status>(!uid || !token ? "missing-params" : "verifying");
  const [errorMessage, setErrorMessage] = useState("");
  // Guard against React.StrictMode double-invocation in dev — the verification
  // endpoint flips is_active on the first call, making the token invalid for
  // the second call and producing a confusing "expired link" error.
  const attempted = useRef(false);

  useEffect(() => {
    if (!uid || !token) return;
    if (attempted.current) return;
    attempted.current = true;

    (async () => {
      try {
        await authService.confirmEmailVerification(uid, token);
        setStatus("success");
        navigate("/onboarding", { replace: true });
      } catch (err: any) {
        const detail = err?.response?.data?.error ?? "";
        if (typeof detail === "string" && detail.toLowerCase().includes("already")) {
          setStatus("invalid");
          setErrorMessage("This account is already verified. Please log in to continue.");
          return;
        }
        if (err?.response?.status === 400) {
          setStatus("invalid");
          setErrorMessage(detail || "This verification link is invalid or has expired.");
          return;
        }
        setStatus("error");
        setErrorMessage("Something went wrong. Please try again in a moment.");
      }
    })();
  }, [uid, token, authService, navigate]);

  return (
    <div className="min-h-dvh bg-background flex items-center justify-center px-6 py-16">
      <div className="w-full max-w-sm flex flex-col gap-6">
        <FreshrLogo />

        {status === "verifying" && (
          <div>
            <div className="w-6 h-6 rounded-full border-2 border-border border-t-primary animate-spin mb-4" />
            <h1 className="text-xl font-semibold text-foreground">Verifying your email...</h1>
            <p className="text-sm text-muted-foreground mt-1">Hang tight — this only takes a second.</p>
          </div>
        )}

        {status === "success" && (
          <div>
            <h1 className="text-xl font-semibold text-foreground">Email verified!</h1>
            <p className="text-sm text-muted-foreground mt-1">Redirecting you to onboarding...</p>
          </div>
        )}

        {status === "missing-params" && (
          <div className="flex flex-col gap-4">
            <div>
              <h1 className="text-xl font-semibold text-foreground">Invalid link</h1>
              <p className="text-sm text-muted-foreground mt-1">This verification link is missing required information.</p>
            </div>
            <button
              type="button"
              onClick={() => navigate("/login")}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors text-left w-fit"
            >
              ← Back to login
            </button>
          </div>
        )}

        {(status === "invalid" || status === "error") && (
          <div className="flex flex-col gap-4">
            <div>
              <h1 className="text-xl font-semibold text-foreground">
                {status === "invalid" ? "Link expired" : "Something went wrong"}
              </h1>
              <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{errorMessage}</p>
            </div>
            <button
              type="button"
              onClick={() => navigate("/login")}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors text-left w-fit"
            >
              ← Back to login
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
