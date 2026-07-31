import FreshrLogo from "../logo/FreshrLogo";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

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
    <div className="bg-background flex min-h-dvh items-center justify-center px-4 py-8">
      <Card className="w-full max-w-[480px]">
        <CardContent className="flex flex-col gap-6 p-10">
          <FreshrLogo />
          <div className="flex flex-col gap-3">
            <h1 className="text-3xl leading-tight font-bold tracking-[-0.02em]">
              {title}
            </h1>
            <p className="text-muted-foreground leading-relaxed">{message}</p>
          </div>
          <Button onClick={onRetry} disabled={retrying} className="w-full">
            {retrying ? "Retrying..." : "Try again"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
