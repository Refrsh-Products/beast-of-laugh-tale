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
}
