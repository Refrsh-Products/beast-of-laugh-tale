import { type AppConfig } from '@freshr/shared';
import Constants from 'expo-constants';

const apiBaseUrl = Constants.expoConfig?.extra?.apiBaseUrl as string | undefined;

if (!apiBaseUrl) {
  throw new Error('apiBaseUrl missing from expoConfig.extra — check app.config.ts');
}

export const appConfig: AppConfig = { apiBaseUrl };

const extra = Constants.expoConfig?.extra ?? {};

/**
 * Google OAuth client IDs, per platform, surfaced from `app.config.ts` (which
 * reads them from `EXPO_PUBLIC_GOOGLE_*` env). When none are set the Google
 * sign-in button hides itself rather than failing at prompt time.
 */
export const googleAuthConfig = {
  iosClientId: extra.googleIosClientId as string | undefined,
  androidClientId: extra.googleAndroidClientId as string | undefined,
  webClientId: extra.googleWebClientId as string | undefined,
};

export const isGoogleAuthConfigured =
  !!googleAuthConfig.iosClientId ||
  !!googleAuthConfig.androidClientId ||
  !!googleAuthConfig.webClientId;
