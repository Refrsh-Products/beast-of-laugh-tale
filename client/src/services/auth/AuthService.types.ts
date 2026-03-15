import type { StoredUser } from "../../storage";

export interface AuthService {
  isLoggedIn(): boolean;
  getUser(): StoredUser | null;
  login(email: string, password: string): Promise<StoredUser>;
  logout(): void;
  register(
    email: string,
    password: string,
    password_confirm: string,
  ): Promise<StoredUser>;
  requestPasswordReset(email: string): void;
  resetPassword(
    uid: string,
    token: string,
    new_password: string,
    new_password_confirm: string,
  ): void;
}
