import createFreshrApiInstance, {
  AuthServiceApiEndpoints,
} from "../services/freshr-api";
import { saveUser, endSession, startSession, savePassword } from "../storage";
import type { AuthService } from "../services/auth/AuthService.types";
import type { StoredUser } from "../storage";
import type { LoginResponse } from "../page/dto/LoginResponse.dto";
import type { LoginRequest } from "../page/dto/LoginRequest.dto";
import useAxiosInterceptor from "./useAxiosInterceptor";
import { useFetch } from "./useFetch";
import type { RegistrationResponse } from "../page/dto/RegistrationResponse.dto";

const useAuthServiceApi = (): AuthService => {
  const api = createFreshrApiInstance();
  const apiWithInterceptor = useAxiosInterceptor(api, false);
  const { fetchData } = useFetch(apiWithInterceptor);

  return {
    isLoggedIn: () => !!sessionStorage.getItem("accessToken"),

    getUser: () => {
      const raw = localStorage.getItem("freshr_user");
      return raw ? JSON.parse(raw) : null;
    },

    login: async (email, password) => {
      try {
        const response = await fetchData<LoginResponse>(
          AuthServiceApiEndpoints.login,
          "POST",
          { email, password } as LoginRequest,
        );
        const data = response;

        sessionStorage.setItem("accessToken", data.tokens.access ?? "");
        sessionStorage.setItem("refreshToken", data.tokens.refresh ?? "");
        sessionStorage.setItem("userPlan", data.user.tier_plan ?? "");
        sessionStorage.setItem("userId", data.user.id ?? "");
        sessionStorage.setItem("email", data.user.email ?? "");

        const user: StoredUser = {
          id: data.user.id,
          email: data.user.email,
          tier_plan: data.user.tier_plan as "FREE" | "MONTHLY" | "YEARLY",
          is_active: data.user.is_active,
          created_at: data.user.created_at,
        };
        saveUser(user);
        startSession();
        return user;
      } catch (err) {
        console.error("[AuthServiceApi] Login failed:", err);
        throw err;
      }
    },

    logout: async () => {
      const refreshToken = sessionStorage.getItem("refreshToken");
      try {
        const response = await fetchData(
          AuthServiceApiEndpoints.logout,
          "POST",
          {
            refresh_token: refreshToken,
          },
        );
        console.log("[AuthServiceApi] Logout request response:", response);
      } catch (err) {
        console.error("[AuthServiceApi] Logout request failed:", err);
      } finally {
        sessionStorage.removeItem("accessToken");
        sessionStorage.removeItem("refreshToken");
        sessionStorage.removeItem("userPlan");
        sessionStorage.removeItem("userId");
        sessionStorage.removeItem("email");
        endSession();
      }
    },

    register: async (email, password, password_confirm) => {
      try {
        const response = await fetchData<RegistrationResponse>(
          AuthServiceApiEndpoints.register,
          "POST",
          {
            email: email,
            password: password,
            password_confirm: password_confirm,
          },
        );
        const data = response;

        sessionStorage.setItem("accessToken", data.tokens.access ?? "");
        sessionStorage.setItem("refreshToken", data.tokens.refresh ?? "");
        sessionStorage.setItem("userPlan", data.user.tier_plan ?? "");
        sessionStorage.setItem("userId", data.user.id ?? "");
        sessionStorage.setItem("email", data.user.email ?? "");

        const user: StoredUser = {
          id: data.user.id,
          email: data.user.email,
          tier_plan: data.user.tier_plan as "FREE" | "MONTHLY" | "YEARLY",
          is_active: data.user.is_active,
          created_at: data.user.created_at,
        };
        saveUser(user);
        savePassword(password);
        startSession();
        return user;
      } catch (err: any) {
        if (err.response?.data) {
          const data = err.response.data;
          const messages = Object.entries(data).flatMap(([key, val]) => {
            const items = Array.isArray(val) ? val : [val];
            return items.map((v) =>
              key === "non_field_errors" ? String(v) : `${key}: ${String(v)}`,
            );
          });
          throw new Error(messages.join("\n"));
        }
        throw err;
      }
    },

    getAccount: () => {
      const raw = localStorage.getItem("freshr_account");
      return raw ? JSON.parse(raw) : null;
    },

    saveAccount: async (account) => {
      localStorage.setItem("freshr_account", JSON.stringify(account));
    },

    hasCompletedOnboarding: () => {
      return localStorage.getItem("freshr_account") !== null;
    },
  };
};

export default useAuthServiceApi;
