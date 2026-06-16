/**
 * Runtime configuration injected by each platform. The base URL must never be
 * read from `import.meta.env` (Vite-only) inside shared code — web reads it
 * from Vite env, mobile from `process.env.EXPO_PUBLIC_*`, and both pass it in.
 */
export interface AppConfig {
  apiBaseUrl: string;
}
