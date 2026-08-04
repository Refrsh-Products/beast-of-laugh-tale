import { useNavigate } from "react-router-dom";
import CenteredCard from "../components/layout/CenteredCard";
import { AuthFootLink } from "../components/auth/AuthShell";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

export default function PaymentCancelPage() {
  const navigate = useNavigate();

  return (
    <CenteredCard
      title={
        <>
          Payment
          <br />
          cancelled
        </>
      }
      description="No charge was made. You can try again whenever you're ready."
    >
      <Separator className="mb-6" />

      <Button size="lg" className="mb-4 w-full" onClick={() => navigate("/profile")}>
        Try again
      </Button>

      <p className="text-muted-foreground text-sm">
        <AuthFootLink to="/dashboard">← Back to dashboard</AuthFootLink>
      </p>
    </CenteredCard>
  );
}
