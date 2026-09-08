import { View } from 'react-native';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';

/**
 * Step 1. Sets expectations before the form so the field list doesn't land cold.
 *
 * `firstName` is only known here for Google sign-ups — `ensure_account` creates
 * email-registered users with an empty name — so the greeting has to work
 * without it.
 */
export function WelcomeStep({
  firstName,
  onContinue,
}: {
  firstName?: string;
  onContinue: () => void;
}) {
  const name = firstName?.trim();

  return (
    <View>
      <View className="bg-secondary mb-6 h-14 w-14 items-center justify-center rounded-2xl">
        <Text className="text-3xl">✦</Text>
      </View>

      <Text className="mb-2 text-3xl font-bold">
        {name ? `Welcome, ${name}` : 'Welcome to FRESHR'}
      </Text>
      <Text className="mb-8 text-base text-muted-foreground">
        A couple of quick questions and you&apos;re in. It takes about a minute, and you can
        change any of it later from your profile.
      </Text>

      <Button className="h-14 rounded-xl" onPress={onContinue}>
        <Text className="text-base font-semibold">Get started</Text>
      </Button>
    </View>
  );
}
