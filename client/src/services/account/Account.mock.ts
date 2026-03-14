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

  hasCompletedOnboarding: () => Promise.resolve(hasCompletedOnboarding()),
};

export default AccountServiceMock;
