export interface User {
  id: string;
  email: string;
  tier_plan: string;
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
