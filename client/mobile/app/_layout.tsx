import '@/global.css';

import { NAV_THEME } from '@/lib/theme';
import { AuthProvider, useAuth, type OnboardingState } from '@/context/AuthContext';
// Imported per face rather than from the package root: the root index pulls in
// all eight files, and the four italics we never register would ride along as
// ~280KB of dead weight in the bundle.
import { InstrumentSans_400Regular } from '@expo-google-fonts/instrument-sans/400Regular';
import { InstrumentSans_500Medium } from '@expo-google-fonts/instrument-sans/500Medium';
import { InstrumentSans_600SemiBold } from '@expo-google-fonts/instrument-sans/600SemiBold';
import { InstrumentSans_700Bold } from '@expo-google-fonts/instrument-sans/700Bold';
import { ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { PortalHost } from '@rn-primitives/portal';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from 'nativewind';
import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router';

/**
 * Redirects between the auth stack, the onboarding form, and the app stack based
 * on session + onboarding state. Runs only once the session has hydrated so we
 * don't flash the login screen for an already-signed-in user on cold start.
 *
 * Onboarding is a hard gate (matching web): a logged-in user whose profile is
 * incomplete is held on `/onboarding` until they finish. While onboarding status
 * is still loading we make no move, so we never flash the tabs and then bounce.
 */
function useProtectedRoute(ready: boolean, isLoggedIn: boolean, onboarding: OnboardingState) {
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (!ready) return;
    const inAuthGroup = segments[0] === '(auth)';
    const onOnboarding = segments[0] === 'onboarding';

    if (!isLoggedIn) {
      if (!inAuthGroup) router.replace('/login');
      return;
    }

    // Logged in — wait until we actually know the onboarding status before
    // moving, otherwise we'd flash the wrong stack.
    if (onboarding === 'loading' || onboarding === 'unknown') return;

    if (onboarding !== 'complete') {
      // 'incomplete' or 'error'. Route to the onboarding screen, which shows the
      // form when incomplete and a retry when the status check errored.
      if (!onOnboarding) router.replace('/onboarding');
      return;
    }

    // Onboarding complete — get them out of the auth/onboarding screens.
    if (inAuthGroup || onOnboarding) router.replace('/notebooks');
  }, [ready, isLoggedIn, onboarding, segments, router]);
}

function RootNavigator() {
  const { ready, isLoggedIn, onboarding } = useAuth();
  useProtectedRoute(ready, isLoggedIn, onboarding);

  // Instrument Sans is the brand's only typeface. The weight utilities name its
  // faces directly (see lib/design/typography.ts), so rendering before they load
  // would flash the system font across every screen. Waiting is one frame's cost
  // on cold start and nothing thereafter — the fonts are bundled, not fetched.
  const [fontsLoaded, fontError] = useFonts({
    InstrumentSans_400Regular,
    InstrumentSans_500Medium,
    InstrumentSans_600SemiBold,
    InstrumentSans_700Bold,
  });

  // A font that fails to load is a cosmetic problem, not a reason to hold the
  // app hostage: fall through to the system face rather than spinning forever.
  if (fontError) {
    console.warn('Instrument Sans failed to load; falling back to the system font.', fontError);
  }

  if (!ready || (!fontsLoaded && !fontError)) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}

export default function RootLayout() {
  const { colorScheme } = useColorScheme();

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider value={NAV_THEME[colorScheme ?? 'light']}>
        <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
        <AuthProvider>
          <RootNavigator />
        </AuthProvider>
        <PortalHost />
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
