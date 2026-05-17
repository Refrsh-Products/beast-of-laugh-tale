import type { StoredUser } from "../../storage";

export class NeedsVerificationError extends Error {
  readonly needsVerification = true as const;
  readonly email: string;
  constructor(email: string) {
    super("Please verify your email before logging in.");
    this.name = "NeedsVerificationError";
    this.email = email;
  }
}

export interface AuthService {
  isLoggedIn(): boolean;
  getUser(): StoredUser | null;
  login(email: string, password: string): Promise<StoredUser>;
  logout(): void;
  register(
    email: string,
    password: string,
    password_confirm: string,
  ): Promise<void>;
  requestEmailVerification(email: string): Promise<void>;
  confirmEmailVerification(uid: string, token: string): Promise<StoredUser>;
  requestPasswordReset(email: string): void;
  resetPassword(
    uid: string,
    token: string,
    new_password: string,
    new_password_confirm: string,
  ): void;
}
