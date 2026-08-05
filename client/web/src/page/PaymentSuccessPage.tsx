import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import CenteredCard from "../components/layout/CenteredCard";
import { track } from "../lib/analytics";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { RiCheckLine } from "@remixicon/react";

export default function PaymentSuccessPage() {
  const navigate = useNavigate();

  useEffect(() => {
    track("user-upgraded");
  }, []);

  return (
    <CenteredCard
      title={
        <>
          Payment
          <br />
          successful
        </>
      }
      description="Your subscription is now active. You have full access to all premium features."
    >
      <Separator className="mb-6" />

      <Button size="lg" className="w-full" onClick={() => navigate("/dashboard")}>
        <RiCheckLine aria-hidden="true" />
        Go to dashboard
      </Button>

      <p className="text-muted-foreground mt-4.5 text-center text-xs leading-relaxed">
        Questions about a charge? See our{" "}
        <Link
          to="/refund-policy"
          className="text-primary font-semibold underline underline-offset-[3px] hover:no-underline"
        >
          Refund Policy
        </Link>
        .
      </p>
    </CenteredCard>
  );
}
