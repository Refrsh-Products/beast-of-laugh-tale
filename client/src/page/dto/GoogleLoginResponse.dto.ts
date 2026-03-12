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
