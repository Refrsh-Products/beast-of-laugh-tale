import * as SecureStore from 'expo-secure-store';
import type { SessionStore, StoredUser, StoredAccount } from '@freshr/shared';

/**
 * Mobile implementation of the shared `SessionStore` port.
 *
 * The shared services call the store synchronously (`isLoggedIn()`,
 * `getAccessToken()`), but SecureStore is async-only. We bridge that with an
 * in-memory mirror that is the synchronous source of truth: `hydrate()` loads
 * it from SecureStore once at launch, and every setter updates memory first
 * then writes through to SecureStore (fire-and-forget, errors logged).
 *
 * A small subscriber set lets non-React code (the axios refresh interceptor)
 * notify the React tree when auth state changes — e.g. when a failed refresh
 * clears the tokens and the app must drop back to the login stack.
 */

const Keys = {
  access: 'accessToken',
  refresh: 'refreshToken',
  userId: 'userId',
  email: 'email',
  user: 'user',
  account: 'account',
  sessionActive: 'sessionActive',
} as const;

interface MemoryState {
  access: string | null;
  refresh: string | null;
  userId: string | null;
  email: string | null;
  user: StoredUser | null;
  account: StoredAccount | null;
  sessionActive: boolean;
}

const memory: MemoryState = {
  access: null,
  refresh: null,
  userId: null,
  email: null,
  user: null,
  account: null,
  sessionActive: false,
};

type Listener = () => void;
const listeners = new Set<Listener>();

/** Subscribe to auth-state changes (token set/clear, session start/end). */
export function subscribeToSession(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function notify() {
  listeners.forEach((l) => l());
}

async function setItem(key: string, value: string | null) {
  try {
    if (value === null) {
      await SecureStore.deleteItemAsync(key);
    } else {
      await SecureStore.setItemAsync(key, value);
    }
  } catch (err) {
    console.error(`[session] Failed to persist "${key}":`, err);
  }
}

function parseJson<T>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch (err) {
    console.error('[session] Failed to parse stored JSON:', err);
    return null;
  }
}

/**
 * Load the in-memory mirror from SecureStore. Must be awaited once at app
 * launch before any screen reads the session (see AuthProvider).
 */
export async function hydrateSession(): Promise<void> {
  const [access, refresh, userId, email, user, account, sessionActive] =
    await Promise.all([
      SecureStore.getItemAsync(Keys.access),
      SecureStore.getItemAsync(Keys.refresh),
      SecureStore.getItemAsync(Keys.userId),
      SecureStore.getItemAsync(Keys.email),
      SecureStore.getItemAsync(Keys.user),
      SecureStore.getItemAsync(Keys.account),
      SecureStore.getItemAsync(Keys.sessionActive),
    ]);

  memory.access = access;
  memory.refresh = refresh;
  memory.userId = userId;
  memory.email = email;
  memory.user = parseJson<StoredUser>(user);
  memory.account = parseJson<StoredAccount>(account);
  memory.sessionActive = sessionActive === 'true';

  // Purge any plaintext password persisted by older builds.
  void SecureStore.deleteItemAsync('password');
}

export const mobileSessionStore: SessionStore = {
  getAccessToken: () => memory.access,
  getRefreshToken: () => memory.refresh,
  setTokens: ({ access, refresh }) => {
    memory.access = access;
    memory.refresh = refresh;
    void setItem(Keys.access, access);
    void setItem(Keys.refresh, refresh);
    notify();
  },
  clearTokens: () => {
    memory.access = null;
    memory.refresh = null;
    void setItem(Keys.access, null);
    void setItem(Keys.refresh, null);
    notify();
  },

  setIdentity: (userId, email) => {
    memory.userId = userId;
    memory.email = email;
    void setItem(Keys.userId, userId);
    void setItem(Keys.email, email);
  },
  clearIdentity: () => {
    memory.userId = null;
    memory.email = null;
    void setItem(Keys.userId, null);
    void setItem(Keys.email, null);
  },

  getUser: () => memory.user,
  saveUser: (user) => {
    memory.user = user;
    void setItem(Keys.user, JSON.stringify(user));
  },
  clearUser: () => {
    memory.user = null;
    void setItem(Keys.user, null);
  },

  getAccount: () => memory.account,
  saveAccount: (account) => {
    memory.account = account;
    void setItem(Keys.account, JSON.stringify(account));
  },
  clearAccount: () => {
    memory.account = null;
    void setItem(Keys.account, null);
  },

  startSession: () => {
    memory.sessionActive = true;
    void setItem(Keys.sessionActive, 'true');
    notify();
  },
  endSession: () => {
    memory.sessionActive = false;
    void setItem(Keys.sessionActive, null);
    notify();
  },
};
