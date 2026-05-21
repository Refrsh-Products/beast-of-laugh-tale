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
