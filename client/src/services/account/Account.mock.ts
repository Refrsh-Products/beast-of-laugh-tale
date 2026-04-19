import {
  getAccount,
  saveAccount,
  hasCompletedOnboarding,
} from "../../storage";
import type { AccountService } from "./Account.types";

const AccountServiceMock: AccountService = {
  getAccount: () => getAccount(),

  saveAccount: (account) => {
    saveAccount(account);
    return Promise.resolve();
  },

  updateAccount: (account) => {
    saveAccount(account);
    return Promise.resolve();
  },

  hasCompletedOnboarding: () => Promise.resolve(hasCompletedOnboarding()),

  getAccountUsage: () =>
    Promise.resolve({
      plan: "free",
      notebooks: { used: 0, limit: 3 },
      storage: { used_bytes: BigInt(0), limit_bytes: BigInt(500 * 1024 * 1024) },
      daily_quizzes: { used: 0, limit: 5 },
    }),
};

export default AccountServiceMock;
