import { useState, useEffect } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import useNotebookService from "../services/notebooks";
import useAuthService from "../services/auth";
import useAccountService from "../services/account";
import type { OnboardingStatus } from "@freshr/shared";
import type { Notebook, AccountUseage, StoredAccount } from "@freshr/shared";
import { getAccount as getCachedAccount } from "../storage";
import LoadErrorScreen from "../components/ui/LoadErrorScreen";

import TopNavbar from "../components/dashboard/TopNavbar";
import UsageOverview from "../components/dashboard/UsageOverview";
import NotebookCard from "../components/dashboard/NotebookCard";
import NotebookRow from "../components/dashboard/NotebookRow";
import CreateCard from "../components/dashboard/CreateCard";
import CreateNotebookModal from "../components/dashboard/CreateNotebookModal";
import DeleteNotebookModal from "../components/dashboard/DeleteNotebookModal";
import ArchivedSection from "../components/dashboard/ArchivedSection";
import EmptyState from "../components/dashboard/EmptyState";
import UpgradeModal from "../components/dashboard/UpgradeModal";
import { useToast } from "../hooks/useToast";
import { track } from "../lib/analytics";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Toggle } from "@/components/ui/toggle";
import {
  RiSearchLine,
  RiAddLine,
  RiLayoutGridLine,
  RiListUnordered,
  RiBook2Line,
  RiSearchEyeLine,
} from "@remixicon/react";

