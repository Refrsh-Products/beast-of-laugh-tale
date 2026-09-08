import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import type { OnboardingStatus, StoredUser } from '@freshr/shared';
import { createAccountService } from '@freshr/shared';
import { deps } from '@/lib/deps';
import { hydrateSession, mobileSessionStore, subscribeToSession } from '@/lib/session';

/**
 * `onboarding` is "loading" until the first /accounts/me/ check resolves for a
 * logged-in user, and "unknown" while logged out (nothing to check). The route
 * guard holds navigation during "loading" so we never flash the app tabs before
 * bouncing an un-onboarded user to the form.
 */
export type OnboardingState = OnboardingStatus | 'loading' | 'unknown';

interface AuthState {
  ready: boolean;
  isLoggedIn: boolean;
  user: StoredUser | null;
  onboarding: OnboardingState;
  /** Re-check onboarding status (e.g. after submitting the form). */
  refreshOnboarding: () => Promise<void>;
  /**
   * Assert completion locally, without a round trip.
   *
   * Onboarding needs this because the route guard replaces to /notebooks the
   * instant this reads 'complete'. The form saves at the end of step 2, but the
   * user should stay on step 3 — so we hold the local state until they leave it.
   * It's also strictly safer than refreshing: we already know the PATCH returned
   * 200, whereas refreshOnboarding can resolve to 'error' on a network blip and
   * strand a fully onboarded user on the retry screen.
   */
  markOnboardingComplete: () => void;
}

const AuthContext = createContext<AuthState | null>(null);

const accountService = createAccountService(deps);

/**
 * Hydrates the session from SecureStore once at launch, then mirrors auth state
 * into React. The session store notifies us synchronously whenever tokens are
 * set/cleared (login, logout, failed refresh), so the route guard reacts
 * without any screen having to push it there.
 *
 * Onboarding status can't be read synchronously from the session (the
 * `onboarding_completed` flag isn't part of the cached account), so we fetch it
 * from /accounts/me/ whenever the user becomes logged in and expose the result.
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  // Bumped on every session notification to force a re-read of the store.
  const [, setTick] = useState(0);
  const [onboarding, setOnboarding] = useState<OnboardingState>('unknown');

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

  const isLoggedIn = !!mobileSessionStore.getAccessToken();

  const refreshOnboarding = useCallback(async () => {
    if (!mobileSessionStore.getAccessToken()) {
      setOnboarding('unknown');
      return;
    }
    setOnboarding('loading');
    const status = await accountService.getOnboardingStatus();
    // Guard against a logout that landed mid-flight.
    if (mobileSessionStore.getAccessToken()) {
      setOnboarding(status);
    } else {
      setOnboarding('unknown');
    }
  }, []);

  // Fetch (or reset) onboarding status whenever the login state flips. Keyed off
  // a ref so we only refetch on an actual transition, not every session tick.
  const wasLoggedIn = useRef<boolean | null>(null);
  useEffect(() => {
    if (!ready) return;
    if (wasLoggedIn.current === isLoggedIn) return;
    wasLoggedIn.current = isLoggedIn;
    if (isLoggedIn) {
      void refreshOnboarding();
    } else {
      setOnboarding('unknown');
    }
  }, [ready, isLoggedIn, refreshOnboarding]);

  const markOnboardingComplete = useCallback(() => setOnboarding('complete'), []);

  const value: AuthState = {
    ready,
    isLoggedIn,
    user: mobileSessionStore.getUser(),
    onboarding,
    refreshOnboarding,
    markOnboardingComplete,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
