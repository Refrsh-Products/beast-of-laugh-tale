import { useMemo } from 'react';
import { createAuthService, type AuthService } from '@freshr/shared';
import { deps } from '@/lib/deps';

/**
 * The shared `AuthService`, wired to the mobile platform adapter. `deps` is a
 * singleton, so this is effectively a stable reference; `useMemo` keeps the
 * service identity stable across renders for effect dependency arrays.
 */
export function useAuthService(): AuthService {
  return useMemo(() => createAuthService(deps), []);
}
