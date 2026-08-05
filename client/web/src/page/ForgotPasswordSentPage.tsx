import { useLocation } from "react-router-dom";
import CenteredCard from "../components/layout/CenteredCard";
import { AuthFootLink } from "../components/auth/AuthShell";
import { Separator } from "@/components/ui/separator";

export default function ForgotPasswordSentPage() {
  const location = useLocation();
  const email = (location.state as { email?: string })?.email ?? "your email";

  return (
    <CenteredCard
      title={
        <>
          Check your
          <br />
          email
        </>
      }
    >
      <p className="text-muted-foreground mb-2 text-sm">
        We sent a reset link to
      </p>
      <p className="text-foreground mb-8 text-sm font-semibold break-all">
        {email}
      </p>

      <Separator className="mb-6" />

      <p className="text-muted-foreground mb-1.5 text-sm">Didn't get it?</p>
      <AuthFootLink to="/forgot-password">Resend reset link</AuthFootLink>

      <p className="text-muted-foreground mt-8 text-sm">
        <AuthFootLink to="/login">← Back to login</AuthFootLink>
      </p>
    </CenteredCard>
  );
}
