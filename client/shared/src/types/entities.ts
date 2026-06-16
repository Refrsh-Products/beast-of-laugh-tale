/**
 * Core domain entity types shared by the API services and both UIs.
 *
 * Moved out of `web/src/storage.ts` so the service layer no longer depends on a
 * browser-storage module. `storage.ts` now re-exports these for back-compat.
 */

export interface StoredUser {
  id: string;
  email: string;
  is_active: boolean;
  created_at: string;
}

export interface Notebook {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
  pinned: boolean;
  file_count?: number;
  is_archived: boolean;
}

export interface AccountUseage {
  plan: string;
  notebooks: {
    used: number;
    limit: number;
  };
  storage: {
    used_bytes: bigint;
    limit_bytes: bigint;
  };
  daily_quizzes: {
    used: number;
    limit: number;
  };
  presentations: {
    used: number;
    limit: number;
  };
  features?: {
    audio_notes?: boolean;
  };
}

export interface StoredAccount {
  id: string;
  first_name: string;
  last_name: string;
  phone: string;
  address1: string;
  address2?: string;
  city: string;
  postal_code: string;
  tier_plan: string;
  billing_interval: string | null;
  subscription_status: string;
  profile_picture_url?: string;
}

export interface NotebookFile {
  id: string;
  notebook: string;
  name: string;
  file_type: string;
  ingestion_status: "pending" | "processing" | "ready" | "failed";
  ingestion_error?: string;
  uploaded_at: string;
  updated_at: string;
}

export type QuizDifficulty = "EASY" | "MEDIUM" | "HARD";
