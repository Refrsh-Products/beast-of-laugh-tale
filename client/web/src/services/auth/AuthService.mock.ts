import {
  isLoggedIn,
  getUser,
  saveUser,
  startSession,
  endSession,
} from "../../storage";
import type { AuthService } from "@freshr/shared";

// Auto-seed dev session so login is never required in mock mode
if (!isLoggedIn() || !getUser()) {
  saveUser({
    id: "dev-user",
    email: "dev@freshr.com",
    is_active: true,
    created_at: new Date().toISOString(),
  });
  startSession();
}

const AuthServiceMock: AuthService = {
  isLoggedIn: () => isLoggedIn(),

  getUser: () => getUser(),

  login: (email) => {
    // Mock mode: accept the auto-seeded dev user by email (no password store).
    const storedUser = getUser();
    if (storedUser && storedUser.email === email) {
      startSession();
      return Promise.resolve(storedUser);
    }
    return Promise.reject(new Error("Incorrect email or password."));
  },

  googleLogin: () => {
    return Promise.reject(new Error("Not implemented"));
  },

  logout: () => {
    endSession();
    return Promise.resolve();
  },

  register: () => {
    return Promise.reject(new Error("Not implemented"));
  },

  requestEmailVerification: () => {
    return Promise.reject(new Error("Not implemented"));
  },

  confirmEmailVerification: () => {
    return Promise.reject(new Error("Not implemented"));
  },

  requestPasswordReset: () => {
    return Promise.reject(new Error("Not implemented"))
  },

  resetPassword: () => {
    return Promise.reject(new Error("Not implemented"));
  },
};

export default AuthServiceMock;
