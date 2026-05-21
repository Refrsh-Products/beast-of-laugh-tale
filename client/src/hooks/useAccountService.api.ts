import axios from "axios";
import createFreshrApiInstance, {
  UserServiceApiEndpoints,
} from "../services/freshr-api";
import { saveAccount, type AccountUseage } from "../storage";
import type {
  AccountService,
  OnboardingStatus,
} from "../services/account/Account.types";
import type { AccountMeResponse } from "../page/dto/AccountMeResponse.dto";
import useAxiosInterceptor from "./useAxiosInterceptor";
import { useFetch } from "./useFetch";
import { useMemo } from "react";

const useAccountServiceApi = (): AccountService => {
  const api = useMemo(() => createFreshrApiInstance(), []);
  const apiWithInterceptor = useAxiosInterceptor(api);
  const { fetchData } = useFetch(apiWithInterceptor);

  return {
    getAccount: async () => {
      const resp = await fetchData<AccountMeResponse>(UserServiceApiEndpoints.accountMe);
      const account = {
        id: resp.id,
        first_name: resp.first_name,
        last_name: resp.last_name,
        profile_picture_url: resp.profile_picture_url,
        address1: resp.address1,
        address2: resp.address2,
        city: resp.city,
        postal_code: resp.postal_code,
        phone: resp.phone,
        tier_plan: resp.tier_plan,
        billing_interval: resp.billing_interval,
        subscription_status: resp.subscription_status,
      };
      saveAccount(account);
      return { account, onboardingCompleted: resp.onboarding_completed };
    },

    saveAccount: async (account) => {
      await fetchData(UserServiceApiEndpoints.accounts, "POST", account);
      saveAccount(account);
    },

    updateAccount: async (account) => {
      await fetchData(UserServiceApiEndpoints.accountMe, "PATCH", account);
    },

    getOnboardingStatus: async (): Promise<OnboardingStatus> => {
      try {
        const response = await fetchData<AccountMeResponse>(
          UserServiceApiEndpoints.accountMe,
        );
        return response.onboarding_completed ? "complete" : "incomplete";
      } catch (err) {
        // 404 means no Account row exists — treat as not yet onboarded. Every
        // other failure (network, 5xx, timeout) is genuinely unknown, and we
        // must NOT collapse it to "incomplete" or we'll bounce already-
        // onboarded users back to the form.
        if (axios.isAxiosError(err) && err.response?.status === 404) {
          return "incomplete";
        }
        return "error";
      }
    },

    getAccountUsage: async () => {
      return await fetchData<AccountUseage>(UserServiceApiEndpoints.accountUsage);
    },
  };
};

export default useAccountServiceApi;
