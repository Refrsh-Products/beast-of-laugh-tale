import type { StoredUser, StoredAccount } from "../../storage";

export interface AuthService {
  isLoggedIn(): boolean;
  getUser(): StoredUser | null;
  login(email: string, password: string): Promise<StoredUser>;
  logout(): void;
  register(email: string, password: string, password_confirm: string): Promise<StoredUser>;
  getAccount(): StoredAccount | null;
  saveAccount(account: StoredAccount): Promise<void>;
  hasCompletedOnboarding(): Promise<boolean>;
}
