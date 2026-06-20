import '@/global.css';

import { NAV_THEME } from '@/lib/theme';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { ThemeProvider } from '@react-navigation/native';
import { PortalHost } from '@rn-primitives/portal';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from 'nativewind';
import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router';

/**
 * Redirects between the auth stack and the app stack based on session state.
 * Runs only once the session has hydrated so we don't
 * flash the login screen for an already-signed-in user on cold start.
 */
function useProtectedRoute(ready: boolean, isLoggedIn: boolean) {
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (!ready) return;
    const inAuthGroup = segments[0] === '(auth)';
    if (!isLoggedIn && !inAuthGroup) {
      router.replace('/login');
    } else if (isLoggedIn && inAuthGroup) {
      router.replace('/notebooks');
    }
  }, [ready, isLoggedIn, segments, router]);
}

function RootNavigator() {
  const { ready, isLoggedIn } = useAuth();
  useProtectedRoute(ready, isLoggedIn);

  if (!ready) {
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
    <ThemeProvider value={NAV_THEME[colorScheme ?? 'light']}>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      <AuthProvider>
        <RootNavigator />
      </AuthProvider>
      <PortalHost />
    </ThemeProvider>
  );
}
