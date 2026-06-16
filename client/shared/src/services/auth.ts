import type { ServiceDeps } from "../platform/deps";
import type { StoredUser, StoredAccount } from "../types/entities";
import type {
  LoginRequest,
  LoginResponse,
  RegistrationResponse,
  AccountMeResponse,
} from "../types/dto";
import { AuthServiceApiEndpoints, UserServiceApiEndpoints } from "./endpoints";

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

export function createAuthService(deps: ServiceDeps): AuthService {
  const { http, session } = deps;

  return {
    isLoggedIn: () => !!session.getAccessToken(),

    getUser: () => session.getUser(),

    login: async (email, password) => {
      try {
        const data = await http.request<LoginResponse>(
          AuthServiceApiEndpoints.login,
          "POST",
          { email, password } as LoginRequest,
        );

        session.setTokens({
          access: data.tokens.access ?? "",
          refresh: data.tokens.refresh ?? "",
        });
        session.setIdentity(data.user.id ?? "", data.user.email ?? "");

        // Eagerly cache the profile so the dashboard can render header/sidebar
        // without a second round-trip. The onboarding flag itself is read from
        // /accounts/me/ on each page mount (so it's never stale).
        try {
          const accountResp = await http.request<AccountMeResponse>(
            UserServiceApiEndpoints.accountMe,
            "GET",
            null,
            { headers: { Authorization: `Bearer ${data.tokens.access}` } },
          );
          const account: StoredAccount = {
            id: accountResp.id,
            first_name: accountResp.first_name,
            last_name: accountResp.last_name,
            profile_picture_url: accountResp.profile_picture_url,
            address1: accountResp.address1,
            address2: accountResp.address2 ?? "",
            city: accountResp.city,
            postal_code: accountResp.postal_code,
            phone: accountResp.phone,
            tier_plan: accountResp.tier_plan,
            billing_interval: accountResp.billing_interval,
            subscription_status: accountResp.subscription_status,
          };
          session.saveAccount(account);
        } catch (err) {
          console.error("[AuthService] Failed to fetch account: ", err);
        }

        const user: StoredUser = {
          id: data.user.id,
          email: data.user.email,
          is_active: data.user.is_active,
          created_at: data.user.created_at,
        };
        session.saveUser(user);
        session.startSession();
        return user;
      } catch (err: any) {
        // Backend returns 403 with needs_verification:true when credentials are
        // correct but the email hasn't been verified yet. Surface this as a
        // typed error so the LoginPage can offer "resend verification".
        if (
          err.response?.status === 403 &&
          err.response?.data?.needs_verification
        ) {
          throw new NeedsVerificationError(email);
        }
        console.error("[AuthService] Login failed: ", err);
        throw err;
      }
    },

    logout: async () => {
      const refreshToken = session.getRefreshToken();
      const accessToken = session.getAccessToken();
      try {
        const response = await http.request(
          AuthServiceApiEndpoints.logout,
          "POST",
          { refresh_token: refreshToken },
          { headers: { Authorization: `Bearer ${accessToken}` } },
        );
        console.log("[AuthService] Logout request response:", response);
      } catch (err) {
        console.error("[AuthService] Logout request failed:", err);
      } finally {
        session.clearTokens();
        session.clearIdentity();
        session.clearAccount();
        session.clearUser();
        session.endSession();
      }
    },

    register: async (email, password, password_confirm) => {
      // The backend creates the account with is_active=false and emails a
      // verification link. JWT tokens are issued by confirmEmailVerification.
      try {
        await http.request<RegistrationResponse>(
          AuthServiceApiEndpoints.register,
          "POST",
          {
            email: email,
            password: password,
            password_confirm: password_confirm,
          },
        );
        // Cache the password so the mock auth flow keeps working in dev; the
        // real flow doesn't depend on it post-verification.
        session.savePassword(password);
      } catch (err: any) {
        if (err.response?.data) {
          const data = err.response.data;
          const messages = Object.entries(data).flatMap(([key, val]) => {
            const items = Array.isArray(val) ? val : [val];
            return items.map((v) =>
              key === "non_field_errors" ? String(v) : `${key}: ${String(v)}`,
            );
          });
          throw new Error(messages.join("\n"));
        }
        throw err;
      }
    },

    requestEmailVerification: async (email) => {
      // 429 is a rate-limit from the backend (ScopedRateThrottle). Let it
      // bubble up so the UI can surface a "try again later" message.
      await http.request(AuthServiceApiEndpoints.verifyEmail, "POST", { email });
    },

    confirmEmailVerification: async (uid, token) => {
      const data = await http.request<LoginResponse>(
        AuthServiceApiEndpoints.verifyEmailConfirm,
        "POST",
        { uid, token },
      );

      session.setTokens({
        access: data.tokens.access ?? "",
        refresh: data.tokens.refresh ?? "",
      });
      session.setIdentity(data.user.id ?? "", data.user.email ?? "");

      const user: StoredUser = {
        id: data.user.id,
        email: data.user.email,
        is_active: data.user.is_active,
        created_at: data.user.created_at,
      };
      session.saveUser(user);
      session.startSession();
      return user;
    },

    requestPasswordReset: async (email) => {
      await http.request(AuthServiceApiEndpoints.resetPassword, "POST", {
        email: email,
      });
    },

    resetPassword: async (uid, token, new_password, new_password_confirm) => {
      const resp = await http.request(
        AuthServiceApiEndpoints.resetPasswordConfirm,
        "POST",
        {
          uid: uid,
          token: token,
          new_password: new_password,
          new_password_confirm: new_password_confirm,
        },
      );
      console.log("[AuthService] Confirm Reset Password Response: ", resp);
    },
  };
}
