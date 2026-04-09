import createFreshrApiInstance, {
  UserServiceApiEndpoints,
} from "../services/freshr-api";
import { saveAccount, type AccountUseage } from "../storage";
import type { AccountService } from "../services/account/Account.types";
import type { AccountMeResponse } from "../page/dto/AccountMeResponse.dto";
import useAxiosInterceptor from "./useAxiosInterceptor";
import { useFetch } from "./useFetch";
import { useMemo } from "react";

const useAccountServiceApi = (): AccountService => {
  const api = useMemo(() => createFreshrApiInstance(), []);
  const apiWithInterceptor = useAxiosInterceptor(api);
  const { fetchData } = useFetch(apiWithInterceptor);

  return {
    getAccount: () => {
      const raw = localStorage.getItem("freshr_account");
      return raw ? JSON.parse(raw) : null;
    },

    saveAccount: async (account) => {
      try {
        await fetchData(UserServiceApiEndpoints.accounts, "POST", account);
        saveAccount(account);
        sessionStorage.setItem("freshr_onboarding_completed", "true");
      } catch (err) {
        throw err;
      }
    },

    updateAccount: async (account) => {
      try {
        const resp = await fetchData(
          UserServiceApiEndpoints.accountMe,
          "PATCH",
          account,
        );
        console.log("[useAccountServiceApi] Account Update Response: ", resp);
        saveAccount(account);
      } catch (err) {
        throw err;
      }
    },

    hasCompletedOnboarding: async () => {
      try {
        const response = await fetchData<AccountMeResponse>(
          UserServiceApiEndpoints.accountMe,
        );
        return response.onboarding_completed === true;
      } catch {
        return false;
      }
    },

    getAccountUsage: async () => {
      try {
        const response = await fetchData<AccountUseage>(
          UserServiceApiEndpoints.accountUsage,
        );
        return response;
      } catch (err) {
        throw err;
      }
    },
  };
};

export default useAccountServiceApi;
