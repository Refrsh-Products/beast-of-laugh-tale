import { Button } from "@/components/ui/button";

/**
 * Step 1. Sets expectations before the form so the field list doesn't land cold.
 *
 * `firstName` is only known here for Google sign-ups — `ensure_account` creates
 * email-registered users with an empty name — so the greeting has to work
 * without it.
 */
export default function WelcomeStep({
  firstName,
  onContinue,
}: {
  firstName?: string;
  onContinue: () => void;
}) {
  const name = firstName?.trim();

  return (
    <div className="flex flex-col">
      <h1 className="font-heading text-foreground mb-2 text-2xl leading-tight font-bold tracking-tight">
        {name ? `Welcome, ${name}` : "Welcome to FRESHR"}
      </h1>
      <p className="text-muted-foreground mb-8 text-sm leading-relaxed">
        A couple of quick questions and you're in. It takes about a minute, and
        you can change any of it later from your profile.
      </p>

      <Button size="lg" className="w-full" onClick={onContinue} autoFocus>
        Get started
      </Button>
    </div>
  );
}
