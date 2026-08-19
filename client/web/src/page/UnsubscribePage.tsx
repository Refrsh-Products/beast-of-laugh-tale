import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import useAuthService from "../services/auth";
import CenteredCard from "../components/layout/CenteredCard";
import { AuthFootLink } from "../components/auth/AuthShell";

type Status = "working" | "done" | "invalid";

export default function UnsubscribePage() {
  const authService = useAuthService();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [status, setStatus] = useState<Status>(token ? "working" : "invalid");
  // React 18 StrictMode double-invokes effects in dev; guard so we only fire
  // the unsubscribe request once.
  const ran = useRef(false);

  useEffect(() => {
    if (!token || ran.current) return;
    ran.current = true;
    authService
      .unsubscribe(token)
      .then(() => setStatus("done"))
      .catch(() => setStatus("invalid"));
  }, [authService, token]);

  if (status === "invalid") {
    return (
      <CenteredCard
        title="Invalid link"
        description="This unsubscribe link is invalid or has expired. If you keep receiving unwanted emails, reply to any of them and we'll sort it out."
      >
        <AuthFootLink to="/">Back to FRESHR →</AuthFootLink>
      </CenteredCard>
    );
  }

  if (status === "working") {
    return <CenteredCard title="Unsubscribing…" description="One moment." />;
  }

  return (
    <CenteredCard
      title="You're unsubscribed"
      description="You won't receive any more marketing emails from FRESHR. You'll still get essential account emails like password resets and email verification."
    >
      <AuthFootLink to="/">Back to FRESHR →</AuthFootLink>
    </CenteredCard>
  );
}
