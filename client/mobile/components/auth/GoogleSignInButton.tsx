import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { useAuthService } from '@/hooks/useAuthService';
import { googleAuthConfig, isGoogleAuthConfigured } from '@/lib/config';
import { setGoogleProfile } from '@/lib/googleProfile';
import Constants from 'expo-constants';
import * as Google from 'expo-auth-session/providers/google';
import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

// Required so the browser-based auth popup can hand control back to the app.
WebBrowser.maybeCompleteAuthSession();

/**
 * "Continue with Google" button. Runs the Google OAuth flow via
 * expo-auth-session, then hands the resulting access token to the shared
 * `googleLogin` service (which exchanges it for Freshr JWTs and caches the
 * profile). New users have no profile yet, so we stash the Google name/picture
 * for the onboarding form to prefill and let the root guard route them there.
 *
 * Hidden when no Google client IDs are configured so dev builds without OAuth
 * set up don't show a button that can't work.
 */
// Google rejects Expo Go's `exp://` redirect URI (and the auth proxy is gone),
// so OAuth only works in a dev/standalone build — guard against the confusing
// 400 by telling the developer instead of launching a doomed flow.
const isExpoGo = Constants.executionEnvironment === 'storeClient';

export function GoogleSignInButton() {
  const router = useRouter();
  const authService = useAuthService();
  const [loading, setLoading] = useState(false);

  const [request, response, promptAsync] = Google.useAuthRequest({
    iosClientId: googleAuthConfig.iosClientId,
    androidClientId: googleAuthConfig.androidClientId,
    webClientId: googleAuthConfig.webClientId,
  });

  useEffect(() => {
    if (response?.type !== 'success') {
      // 'dismiss'/'cancel' are user actions; only surface real errors.
      if (response?.type === 'error') {
        setLoading(false);
        Alert.alert('Google sign-in failed', 'Please try again.');
      }
      return;
    }

    const accessToken = response.authentication?.accessToken;
    if (!accessToken) {
      setLoading(false);
      Alert.alert('Google sign-in failed', 'No access token returned.');
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const { isNewUser, profile } = await authService.googleLogin(accessToken);
        // New users land on the onboarding form (driven by the root guard once
        // it sees onboarding is incomplete); stash the Google profile so the
        // form can prefill name and picture.
        if (isNewUser) setGoogleProfile(profile);
        // Existing users go straight to the app. New users would be bounced by
        // the guard anyway, but routing to /notebooks first flashes the tabs, so
        // for them we let the guard do the navigation from here.
        if (!cancelled && !isNewUser) router.replace('/notebooks');
      } catch (err) {
        console.error('[GoogleSignIn] Backend exchange failed:', err);
        if (!cancelled) Alert.alert('Google sign-in failed', 'Please try again.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [response, authService, router]);

  if (!isGoogleAuthConfigured) return null;

  return (
    <Button
      variant="outline"
      className="h-14 rounded-xl"
      disabled={!request || loading}
      onPress={() => {
        if (isExpoGo) {
          Alert.alert(
            'Development build required',
            'Google sign-in does not work in Expo Go. Run a dev build (npx expo run:ios / run:android) to use it.'
          );
          return;
        }
        setLoading(true);
        promptAsync().catch(() => setLoading(false));
      }}
    >
      <View className="flex-row items-center gap-3">
        {loading ? (
          <ActivityIndicator />
        ) : (
          <GoogleGlyph />
        )}
        <Text className="font-medium">
          {loading ? 'Signing in…' : 'Continue with Google'}
        </Text>
      </View>
    </Button>
  );
}

function GoogleGlyph() {
  return (
    <Svg width={18} height={18} viewBox="0 0 18 18">
      <Path
        d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z"
        fill="#4285F4"
      />
      <Path
        d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z"
        fill="#34A853"
      />
      <Path
        d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z"
        fill="#FBBC05"
      />
      <Path
        d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58Z"
        fill="#EA4335"
      />
    </Svg>
  );
}
