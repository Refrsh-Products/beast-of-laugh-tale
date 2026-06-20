import type { ServiceDeps } from '@freshr/shared';
import { appConfig } from './config';
import { mobileHttpClient } from './http';
import { mobileSessionStore } from './session';
import { mobileStreamClient } from './stream';

/**
 * The platform adapter (`ServiceDeps`) the shared service factories expect,
 * assembled from the mobile axios client, SecureStore-backed session store,
 * Expo env config, and (stubbed) stream client. Singleton — the axios instance
 * and session mirror are module-level, so there's no per-render wiring as on
 * web; screens build their service once via `createXService(deps)`.
 */
export const deps: ServiceDeps = {
  http: mobileHttpClient,
  session: mobileSessionStore,
  config: appConfig,
  stream: mobileStreamClient,
};
