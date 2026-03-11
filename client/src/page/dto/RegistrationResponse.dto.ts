import type { User } from "./LoginResponse.dto";

export interface RegistrationResponse {
  user: User;
  tokens: {
    refresh: string;
    access: string;
  };
}