/** Greeting keyed off the local hour, matching the inspiration's header. */
function greeting(now: Date = new Date()): string {
  const hour = now.getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export default function DashboardPage() {
  const authService = useAuthService();
  const accountService = useAccountService();
  const notebookService = useNotebookService();
  const navigate = useNavigate();
  const user = authService.getUser();
  const [account, setAccount] = useState<StoredAccount | null>(
    getCachedAccount(),
  );

  const [notebooks, setNotebooks] = useState<Notebook[]>([]);
  const [archivedNotebooks, setArchivedNotebooks] = useState<Notebook[]>([]);
  const [fileCounts, setFileCounts] = useState<Record<string, number>>({});
  const [view, setView] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [upgradeModal, setUpgradeModal] = useState<{
    title: string;
    description: string;
  } | null>(null);
  const [createTitle, setCreateTitle] = useState("");
  const [createError, setCreateError] = useState("");
  const { showToast } = useToast();
  const [status, setStatus] = useState<OnboardingStatus | "loading">("loading");
  const [retrying, setRetrying] = useState(false);
  const [usage, setUsage] = useState<AccountUseage | null>(null);

  async function fetchUsage() {
    try {
      setUsage(await accountService.getAccountUsage());
    } catch (err) {
      console.error("Failed to fetch usage:", err);
    }
  }

  // Single /accounts/me/ fetch: derives both the cached profile and the
  // onboarding flag from one response, so a transient failure produces one
  // "error" state instead of an inconsistent (account-loaded, status-error)
  // pair that would otherwise bounce the user to /onboarding.
  async function loadAccount() {
    setRetrying(true);
    try {
      const res = await accountService.getAccount();
      if (res) setAccount(res.account);
      setStatus(res?.onboardingCompleted ? "complete" : "incomplete");
    } catch (err: any) {
      if (err?.response?.status === 404) {
        setStatus("incomplete");
      } else {
        setStatus("error");
      }
    } finally {
      setRetrying(false);
    }
  }

  useEffect(() => {
    if (!authService.isLoggedIn()) return;
    loadAccount();
    fetchUsage();
  }, []);

  async function refreshNotebooks() {
    const notebooks = await notebookService.list();
    setNotebooks(notebooks);
    const counts = await Promise.all(
      notebooks.map((nb) =>
        notebookService
          .listFiles(nb.id)
          .then((files) => [nb.id, files.length] as const)
          .catch(() => [nb.id, 0] as const),
      ),
    );
    setFileCounts(Object.fromEntries(counts));
  }

  async function refreshArchived() {
    setArchivedNotebooks(await notebookService.listArchived());
  }

  useEffect(() => {
    async function init() {
      await refreshNotebooks();
      await refreshArchived();
    }
    init();
  }, []);

  // Fires `dashboard-engaged-5min` once per mount after 5 minutes of cumulative
  // activity. Idle gaps >30s do not accumulate, so background tabs don't qualify.
  useEffect(() => {
    let engagedMs = 0;
    let lastActivityAt = Date.now();
    let fired = false;
    const onActivity = () => {
      lastActivityAt = Date.now();
    };
    const events = ["mousemove", "keydown", "scroll", "click", "touchstart"];
    events.forEach((e) =>
      window.addEventListener(e, onActivity, { passive: true }),
    );
    const id = window.setInterval(() => {
      if (Date.now() - lastActivityAt < 30_000) {
        engagedMs += 1000;
        if (!fired && engagedMs >= 5 * 60 * 1000) {
          track("dashboard-engaged-5min");
          fired = true;
        }
      }
    }, 1000);
    return () => {
      window.clearInterval(id);
      events.forEach((e) => window.removeEventListener(e, onActivity));
    };
  }, []);

  function handleCreateRequest() {
    if (usage && usage.notebooks.used >= usage.notebooks.limit) {
      setUpgradeModal({
        title: "Notebook limit reached",
        description:
          "You've used all your notebook slots on the free plan. Upgrade to Pro to create unlimited notebooks and unlock more storage and daily quizzes.",
      });
    } else {
      setShowCreateModal(true);
    }
  }

  function handleRenameStart(id: string, title: string) {
    setEditingId(id);
    setEditValue(title);
  }

  async function handleRenameConfirm() {
    if (editingId === null) return;
    const trimmed = editValue.trim();
    if (trimmed) {
      await notebookService.update(editingId, { title: trimmed });
      showToast("Notebook renamed", "neutral");
    }
    setEditingId(null);
    setEditValue("");
    refreshNotebooks();
  }

  function handleRenameCancel() {
    setEditingId(null);
    setEditValue("");
  }

  async function handleArchive(id: string) {
    await notebookService.archive(id);
    await refreshNotebooks();
    await refreshArchived();
    fetchUsage();
    showToast("Notebook archived", "neutral");
  }

  async function handleUnarchive(id: string) {
    try {
      await notebookService.unarchive(id);
      await refreshNotebooks();
      await refreshArchived();
      fetchUsage();
      showToast("Notebook restored", "neutral");
    } catch (err) {
      const code = (err as any)?.response?.data?.code;
      if (code === "notebook_quota_exceeded") {
        setUpgradeModal({
          title: "Notebook limit reached",
          description:
            "You've reached your active notebook limit. Archive another notebook or upgrade to Pro for unlimited notebooks.",
        });
      } else {
        showToast("Failed to restore notebook", "danger");
      }
    }
  }

  async function handleCreateSubmit() {
    const trimmed = createTitle.trim();
    if (!trimmed) {
      setCreateError("Please enter a title.");
      return;
    }
    try {
      await notebookService.create(trimmed);
      track("notebook-created");
      setCreateTitle("");
      setCreateError("");
      setShowCreateModal(false);
      refreshNotebooks();
      fetchUsage();
      showToast("Notebook created");
    } catch (err) {
      const code = (err as any)?.response?.data?.code;
      if (code === "notebook_quota_exceeded") {
        setShowCreateModal(false);
        setCreateTitle("");
        setCreateError("");
        setUpgradeModal({
          title: "Notebook limit reached",
          description:
            "You've used all your notebook slots on the free plan. Upgrade to Pro to create unlimited notebooks and unlock more storage and daily quizzes.",
        });
      } else {
        setCreateError("Failed to create notebook. Please try again.");
      }
    }
  }

  async function handleDeleteConfirm() {
    if (confirmDeleteId === null) return;
    await notebookService.delete(confirmDeleteId);
    setConfirmDeleteId(null);
    refreshNotebooks();
    fetchUsage();
    showToast("Notebook deleted", "danger");
  }

  async function handlePin(notebook: Notebook) {
    await notebookService.update(notebook.id, { pinned: !notebook.pinned });
    refreshNotebooks();
  }

  if (!authService.isLoggedIn()) return <Navigate to="/login" replace />;
  if (status === "loading") return null;
  if (status === "error") {
    return <LoadErrorScreen onRetry={loadAccount} retrying={retrying} />;
  }
  if (status === "incomplete") return <Navigate to="/onboarding" replace />;
  if (!user || !account) return <Navigate to="/login" replace />;

  const sorted = [...notebooks].sort((a, b) => {
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  const filtered = sorted.filter((nb) =>
    nb.title.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const confirmDeleteNotebook =
    notebooks.find((n) => n.id === confirmDeleteId) ?? null;

  const fullName = (
    (account.first_name ?? "") +
    " " +
    (account.last_name ?? "")
  ).trim();
  const userName = fullName || user.email;
  // The greeting wants a first name; fall back to the whole label rather than
  // rendering a bare "Good morning," when the account has no name set.
  const greetingName = account.first_name?.trim() || fullName || "there";

  function actionsFor(notebook: Notebook) {
    return {
      onPin: () => handlePin(notebook),
      onRename: () => handleRenameStart(notebook.id, notebook.title),
      onArchive: () => handleArchive(notebook.id),
      onDelete: () => setConfirmDeleteId(notebook.id),
    };
  }

  return (
    <div className="bg-background flex h-dvh flex-col overflow-hidden">
      <TopNavbar
        userEmail={user.email ?? ""}
        userName={userName}
        profilePictureUrl={account.profile_picture_url ?? ""}
        onLogout={() => {
          authService.logout();
          navigate("/login", { replace: true });
        }}
      />

      <main className="freshr-scroll flex-1 overflow-y-auto px-4 py-6 md:px-8 md:py-8">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-8">
          <div className="flex flex-col gap-1">
            <h1 className="text-3xl font-bold tracking-[-0.02em] md:text-4xl">
              {greeting()}, {greetingName}
            </h1>
            <p className="text-muted-foreground">
              Ready to dive into deep work?
            </p>
          </div>

          {usage && (
            <UsageOverview
              usage={usage}
              onUpgrade={() =>
                navigate("/profile", { state: { tab: "payment" } })
              }
            />
          )}

          <Tabs defaultValue="active" className="gap-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <TabsList>
                <TabsTrigger value="active">
                  Active
                  <span className="text-muted-foreground ml-1 tabular-nums">
                    {notebooks.length}
                  </span>
                </TabsTrigger>
                <TabsTrigger value="archived">
                  Archived
                  <span className="text-muted-foreground ml-1 tabular-nums">
                    {archivedNotebooks.length}
                  </span>
                </TabsTrigger>
              </TabsList>

              <div className="flex items-center gap-2">
                <div className="relative flex-1 lg:w-72 lg:flex-none">
                  <RiSearchLine
                    className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2"
                    aria-hidden="true"
                  />
                  <Input
                    type="search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search notebooks..."
                    aria-label="Search notebooks"
                    className="pl-9 bg-background"
                  />
                </div>

                <div className="flex items-center gap-1">
                  <Toggle
                    pressed={view === "grid"}
                    onPressedChange={() => setView("grid")}
                    aria-label="Grid view"
                    size="sm"
                  >
                    <RiLayoutGridLine aria-hidden="true" />
                  </Toggle>
                  <Toggle
                    pressed={view === "list"}
                    onPressedChange={() => setView("list")}
                    aria-label="List view"
                    size="sm"
                  >
                    <RiListUnordered aria-hidden="true" />
                  </Toggle>
                </div>

                <Button onClick={handleCreateRequest} className="shrink-0">
                  <RiAddLine aria-hidden="true" />
                  <span className="hidden sm:inline">New notebook</span>
                </Button>
              </div>
            </div>

            <TabsContent value="active" className="flex flex-col gap-4">
              {notebooks.length === 0 ? (
                <EmptyState
                  icon={<RiBook2Line className="size-6" aria-hidden="true" />}
                  title="No notebooks yet"
                  description="Create your first notebook, upload your course materials, and Freshr will turn them into notes, quizzes and summaries."
                  action={
                    <Button onClick={handleCreateRequest}>
                      <RiAddLine aria-hidden="true" />
                      Create your first notebook
                    </Button>
                  }
                />
              ) : filtered.length === 0 ? (
                <EmptyState
                  icon={
                    <RiSearchEyeLine className="size-6" aria-hidden="true" />
                  }
                  title="No matches"
                  description={`Nothing here matches “${searchQuery}”. Try a different search.`}
                />
              ) : view === "grid" ? (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                  <CreateCard onClick={handleCreateRequest} />
                  {filtered.map((nb) => (
                    <NotebookCard
                      key={nb.id}
                      notebook={nb}
                      fileCount={fileCounts[nb.id] ?? 0}
                      isEditing={editingId === nb.id}
                      editValue={editValue}
                      onEditChange={setEditValue}
                      onEditConfirm={handleRenameConfirm}
                      onEditCancel={handleRenameCancel}
                      onClick={() => navigate(`/notebook/${nb.id}`)}
                      actions={actionsFor(nb)}
                    />
                  ))}
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {filtered.map((nb) => (
                    <NotebookRow
                      key={nb.id}
                      notebook={nb}
                      fileCount={fileCounts[nb.id] ?? 0}
                      isEditing={editingId === nb.id}
                      editValue={editValue}
                      onEditChange={setEditValue}
                      onEditConfirm={handleRenameConfirm}
                      onEditCancel={handleRenameCancel}
                      onClick={() => navigate(`/notebook/${nb.id}`)}
                      actions={actionsFor(nb)}
                    />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="archived">
              <ArchivedSection
                notebooks={archivedNotebooks}
                onUnarchive={handleUnarchive}
              />
            </TabsContent>
          </Tabs>
        </div>
      </main>

      {upgradeModal && (
        <UpgradeModal
          title={upgradeModal.title}
          description={upgradeModal.description}
          onClose={() => setUpgradeModal(null)}
        />
      )}

      {showCreateModal && (
        <CreateNotebookModal
          title={createTitle}
          error={createError}
          onTitleChange={(val) => {
            setCreateTitle(val);
            if (createError) setCreateError("");
          }}
          onSubmit={handleCreateSubmit}
          onClose={() => {
            setShowCreateModal(false);
            setCreateTitle("");
            setCreateError("");
          }}
        />
      )}

      {confirmDeleteNotebook && (
        <DeleteNotebookModal
          notebook={confirmDeleteNotebook}
          onConfirm={handleDeleteConfirm}
          onClose={() => setConfirmDeleteId(null)}
        />
      )}
    </div>
  );
}
