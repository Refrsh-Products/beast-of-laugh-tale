import {
  getAccount,
  saveAccount,
  hasCompletedOnboarding,
  getNotebooks,
} from "../../storage";
import type { AccountService } from "./Account.types";

const AccountServiceMock: AccountService = {
  getAccount: async () => getAccount(),

  saveAccount: (account) => {
    saveAccount(account);
    return Promise.resolve();
  },

  updateAccount: (account) => {
    saveAccount(account);
    return Promise.resolve();
  },

  hasCompletedOnboarding: () => Promise.resolve(hasCompletedOnboarding()),

  getAccountUsage: () => {
    const notebooks = getNotebooks();
    return Promise.resolve({
      plan: "free",
      notebooks: { used: notebooks.length, limit: 3 },
      storage: { used_bytes: BigInt(0), limit_bytes: BigInt(500 * 1024 * 1024) },
      daily_quizzes: { used: 0, limit: 5 },
    });
  },
};

export default AccountServiceMock;
