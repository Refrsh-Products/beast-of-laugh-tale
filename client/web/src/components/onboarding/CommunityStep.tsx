import type { CommunityStatus } from "@freshr/shared";
import { Button } from "@/components/ui/button";

/**
 * Step 3 — the only step that asks for nothing and blocks nothing.
 *
 * The profile is already saved by the time this renders, so every path out of
 * here (join, skip, or closing the tab) leaves a fully onboarded user. Nothing
 * in here may show a blocking error.
 *
 * Tapping Join is the consent event — there is no checkbox, because a
 * deliberate click is the affirmative action Meta's opt-in rules ask for, and a
 * checkbox before a button would collect the same consent twice.
 */
export default function CommunityStep({
  community,
  firstName,
  onJoin,
  onSkip,
}: {
  community: CommunityStatus;
  firstName?: string;
  onJoin: () => void;
  onSkip: () => void;
}) {
  const name = firstName?.trim();

  return (
    <div className="flex flex-col">
      <div
        aria-hidden="true"
        className="bg-secondary mb-6 flex size-14 items-center justify-center rounded-2xl text-3xl"
      >
        💬
      </div>

      <h1 className="font-heading text-foreground mb-2 text-2xl leading-tight font-bold tracking-tight">
        {name ? `You're all set, ${name}` : "You're all set"}
      </h1>
      <p className="text-muted-foreground mb-2 text-sm leading-relaxed">
        {community.headline}
      </p>
      <p className="text-muted-foreground mb-8 text-sm leading-relaxed">
        {community.message}
      </p>

      <div className="flex flex-col gap-2">
        <Button size="lg" className="w-full" onClick={onJoin} autoFocus>
          Join on WhatsApp
        </Button>
        <Button
          variant="ghost"
          size="lg"
          className="text-muted-foreground w-full"
          onClick={onSkip}
        >
          Finish onboarding
        </Button>
      </div>

      <p className="text-muted-foreground mt-4 text-center text-xs leading-relaxed">
        Opens WhatsApp. Joining shares your number with the other members, and
        you can leave the group any time.
      </p>
    </div>
  );
}
