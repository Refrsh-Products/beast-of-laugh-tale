export interface LoginResponse {
  user: {
    id: string;
    email: string;
    tier_plan: string;
    is_active: boolean;
    created_at: string;
  };
  tokens: {
    refresh: string;
    access: string;
  };
}
