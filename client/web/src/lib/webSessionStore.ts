import type { SessionStore } from "@freshr/shared";
import {
  getUser,
  saveUser,
  clearUser,
  getAccount,
  saveAccount,
  clearAccount,
  startSession,
  endSession,
  getPassword,
  savePassword,
} from "../storage";

/**
 * Web implementation of the shared `SessionStore` port. Tokens + identity live
 * in `sessionStorage` under the same keys the axios interceptor and Google
 * sign-in button use; user/account/password caches delegate to `storage.ts`
 * (localStorage). Mobile will provide a SecureStore-backed equivalent.
 */
export const webSessionStore: SessionStore = {
  getAccessToken: () => sessionStorage.getItem("accessToken"),
  getRefreshToken: () => sessionStorage.getItem("refreshToken"),
  setTokens: ({ access, refresh }) => {
    sessionStorage.setItem("accessToken", access);
    sessionStorage.setItem("refreshToken", refresh);
  },
  clearTokens: () => {
    sessionStorage.removeItem("accessToken");
    sessionStorage.removeItem("refreshToken");
  },
  setIdentity: (userId, email) => {
    sessionStorage.setItem("userId", userId);
    sessionStorage.setItem("email", email);
  },
  clearIdentity: () => {
    sessionStorage.removeItem("userId");
    sessionStorage.removeItem("email");
  },
  getUser,
  saveUser,
  clearUser,
  getAccount,
  saveAccount,
  clearAccount,
  startSession,
  endSession,
  getPassword,
  savePassword,
};
