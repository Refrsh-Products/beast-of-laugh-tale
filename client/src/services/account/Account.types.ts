import type { AccountUseage, StoredAccount } from "../../storage";

export interface AccountService {
  getAccount(): Promise<StoredAccount | null>;
  saveAccount(account: StoredAccount): Promise<void>;
  updateAccount(account: StoredAccount): Promise<void>;
  hasCompletedOnboarding(): Promise<boolean>;
  getAccountUsage(): Promise<AccountUseage>;
}
