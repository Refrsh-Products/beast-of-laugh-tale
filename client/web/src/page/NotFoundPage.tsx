import { useNavigate } from "react-router-dom";
import { Compass } from "lucide-react";
import FreshrLogo from "../components/logo/FreshrLogo";
import Button from "../components/ui/Button";

export default function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-dvh bg-background flex flex-col items-center justify-center px-6 py-16 text-center">
      <div className="flex flex-col items-center gap-4 max-w-sm">
        <FreshrLogo />
        <Compass className="h-10 w-10 text-muted-foreground mt-4" />
        <div>
          <p className="text-5xl font-bold text-foreground">404</p>
          <h1 className="text-xl font-semibold text-foreground mt-2">Page not found</h1>
          <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
            The page you're looking for doesn't exist or has been moved.
          </p>
        </div>
        <div className="flex flex-col gap-3 w-full mt-2">
          <Button variant="green" fullWidth onClick={() => navigate("/")}>
            Go home
          </Button>
          <button
            onClick={() => navigate(-1)}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            ← Go back
          </button>
        </div>
      </div>
    </div>
  );
}
