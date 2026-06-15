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

export interface StoredGoogleProfile {
  first_name: string;
  last_name: string;
  profile_picture_url: string;
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

export function getNotebook(notebook_id: string): Notebook {
  const raw = localStorage.getItem("freshr_notebooks");
  const notebooks = raw ? (JSON.parse(raw) as Notebook[]) : [];
  const notebook = notebooks.find((n) => n.id === notebook_id);

  if (!notebook) {
    throw new Error(`Notebook with id ${notebook_id} not found.`);
  }

  return notebook;
}

export function saveNotebooks(notebooks: Notebook[]): void {
  localStorage.setItem("freshr_notebooks", JSON.stringify(notebooks));
}

export function updateNotebook(id: string, changes: Partial<Notebook>): void {
  const notebooks = getNotebooks();
  const idx = notebooks.findIndex((n) => n.id === id);
  if (idx !== -1) {
    notebooks[idx] = { ...notebooks[idx], ...changes };
    saveNotebooks(notebooks);
  }
}

export function createNotebook(title: string): Notebook {
  const nb: Notebook = {
    id: crypto.randomUUID(),
    title,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    pinned: false,
    file_count: 0,
    is_archived: false,
  };
  saveNotebooks([...getNotebooks(), nb]);
  return nb;
}

export function deleteNotebook(id: string): void {
  saveNotebooks(getNotebooks().filter((n) => n.id !== id));
}

// ── Notebook Files (mock — metadata only, no file content) ────────────────────────────────────────────────
function filesKey(notebookId: string): string {
  return `freshr_files_${notebookId}`;
}

export function getNotebookFiles(notebookId: string): NotebookFile[] {
  const raw = localStorage.getItem(filesKey(notebookId));
  return raw ? JSON.parse(raw) : [];
}

export function saveNotebookFiles(
  notebookId: string,
  files: NotebookFile[],
): void {
  localStorage.setItem(filesKey(notebookId), JSON.stringify(files));
}

export function addNotebookFile(
  notebookId: string,
  name: string,
  fileType: string,
): NotebookFile {
  const file: NotebookFile = {
    id: crypto.randomUUID(),
    notebook: notebookId,
    name,
    file_type: fileType,
    ingestion_status: "pending",
    uploaded_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  saveNotebookFiles(notebookId, [...getNotebookFiles(notebookId), file]);
  return file;
}

export function deleteNotebookFile(notebookId: string, fileId: string): void {
  saveNotebookFiles(
    notebookId,
    getNotebookFiles(notebookId).filter((f) => f.id !== fileId),
  );
}

export function renameNotebookFile(
  notebookId: string,
  fileId: string,
  newName: string,
): void {
  const files = getNotebookFiles(notebookId);
  const idx = files.findIndex((f) => f.id === fileId);
  if (idx !== -1) {
    files[idx] = {
      ...files[idx],
      name: newName,
      updated_at: new Date().toISOString(),
    };
    saveNotebookFiles(notebookId, files);
  }
}

export function listFiles(notebookId: string): NotebookFile[] {
  return getNotebookFiles(notebookId).filter((f) => f.notebook === notebookId);
}

export function createFile(notebookId: string, file: File): NotebookFile {
  const newFile: NotebookFile = {
    id: crypto.randomUUID(),
    notebook: notebookId,
    name: file.name,
    file_type: file.name.split(".").pop() ?? "unknown",
    ingestion_status: "pending",
    uploaded_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  saveNotebookFiles(notebookId, [...getNotebookFiles(notebookId), newFile]);
  const files = listFiles(notebookId);
  updateNotebook(notebookId, { file_count: files.length });
  return newFile;
}

export function deleteFile(notebookId: string, fileId: string): void {
  saveNotebookFiles(
    notebookId,
    getNotebookFiles(notebookId).filter(
      (f) => !(f.notebook === notebookId && f.id === fileId),
    ),
  );
  const files = listFiles(notebookId);
  updateNotebook(notebookId, { file_count: files.length });
}

// ── Archived notebooks ────────────────────────────────────────────
export function getArchivedNotebooks(): Notebook[] {
  const raw = localStorage.getItem("freshr_archived_notebooks");
  return raw ? JSON.parse(raw) : [];
}

export function saveArchivedNotebooks(notebooks: Notebook[]): void {
  localStorage.setItem("freshr_archived_notebooks", JSON.stringify(notebooks));
}

export function archiveNotebook(id: string): void {
  const active = getNotebooks();
  const idx = active.findIndex((n) => n.id === id);
  if (idx === -1) return;
  const [nb] = active.splice(idx, 1);
  saveNotebooks(active);
  saveArchivedNotebooks([...getArchivedNotebooks(), nb]);
}

export function unarchiveNotebook(id: string): void {
  const archived = getArchivedNotebooks();
  const idx = archived.findIndex((n) => n.id === id);
  if (idx === -1) return;
  const [nb] = archived.splice(idx, 1);
  saveArchivedNotebooks(archived);
  saveNotebooks([...getNotebooks(), nb]);
}

// ── Chats ─────────────────────────────────────────────────────────
export interface StoredChatSession {
  id: string;
  notebook_id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

export interface StoredChatMessage {
  id: string;
  chat_id: string;
  role: "user" | "chatbot";
  content: string;
  token_count: number | null;
  order_index: number;
  sent_at: string;
  is_deleted: boolean;
}

function getChatSessions(): StoredChatSession[] {
  const raw = localStorage.getItem("freshr_chat_sessions");
  return raw ? JSON.parse(raw) : [];
}

function saveChatSessions(sessions: StoredChatSession[]): void {
  localStorage.setItem("freshr_chat_sessions", JSON.stringify(sessions));
}

function getChatMessages(): StoredChatMessage[] {
  const raw = localStorage.getItem("freshr_chat_messages");
  return raw ? JSON.parse(raw) : [];
}

function saveChatMessages(messages: StoredChatMessage[]): void {
  localStorage.setItem("freshr_chat_messages", JSON.stringify(messages));
}

export function listChatSessions(notebookId: string): StoredChatSession[] {
  return getChatSessions().filter((s) => s.notebook_id === notebookId);
}

export function getChatSession(chatId: string): StoredChatSession {
  const session = getChatSessions().find((s) => s.id === chatId);
  if (!session) throw new Error(`Chat session with id ${chatId} not found.`);
  return session;
}

export function createChatSession(
  notebookId: string,
  title = "",
): StoredChatSession {
  const session: StoredChatSession = {
    id: crypto.randomUUID(),
    notebook_id: notebookId,
    title,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  saveChatSessions([...getChatSessions(), session]);
  return session;
}

export function updateChatSession(
  chatId: string,
  title: string,
): StoredChatSession {
  const sessions = getChatSessions();
  const idx = sessions.findIndex((s) => s.id === chatId);
  if (idx === -1) throw new Error(`Chat session with id ${chatId} not found.`);
  const updated = {
    ...sessions[idx],
    title,
    updated_at: new Date().toISOString(),
  };
  sessions[idx] = updated;
  saveChatSessions(sessions);
  return updated;
}

export function deleteChatSession(chatId: string): void {
  saveChatSessions(getChatSessions().filter((s) => s.id !== chatId));
  saveChatMessages(getChatMessages().filter((m) => m.chat_id !== chatId));
}

export function listChatMessages(chatId: string): StoredChatMessage[] {
  return getChatMessages().filter((m) => m.chat_id === chatId && !m.is_deleted);
}

export function createChatMessage(
  chatId: string,
  role: "user" | "chatbot",
  content: string,
): StoredChatMessage {
  const all = getChatMessages();
  const order_index = all.filter((m) => m.chat_id === chatId).length;
  const message: StoredChatMessage = {
    id: crypto.randomUUID(),
    chat_id: chatId,
    role,
    content,
    token_count: null,
    order_index,
    sent_at: new Date().toISOString(),
    is_deleted: false,
  };
  saveChatMessages([...all, message]);
  return message;
}

// ── Quizzes ──────────────────────────────────────────────────────────

export type QuizDifficulty = "EASY" | "MEDIUM" | "HARD";

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[]; // always 4
  correct_index: number;
  explanation?: string; // TODO(backend): AI-generated during quiz creation; mock uses hardcoded text
}

export interface QuizAttempt {
  id: string;
  notebook_id: string;
  created_at: string;
  topics: string[];
  prompt?: string;
  question_count: number;
  difficulty: QuizDifficulty;
  timed: boolean;
  time_limit?: number; // minutes
  time_taken: number; // seconds
  score: number;
  questions: QuizQuestion[];
  user_answers: (number | null)[];
  flagged_questions: number[]; // TODO(backend): persisted in DB; indices of questions the user flagged
}

function quizzesKey(notebookId: string): string {
  return `freshr_quizzes_${notebookId}`;
}

export function getQuizAttempts(notebookId: string): QuizAttempt[] {
  const raw = localStorage.getItem(quizzesKey(notebookId));
  return raw ? JSON.parse(raw) : [];
}

export function saveQuizAttempts(
  notebookId: string,
  attempts: QuizAttempt[],
): void {
  localStorage.setItem(quizzesKey(notebookId), JSON.stringify(attempts));
}

export function addQuizAttempt(notebookId: string, attempt: QuizAttempt): void {
  saveQuizAttempts(notebookId, [attempt, ...getQuizAttempts(notebookId)]);
}

// Might need to change this, since I am planning to dynamically create topics
export function getMockTopics(): string[] {
  return [
    "Photosynthesis",
    "Cell Division",
    "DNA Replication",
    "Newton's Laws",
    "Thermodynamics",
    "Organic Chemistry",
    "Calculus Derivatives",
    "Linear Algebra",
    "World War II",
    "Renaissance Art",
    "Supply and Demand",
    "Machine Learning",
    "Neural Networks",
    "Data Structures",
    "Algorithms",
  ];
}

// ─────────────────────────────────────────────────────────────────────

export function seedNotebooks(): void {
  if (getNotebooks().length > 0) return;
  const seed: Notebook[] = [
    {
      id: "00000000-0000-0000-0000-000000000001",
      title: "Organic Chemistry — Semester 1",
      created_at: "2026-01-14T10:00:00Z",
      updated_at: "2026-01-14T10:00:00Z",
      pinned: true,
      file_count: 6,
      is_archived: false,
    },
    {
      id: "00000000-0000-0000-0000-000000000002",
      title: "Machine Learning Fundamentals",
      created_at: "2026-01-28T10:00:00Z",
      updated_at: "2026-01-14T10:00:00Z",
      pinned: false,
      file_count: 11,
      is_archived: false,
    },
    {
      id: "00000000-0000-0000-0000-000000000003",
      title: "History of Architecture",
      created_at: "2026-02-03T10:00:00Z",
      updated_at: "2026-01-14T10:00:00Z",
      pinned: false,
      file_count: 4,
      is_archived: false,
    },
    {
      id: "00000000-0000-0000-0000-000000000004",
      title: "Calculus II — Problem Sets",
      created_at: "2026-02-17T10:00:00Z",
      updated_at: "2026-01-14T10:00:00Z",
      pinned: true,
      file_count: 8,
      is_archived: false,
    },
    {
      id: "00000000-0000-0000-0000-000000000005",
      title: "Spanish B2 Grammar Notes",
      created_at: "2026-02-25T10:00:00Z",
      updated_at: "2026-01-14T10:00:00Z",
      pinned: false,
      file_count: 3,
      is_archived: false,
    },
  ];
  saveNotebooks(seed);
}
