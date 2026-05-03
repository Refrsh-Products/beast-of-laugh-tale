import {
  isLoggedIn,
  getUser,
  startSession,
  endSession,
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
