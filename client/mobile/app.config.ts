import type { ConfigContext, ExpoConfig } from 'expo/config';

const API_BASE_URL: Record<string, string> = {
  development: 'http://localhost:8000',
  preview: 'https://staging.freshr.cc/api',
  production: 'https://freshr.cc/api',
};

export default ({ config }: ConfigContext): ExpoConfig => {
  // EAS sets EAS_BUILD_PROFILE during cloud builds; local dev → 'development'.
  const profile = process.env.EAS_BUILD_PROFILE ?? 'development';

  const apiBaseUrl =
    process.env.EXPO_PUBLIC_API_BASE_URL ?? API_BASE_URL[profile] ?? API_BASE_URL.development;

  return {
    ...config,
    name: config.name ?? 'Freshr',
    slug: config.slug ?? 'freshr',
    plugins: [...(config.plugins ?? []), 'expo-secure-store', 'expo-web-browser', 'expo-sharing'],
    extra: {
      ...config.extra,
      apiBaseUrl,
      // Google OAuth client IDs (per platform). Set via EXPO_PUBLIC_GOOGLE_*;
      // when none are set the Google sign-in button hides itself.
      googleIosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
      googleAndroidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
      googleWebClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
    },
  };
};
