import { useNavigate } from "react-router-dom";
import CenteredCard from "../components/layout/CenteredCard";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

export default function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <CenteredCard
      title={
        <>
          <span className="text-muted-foreground mb-1 block text-5xl leading-none tracking-tighter">
            404
          </span>
          Page not
          <br />
          found
        </>
      }
      description="The page you're looking for doesn't exist or has been moved."
    >
      <Separator className="mb-6" />

      <Button size="lg" className="w-full" onClick={() => navigate("/")}>
        Go home
      </Button>

      <p className="text-muted-foreground mt-5 text-sm">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="text-primary cursor-pointer font-semibold underline underline-offset-[3px] hover:no-underline"
        >
          ← Go back
        </button>
      </p>
    </CenteredCard>
  );
}
