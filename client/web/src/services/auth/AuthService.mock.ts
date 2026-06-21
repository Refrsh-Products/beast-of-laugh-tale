import {
  isLoggedIn,
  getUser,
  saveUser,
  startSession,
  endSession,
  getPassword,
  getAccount,
  saveAccount,
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
if (!getAccount()) {
  saveAccount({
    id: "dev-account",
    first_name: "Dev",
    last_name: "User",
    phone: "",
    address1: "",
    city: "",
    postal_code: "",
    tier_plan: "free",
    billing_interval: null,
    subscription_status: "active",
  });
}

const AuthServiceMock: AuthService = {
  isLoggedIn: () => isLoggedIn(),

  getUser: () => getUser(),

  login: (email, password) => {
    const storedPassword = getPassword();
    const storedUser = getUser();
    if (
      storedUser &&
      storedUser.email === email &&
      storedPassword === password
    ) {
      startSession();
      return Promise.resolve(storedUser);
    }
    return Promise.reject(new Error("Incorrect email or password."));
  },

  logout: () => endSession(),

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
