import axios from "axios";
import type { ServiceDeps } from "../platform/deps";
import type { AccountUsage, StoredAccount } from "../types/entities";
import type { AccountMeResponse } from "../types/dto";
import { toStoredAccount } from "./accountMapping";
import { UserServiceApiEndpoints } from "./endpoints";

// Three-state result so callers can distinguish "really not onboarded" from
// "we couldn't tell" (network blip, 5xx, timeout). The old boolean collapsed
// errors into `false`, which silently bounced verified users back to the
// onboarding form.
export type OnboardingStatus = "complete" | "incomplete" | "error";

export type AccountPatch = Partial<StoredAccount> & {
  onboarding_completed?: boolean;
};

/**
 * The optional WhatsApp community invite.
 *
 * No API — Meta's or anyone else's — can add a person to a WhatsApp group, so
 * the whole feature is a link the user chooses to open. `opted_in_at` records
 * that they tapped Join; it is never proof of membership, and we never learn if
 * they leave. Copy must say so.
 */
export interface CommunityStatus {
  /** Already folded together with the invite link server-side: true means the
   *  community is on AND there is a URL to open. The only flag a client checks. */
  enabled: boolean;
  /** "" whenever `enabled` is false. */
  invite_url: string;
  headline: string;
  message: string;
  opted_in_at: string | null;
}

export const COMMUNITY_OFF: CommunityStatus = {
  enabled: false,
  invite_url: "",
  headline: "",
  message: "",
  opted_in_at: null,
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
  /** Never rejects — see the implementation. */
  getCommunity(): Promise<CommunityStatus>;
  joinCommunity(): Promise<CommunityStatus>;
  leaveCommunity(): Promise<CommunityStatus>;
}

export function createAccountService(deps: ServiceDeps): AccountService {
  const { http, session } = deps;

  return {
    getAccount: async () => {
      const resp = await http.request<AccountMeResponse>(
        UserServiceApiEndpoints.accountMe,
      );
      const account = toStoredAccount(resp);
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

    getCommunity: async (): Promise<CommunityStatus> => {
      // Deliberately total: every failure — offline, 5xx, timeout, a server
      // that predates this endpoint — becomes "no community". The only question
      // a caller ever asks is "show the community step?", and the safe answer to
      // not knowing is no. This is what makes "the community step can never
      // block onboarding" true by construction rather than by remembering to
      // catch at each call site.
      try {
        return await http.request<CommunityStatus>(
          UserServiceApiEndpoints.accountCommunity,
          "GET",
          null,
          // Below both adapters' defaults, so a hung socket can't stall the
          // step 2 → step 3 transition behind a spinner.
          { timeout: 8000 },
        );
      } catch {
        return COMMUNITY_OFF;
      }
    },

    joinCommunity: async () => {
      return await http.request<CommunityStatus>(
        UserServiceApiEndpoints.accountCommunity,
        "POST",
      );
    },

    leaveCommunity: async () => {
      return await http.request<CommunityStatus>(
        UserServiceApiEndpoints.accountCommunity,
        "DELETE",
      );
    },
  };
}
