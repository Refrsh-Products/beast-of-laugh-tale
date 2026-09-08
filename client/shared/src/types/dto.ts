/**
 * Request/response DTOs for the auth + account endpoints.
 * Moved out of `web/src/page/dto/`; the old files now re-export from here.
 */

import type { YearOfStudy } from "./entities";

export interface LoginRequest {
  email: string;
  password: string;
}

export interface User {
  id: string;
  email: string;
  is_active: boolean;
  created_at: string;
}

export interface LoginResponse {
  user: User;
  tokens: {
    refresh: string;
    access: string;
  };
}

export interface RegistrationResponse {
  message: string;
}

export interface AccountMeResponse {
  id: string;
  first_name: string;
  last_name: string;
  profile_picture_url: string;
  address1: string;
  address2: string;
  city: string;
  postal_code: string;
  phone: string;
  university: string;
  year_of_study: YearOfStudy | "";
  tier_plan: string;
  billing_interval: string | null;
  subscription_status: string;
  onboarding_completed: boolean;
  /** Records that they tapped Join, not that they are in the group. Server-owned
   *  (read-only on the account endpoints); deliberately absent from
   *  StoredAccount, which gets spread into every profile PATCH. */
  whatsapp_community_opt_in_at: string | null;
  created_at: string;
  updated_at: string;
  user: string;
}

export interface GoogleLoginResponse {
  tokens: { access: string; refresh: string };
  user: { id: string; email: string; is_active: boolean; created_at: string };
  new_user: boolean;
  profile: {
    first_name: string;
    last_name: string;
    profile_picture_url: string;
  };
  status: boolean;
}
