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
    extra: {
      ...config.extra,
      apiBaseUrl,
    },
  };
};
