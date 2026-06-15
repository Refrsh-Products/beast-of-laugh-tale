import {
  getAccount,
  saveAccount,
  hasCompletedOnboarding,
  getNotebooks,
} from "../../storage";
import type { AccountService, OnboardingStatus } from "@freshr/shared";

const AccountServiceMock: AccountService = {
  getAccount: async () => {
    const account = getAccount();
    if (!account) return null;
    return { account, onboardingCompleted: hasCompletedOnboarding() };
  },

  saveAccount: (account) => {
    saveAccount(account);
    return Promise.resolve();
  },

  updateAccount: (account) => {
    const current = getAccount();
    if (current) saveAccount({ ...current, ...account } as typeof current);
    return Promise.resolve();
  },

  getOnboardingStatus: (): Promise<OnboardingStatus> =>
    Promise.resolve(hasCompletedOnboarding() ? "complete" : "incomplete"),

  getAccountUsage: () => {
    const notebooks = getNotebooks();
    return Promise.resolve({
      plan: "free",
      notebooks: { used: notebooks.length, limit: 3 },
      storage: {
        used_bytes: BigInt(0),
        limit_bytes: BigInt(500 * 1024 * 1024),
      },
      daily_quizzes: { used: 0, limit: 5 },
presentations: { used: 0, limit: 2 },
    });
  },
};

export default AccountServiceMock;
