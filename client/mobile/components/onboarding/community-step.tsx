import { View } from 'react-native';
import type { CommunityStatus } from '@freshr/shared';
import { Button } from '@/components/ui/button';
import { ButtonSpinner } from '@/components/ui/button-spinner';
import { Text } from '@/components/ui/text';

/**
 * Step 3 — the only step that asks for nothing and blocks nothing.
 *
 * The profile is already saved by the time this renders, so every path out of
 * here (join, skip, or force-quitting) leaves a fully onboarded user. Nothing
 * in here may show a blocking error.
 *
 * Tapping Join is the consent event — there is no checkbox, because a
 * deliberate tap is the affirmative action Meta's opt-in rules ask for, and a
 * checkbox before a button would collect the same consent twice.
 */
export function CommunityStep({
  community,
  firstName,
  joining,
  onJoin,
  onSkip,
}: {
  community: CommunityStatus;
  firstName?: string;
  joining: boolean;
  onJoin: () => void;
  onSkip: () => void;
}) {
  const name = firstName?.trim();

  return (
    <View>
      <View className="bg-secondary mb-6 h-14 w-14 items-center justify-center rounded-2xl">
        <Text className="text-3xl">💬</Text>
      </View>

      <Text className="mb-2 text-3xl font-bold">
        {name ? `You're all set, ${name}` : "You're all set"}
      </Text>
      <Text className="mb-2 text-base text-muted-foreground">{community.headline}</Text>
      <Text className="mb-8 text-base text-muted-foreground">{community.message}</Text>

      <View className="gap-2">
        <Button className="h-14 rounded-xl" onPress={onJoin} disabled={joining}>
          {joining ? (
            <ButtonSpinner />
          ) : (
            <Text className="text-base font-semibold">Join on WhatsApp</Text>
          )}
        </Button>
        <Button variant="ghost" className="h-14 rounded-xl" onPress={onSkip} disabled={joining}>
          <Text className="text-base font-semibold text-muted-foreground">Finish onboarding</Text>
        </Button>
      </View>

      <Text className="mt-4 text-center text-xs text-muted-foreground">
        Opens WhatsApp. Joining shares your number with the other members, and you can leave the
        group any time.
      </Text>
    </View>
  );
}
