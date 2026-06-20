import { createAccountService, type AccountService } from '@freshr/shared';
import { useMemo } from 'react';
import { deps } from '@/lib/deps';

/**
 * The shared `AccountService`, wired to the mobile platform adapter. Like the
 * other service hooks, `deps` is a singleton so this is a stable reference;
 * `useMemo` keeps the service identity stable across renders.
 */
export function useAccountService(): AccountService {
  return useMemo(() => createAccountService(deps), []);
}
