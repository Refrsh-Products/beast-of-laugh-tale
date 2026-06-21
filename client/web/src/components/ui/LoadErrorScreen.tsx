import Button from "./Button";
import FreshrLogo from "../logo/FreshrLogo";

interface LoadErrorScreenProps {
  title?: string;
  message?: string;
  onRetry: () => void;
  retrying?: boolean;
}

export default function LoadErrorScreen({
  title = "Couldn't load your profile",
  message = "Something went wrong while checking your account. Check your connection and try again.",
  onRetry,
  retrying = false,
}: LoadErrorScreenProps) {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-background px-4 py-8">
      <div className="w-full max-w-md bg-card border border-border rounded-lg p-10">
        <FreshrLogo />
        <h1 className="mt-6 text-xl font-semibold text-foreground leading-tight">
          {title}
        </h1>
        <p className="mt-3 mb-7 text-sm text-muted-foreground leading-relaxed">
          {message}
        </p>
        <Button variant="green" fullWidth onClick={onRetry} disabled={retrying}>
          {retrying ? "Retrying..." : "Try again"}
        </Button>
      </div>
    </div>
  );
}
