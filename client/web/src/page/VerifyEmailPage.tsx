import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import useAuthService from "../services/auth";
import CenteredCard from "../components/layout/CenteredCard";
import { AuthFootLink } from "../components/auth/AuthShell";

type Status = "verifying" | "success" | "missing-params" | "invalid" | "error";

export default function VerifyEmailPage() {
  const navigate = useNavigate();
  const authService = useAuthService();
  const [searchParams] = useSearchParams();
  const uid = searchParams.get("uid") ?? "";
  const token = searchParams.get("token") ?? "";

  const [status, setStatus] = useState<Status>(
    !uid || !token ? "missing-params" : "verifying",
  );
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
        if (
          typeof detail === "string" &&
          detail.toLowerCase().includes("already")
        ) {
          // Already-verified case — send them to log in.
          setStatus("invalid");
          setErrorMessage(
            "This account is already verified. Please log in to continue.",
          );
          return;
        }
        if (err?.response?.status === 400) {
          setStatus("invalid");
          setErrorMessage(
            detail || "This verification link is invalid or has expired.",
          );
          return;
        }
        setStatus("error");
        setErrorMessage("Something went wrong. Please try again in a moment.");
      }
    })();
  }, [uid, token, authService, navigate]);

  if (status === "verifying") {
    return (
      <CenteredCard
        title={
          <>
            Verifying your
            <br />
            email…
          </>
        }
        description="Hang tight — this only takes a second."
      >
        {null}
      </CenteredCard>
    );
  }

  if (status === "success") {
    return (
      <CenteredCard
        title="Email verified!"
        description="Redirecting you to onboarding…"
      >
        {null}
      </CenteredCard>
    );
  }

  if (status === "missing-params") {
    return (
      <CenteredCard
        title="Invalid link"
        description="This verification link is missing required information."
      >
        <AuthFootLink to="/login">← Back to login</AuthFootLink>
      </CenteredCard>
    );
  }

  return (
    <CenteredCard
      title={status === "invalid" ? "Link expired" : "Something went wrong"}
      description={errorMessage}
    >
      <AuthFootLink to="/login">← Back to login</AuthFootLink>
    </CenteredCard>
  );
}
