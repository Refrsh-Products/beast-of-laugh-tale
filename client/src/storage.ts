export interface StoredUser {
  id: string;
  email: string;
  is_active: boolean;
  created_at: string;
}

export interface Notebook {
  id: number;
  title: string;
  created_at: string;
  pinned: boolean;
  file_count: number;
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
  profile_picture_url?: string;
  onboarding_completed?: string;
}

export interface StoredGoogleProfile {
  first_name: string;
  last_name: string;
  profile_picture_url: string;
}

export interface NotebookFile {
  id: number;
  notebook: number;
  name: string;
  file_type: string;
  is_indexed: boolean;
  uploaded_at: string;
  updated_at: string;
}

// ── User ──────────────────────────────────────────────────────────
export function getUser(): StoredUser | null {
  const raw = localStorage.getItem("freshr_user");
  return raw ? JSON.parse(raw) : null;
}

export function saveUser(user: StoredUser): void {
  localStorage.setItem("freshr_user", JSON.stringify(user));
}

export function clearUser(): void {
  localStorage.removeItem("freshr_user");
}

export function isLoggedIn(): boolean {
  return localStorage.getItem("freshr_session") === "1";
}

export function startSession(): void {
  localStorage.setItem("freshr_session", "1");
}

export function endSession(): void {
  localStorage.removeItem("freshr_session");
}

// ── Account (profile) ─────────────────────────────────────────────
export function getAccount(): StoredAccount | null {
  const raw = localStorage.getItem("freshr_account");
  return raw ? JSON.parse(raw) : null;
}

export function saveAccount(account: StoredAccount): void {
  localStorage.setItem("freshr_account", JSON.stringify(account));
}

export function hasCompletedOnboarding(): boolean {
  return getAccount() !== null;
}

// ── Google OAuth profile (temp, session-only) ─────────────────────
export function saveGoogleProfile(profile: StoredGoogleProfile): void {
  sessionStorage.setItem("freshr_google_profile", JSON.stringify(profile));
}

export function getGoogleProfile(): StoredGoogleProfile | null {
  const raw = sessionStorage.getItem("freshr_google_profile");
  return raw ? JSON.parse(raw) : null;
}

export function clearGoogleProfile(): void {
  sessionStorage.removeItem("freshr_google_profile");
}

// ── Password ──────────────────────────────────────────────────────
export function getPassword(): string | null {
  return localStorage.getItem("freshr_password");
}

export function savePassword(password: string): void {
  localStorage.setItem("freshr_password", password);
}

// ── Notebooks ─────────────────────────────────────────────────────
export function getNotebooks(): Notebook[] {
  const raw = localStorage.getItem("freshr_notebooks");
  return raw ? JSON.parse(raw) : [];
}

export function saveNotebooks(notebooks: Notebook[]): void {
  localStorage.setItem("freshr_notebooks", JSON.stringify(notebooks));
}

export function updateNotebook(id: number, changes: Partial<Notebook>): void {
  const notebooks = getNotebooks();
  const idx = notebooks.findIndex((n) => n.id === id);
  if (idx !== -1) {
    notebooks[idx] = { ...notebooks[idx], ...changes };
    saveNotebooks(notebooks);
  }
}

export function createNotebook(title: string): Notebook {
  const existing = getNotebooks();
  const maxId = existing.reduce((m, n) => Math.max(m, n.id), 0);
  const nb: Notebook = {
    id: maxId + 1,
    title,
    created_at: new Date().toISOString(),
    pinned: false,
    file_count: 0,
  };
  saveNotebooks([...existing, nb]);
  return nb;
}

export function deleteNotebook(id: number): void {
  saveNotebooks(getNotebooks().filter((n) => n.id !== id));
}

// ── Archived notebooks ────────────────────────────────────────────
export function getArchivedNotebooks(): Notebook[] {
  const raw = localStorage.getItem("freshr_archived_notebooks");
  return raw ? JSON.parse(raw) : [];
}

export function saveArchivedNotebooks(notebooks: Notebook[]): void {
  localStorage.setItem("freshr_archived_notebooks", JSON.stringify(notebooks));
}

export function archiveNotebook(id: number): void {
  const active = getNotebooks();
  const idx = active.findIndex((n) => n.id === id);
  if (idx === -1) return;
  const [nb] = active.splice(idx, 1);
  saveNotebooks(active);
  saveArchivedNotebooks([...getArchivedNotebooks(), nb]);
}

export function unarchiveNotebook(id: number): void {
  const archived = getArchivedNotebooks();
  const idx = archived.findIndex((n) => n.id === id);
  if (idx === -1) return;
  const [nb] = archived.splice(idx, 1);
  saveArchivedNotebooks(archived);
  saveNotebooks([...getNotebooks(), nb]);
}

export function seedNotebooks(): void {
  if (getNotebooks().length > 0) return;
  const seed: Notebook[] = [
    {
      id: 1,
      title: "Organic Chemistry — Semester 1",
      created_at: "2026-01-14T10:00:00Z",
      pinned: true,
      file_count: 6,
    },
    {
      id: 2,
      title: "Machine Learning Fundamentals",
      created_at: "2026-01-28T10:00:00Z",
      pinned: false,
      file_count: 11,
    },
    {
      id: 3,
      title: "History of Architecture",
      created_at: "2026-02-03T10:00:00Z",
      pinned: false,
      file_count: 4,
    },
    {
      id: 4,
      title: "Calculus II — Problem Sets",
      created_at: "2026-02-17T10:00:00Z",
      pinned: true,
      file_count: 8,
    },
    {
      id: 5,
      title: "Spanish B2 Grammar Notes",
      created_at: "2026-02-25T10:00:00Z",
      pinned: false,
      file_count: 3,
    },
  ];
  saveNotebooks(seed);
}
