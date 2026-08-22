import { Wordmark } from '@/components/auth/Wordmark';
import { useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { Pressable, View } from 'react-native';

/**
 * Shared masthead for the auth screens.
 *
 * The offset and spacing live here rather than on each screen so the wordmark
 * lands on exactly the same pixels everywhere — otherwise it visibly jumps as
 * you move between login and register. Screens own only their `px`/`pb`.
 *
 * The back button is absolutely positioned instead of being a row sibling: as a
 * sibling it would shrink the wordmark's box and push the logo off true screen
 * centre, so the two screens still wouldn't line up.
 */
export function AuthHeader({ showBack = false }: { showBack?: boolean }) {
  const router = useRouter();

  return (
    <View className="mb-20 mt-24 h-12 justify-center">
      <Wordmark />
      {showBack ? (
        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          hitSlop={8}
          className="absolute bottom-0 -left-1 top-0 w-8 justify-center">
          <ChevronLeft size={28} />
        </Pressable>
      ) : null}
    </View>
  );
}
