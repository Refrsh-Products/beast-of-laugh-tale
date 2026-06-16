/**
 * Request/response DTOs for the auth + account endpoints.
 * Moved out of `web/src/page/dto/`; the old files now re-export from here.
 */

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
  tier_plan: string;
  billing_interval: string | null;
  subscription_status: string;
  onboarding_completed: boolean;
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
