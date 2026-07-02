import axios from "axios";
import type { ServiceDeps } from "../platform/deps";
import type { AccountUsage, StoredAccount } from "../types/entities";
import type { AccountMeResponse } from "../types/dto";
import { UserServiceApiEndpoints } from "./endpoints";

// Three-state result so callers can distinguish "really not onboarded" from
// "we couldn't tell" (network blip, 5xx, timeout). The old boolean collapsed
// errors into `false`, which silently bounced verified users back to the
// onboarding form.
export type OnboardingStatus = "complete" | "incomplete" | "error";

export type AccountPatch = Partial<StoredAccount> & {
  onboarding_completed?: boolean;
};

export interface AccountFetchResult {
  account: StoredAccount;
  onboardingCompleted: boolean;
}

export interface AccountService {
  getAccount(): Promise<AccountFetchResult | null>;
  saveAccount(account: StoredAccount): Promise<void>;
  updateAccount(account: AccountPatch): Promise<void>;
  getOnboardingStatus(): Promise<OnboardingStatus>;
  getAccountUsage(): Promise<AccountUsage>;
}

export function createAccountService(deps: ServiceDeps): AccountService {
  const { http, session } = deps;

  return {
    getAccount: async () => {
      const resp = await http.request<AccountMeResponse>(
        UserServiceApiEndpoints.accountMe,
      );
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
      session.saveAccount(account);
      return { account, onboardingCompleted: resp.onboarding_completed };
    },

    saveAccount: async (account) => {
      await http.request(UserServiceApiEndpoints.accounts, "POST", account);
      session.saveAccount(account);
    },

    updateAccount: async (account) => {
      await http.request(UserServiceApiEndpoints.accountMe, "PATCH", account);
    },

    getOnboardingStatus: async (): Promise<OnboardingStatus> => {
      try {
        const response = await http.request<AccountMeResponse>(
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
      return await http.request<AccountUsage>(
        UserServiceApiEndpoints.accountUsage,
      );
    },
  };
}
