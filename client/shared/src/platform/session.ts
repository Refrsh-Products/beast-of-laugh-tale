import type { StoredUser, StoredAccount } from "../types/entities";

export interface SessionTokens {
  access: string;
  refresh: string;
}

/**
 * Session + profile persistence the auth/account services rely on.
 *
 * Kept synchronous to match the web implementation (session/localStorage) and
 * to avoid changing service method signatures (callers invoke `isLoggedIn()` /
 * `getUser()` synchronously). On mobile this is backed by an in-memory mirror
 * hydrated from SecureStore at launch, with async write-through.
 *
 * The web adapter implements tokens/identity over the existing `sessionStorage`
 * keys (`accessToken`, `refreshToken`, `userId`, `email`) so the axios
 * interceptor and Google sign-in button keep interoperating unchanged.
 */
export interface SessionStore {
  // JWT tokens
  getAccessToken(): string | null;
  getRefreshToken(): string | null;
  setTokens(tokens: SessionTokens): void;
  clearTokens(): void;

  // lightweight identity hints persisted alongside the tokens
  setIdentity(userId: string, email: string): void;
  clearIdentity(): void;

  // cached user profile
  getUser(): StoredUser | null;
  saveUser(user: StoredUser): void;
  clearUser(): void;

  // cached account profile
  getAccount(): StoredAccount | null;
  saveAccount(account: StoredAccount): void;
  clearAccount(): void;

  // logical "is signed in" flag (distinct from token presence)
  startSession(): void;
  endSession(): void;
}
