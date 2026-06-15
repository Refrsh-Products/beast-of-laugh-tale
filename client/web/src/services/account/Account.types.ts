import type { AccountUseage, StoredAccount } from "../../storage";

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
  getAccountUsage(): Promise<AccountUseage>;
}
