import createFreshrApiInstance, {
  AuthServiceApiEndpoints,
  UserServiceApiEndpoints,
} from "../services/freshr-api";
import {
  saveUser,
  endSession,
  startSession,
  savePassword,
  saveAccount,
} from "../storage";
import type { AuthService } from "../services/auth/AuthService.types";
import type { StoredAccount, StoredUser } from "../storage";
import type { LoginResponse } from "../page/dto/LoginResponse.dto";
import type { LoginRequest } from "../page/dto/LoginRequest.dto";
import useAxiosInterceptor from "./useAxiosInterceptor";
import { useFetch } from "./useFetch";
import type { RegistrationResponse } from "../page/dto/RegistrationResponse.dto";
import type { AccountMeResponse } from "../page/dto/AccountMeResponse.dto";
import { useMemo } from "react";

// saveAccount is used during login to eagerly cache the profile in localStorage

const useAuthServiceApi = (): AuthService => {
  const api = useMemo(() => createFreshrApiInstance(), []);
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
        sessionStorage.setItem("userId", data.user.id ?? "");
        sessionStorage.setItem("email", data.user.email ?? "");

        try {
          const accountResp = await fetchData<AccountMeResponse>(
            UserServiceApiEndpoints.accountMe,
            "GET",
            null,
            { headers: { Authorization: `Bearer ${data.tokens.access}` } },
          );
          sessionStorage.setItem(
            "freshr_onboarding_completed",
            String(accountResp.onboarding_completed),
          );
          const account: StoredAccount = {
            id: accountResp.id,
            first_name: accountResp.first_name,
            last_name: accountResp.last_name,
            profile_picture_url: accountResp.profile_picture_url,
            address1: accountResp.address1,
            address2: accountResp.address2 ?? "",
            city: accountResp.city,
            postal_code: accountResp.postal_code,
            phone: accountResp.phone,
            tier_plan: accountResp.tier_plan,
          };
          saveAccount(account);
        } catch (err) {
          console.error("[AuthServiceApi] Failed to fetch account: ", err);
          sessionStorage.setItem("freshr_onboarding_completed", "false");
        }

        const user: StoredUser = {
          id: data.user.id,
          email: data.user.email,
          is_active: data.user.is_active,
          created_at: data.user.created_at,
        };
        saveUser(user);
        startSession();
        return user;
      } catch (err) {
        console.error("[AuthServiceApi] Login failed: ", err);
        throw err;
      }
    },

    logout: async () => {
      const refreshToken = sessionStorage.getItem("refreshToken");
      const accessToken = sessionStorage.getItem("accessToken");
      try {
        const response = await fetchData(
          AuthServiceApiEndpoints.logout,
          "POST",
          {
            refresh_token: refreshToken,
          },
          { headers: { Authorization: `Bearer ${accessToken}` } },
        );
        console.log("[AuthServiceApi] Logout request response:", response);
      } catch (err) {
        console.error("[AuthServiceApi] Logout request failed:", err);
      } finally {
        sessionStorage.removeItem("accessToken");
        sessionStorage.removeItem("refreshToken");
        sessionStorage.removeItem("userId");
        sessionStorage.removeItem("email");
        sessionStorage.removeItem("freshr_onboarding_completed");
        localStorage.removeItem("freshr_account");
        localStorage.removeItem("freshr_user");
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
        sessionStorage.setItem("userId", data.user.id ?? "");
        sessionStorage.setItem("email", data.user.email ?? "");
        sessionStorage.setItem("freshr_onboarding_completed", "false");

        const user: StoredUser = {
          id: data.user.id,
          email: data.user.email,
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
  };
};

export default useAuthServiceApi;
