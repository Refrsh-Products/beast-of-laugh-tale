import {
  isLoggedIn,
  getUser,
  startSession,
  endSession,
  getAccount,
  saveAccount,
  hasCompletedOnboarding,
  getPassword,
} from "../../storage";
import type { AuthService } from "./AuthService.types";

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
    console.log("please implement this when you need to work with it.");
  },

  getAccount: () => getAccount(),

  saveAccount: (account) => {
    saveAccount(account);
    return Promise.resolve();
  },

  hasCompletedOnboarding: () => hasCompletedOnboarding(),
};

export default AuthServiceMock;
