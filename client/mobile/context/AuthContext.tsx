import { createContext, useContext, useEffect, useState } from 'react';
import type { StoredUser } from '@freshr/shared';
import { hydrateSession, mobileSessionStore, subscribeToSession } from '@/lib/session';

interface AuthState {
  ready: boolean;
  isLoggedIn: boolean;
  user: StoredUser | null;
}

const AuthContext = createContext<AuthState | null>(null);

/**
 * Hydrates the session from SecureStore once at launch, then mirrors auth state
 * into React. The session store notifies us synchronously whenever tokens are
 * set/cleared (login, logout, failed refresh), so the route guard reacts
 * without any screen having to push it there.
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  // Bumped on every session notification to force a re-read of the store.
  const [, setTick] = useState(0);

  useEffect(() => {
    let mounted = true;
    hydrateSession().finally(() => {
      if (mounted) setReady(true);
    });
    const unsubscribe = subscribeToSession(() => setTick((t) => t + 1));
    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

  const value: AuthState = {
    ready,
    isLoggedIn: !!mobileSessionStore.getAccessToken(),
    user: mobileSessionStore.getUser(),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
