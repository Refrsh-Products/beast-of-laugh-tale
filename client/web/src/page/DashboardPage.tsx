import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Navigate, useNavigate } from "react-router-dom";
import { Search, LayoutGrid, AlignJustify, Plus } from "lucide-react";
import useNotebookService from "../services/notebooks";
import useAuthService from "../services/auth";
import useAccountService from "../services/account";
import type { OnboardingStatus } from "@freshr/shared";
import type { Notebook, AccountUseage, StoredAccount } from "@freshr/shared";
import { getAccount as getCachedAccount } from "../storage";
import LoadErrorScreen from "../components/ui/LoadErrorScreen";
import { Input } from "../components/ui/input";
import TopNavbar from "../components/dashboard/TopNavbar";
import NotebookCard from "../components/dashboard/NotebookCard";
import NotebookRow from "../components/dashboard/NotebookRow";
import CreateNotebookModal from "../components/dashboard/CreateNotebookModal";
import DeleteNotebookModal from "../components/dashboard/DeleteNotebookModal";
import ArchivedSection from "../components/dashboard/ArchivedSection";
import NotebookMenu from "../components/dashboard/NotebookMenu";
import { useToast } from "../hooks/useToast";
import ToastContainer from "../components/ui/ToastContainer";
import UpgradeModal from "../components/dashboard/UpgradeModal";
import { track } from "../lib/analytics";
import { useMediaQuery } from "../hooks/useMediaQuery";
import { BP_PHONE } from "../constants/breakpoints";
import { cn } from "../lib/utils";

function MiniBar({ used, limit }: { used: number; limit: number }) {
  const pct = limit > 0 ? Math.min(100, (used / limit) * 100) : 0;
  return (
    <div className="w-12 h-1 rounded-full bg-secondary overflow-hidden shrink-0">
      <div
        className={cn(
          "h-full rounded-full transition-all duration-300",
          pct >= 80 ? "bg-destructive" : pct >= 55 ? "bg-amber-500" : "bg-primary",
        )}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

export default function DashboardPage() {
  const authService = useAuthService();
  const accountService = useAccountService();
  const notebookService = useNotebookService();
  const navigate = useNavigate();
  const user = authService.getUser();
  const isPhone = useMediaQuery(BP_PHONE);
  const [account, setAccount] = useState<StoredAccount | null>(getCachedAccount());

  const [notebooks, setNotebooks] = useState<Notebook[]>([]);
  const [archivedNotebooks, setArchivedNotebooks] = useState<Notebook[]>([]);
  const [fileCounts, setFileCounts] = useState<Record<string, number>>({});
  const [view, setView] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [menuAnchor, setMenuAnchor] = useState<{ top: number; right: number } | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [upgradeModal, setUpgradeModal] = useState<{ title: string; description: string } | null>(null);
  const [createTitle, setCreateTitle] = useState("");
  const [createError, setCreateError] = useState("");
  const { toasts, showToast } = useToast();
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

  useEffect(() => {
    function handleMouseDown() {
      if (openMenuId !== null) {
        setOpenMenuId(null);
        setMenuAnchor(null);
      }
    }
    document.addEventListener("mousedown", handleMouseDown);
    return () => document.removeEventListener("mousedown", handleMouseDown);
  }, [openMenuId]);

  // Fires `dashboard-engaged-5min` once per mount after 5 minutes of cumulative
  // activity. Idle gaps >30s do not accumulate, so background tabs don't qualify.
  useEffect(() => {
    let engagedMs = 0;
    let lastActivityAt = Date.now();
    let fired = false;
    const onActivity = () => { lastActivityAt = Date.now(); };
    const events = ["mousemove", "keydown", "scroll", "click", "touchstart"];
    events.forEach((e) => window.addEventListener(e, onActivity, { passive: true }));
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
        description: "You've used all your notebook slots on the free plan. Upgrade to Pro to create unlimited notebooks and unlock more storage and daily quizzes.",
      });
    } else {
      setShowCreateModal(true);
    }
  }

  function handleMenuOpen(id: string | null, anchor?: { top: number; right: number }) {
    setOpenMenuId(id);
    setMenuAnchor(anchor ?? null);
  }

  function handleRenameStart(id: string, title: string) {
    handleMenuOpen(null);
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
    handleMenuOpen(null);
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
          description: "You've reached your active notebook limit. Archive another notebook or upgrade to Pro for unlimited notebooks.",
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
          description: "You've used all your notebook slots on the free plan. Upgrade to Pro to create unlimited notebooks and unlock more storage and daily quizzes.",
        });
      } else {
        setCreateError("Failed to create notebook. Please try again.");
      }
    }
  }

  function handleDeleteRequest(id: string) {
    handleMenuOpen(null);
    setConfirmDeleteId(id);
  }

  async function handleDeleteConfirm() {
    if (confirmDeleteId === null) return;
    await notebookService.delete(confirmDeleteId);
    setConfirmDeleteId(null);
    refreshNotebooks();
    fetchUsage();
    showToast("Notebook deleted", "danger");
  }

  if (!authService.isLoggedIn()) return <Navigate to="/login" replace />;
  if (status === "loading") return null;
  if (status === "error") return <LoadErrorScreen onRetry={loadAccount} retrying={retrying} />;
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

  const confirmDeleteNotebook = notebooks.find((n) => n.id === confirmDeleteId) ?? null;
  const openMenuNotebook = notebooks.find((n) => n.id === openMenuId) ?? null;
  const userName = ((account.first_name ?? "") + " " + (account.last_name ?? "")).trim() || user.email;
  const isFreePlan = !usage || usage.plan?.toLowerCase() === "free";

  return (
    <div className="flex flex-col h-dvh overflow-hidden">
      <TopNavbar
        userEmail={user.email ?? ""}
        userName={userName}
        profilePictureUrl={account.profile_picture_url ?? ""}
      />

      {/* Usage strip */}
      {usage && (
        <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 border-b border-border bg-background px-6 py-2 shrink-0 relative">
          <span className="text-xs font-semibold text-foreground uppercase tracking-wider">
            {usage.plan}
          </span>
          <span className="text-muted-foreground">·</span>

          {[
            {
              label: "Notebooks",
              used: usage.notebooks.used,
              limit: usage.notebooks.limit,
              fmt: (n: number) => String(n),
            },
            {
              label: "Storage",
              used: Number(usage.storage.used_bytes),
              limit: Number(usage.storage.limit_bytes),
              fmt: (n: number) => n >= 1_048_576 ? `${(n / 1_048_576).toFixed(0)}MB` : `${(n / 1_024).toFixed(0)}KB`,
            },
            {
              label: "Quizzes",
              used: usage.daily_quizzes.used,
              limit: usage.daily_quizzes.limit,
              fmt: (n: number) => String(n),
            },
            {
              label: "Presentations",
              used: usage.presentations.used,
              limit: usage.presentations.limit,
              fmt: (n: number) => String(n),
            },
          ].map((item, i, arr) => (
            <span key={item.label} className="flex items-center gap-4">
              <span className="flex items-center gap-1.5">
                <span className="text-xs text-muted-foreground">{item.label}</span>
                <MiniBar used={item.used} limit={item.limit} />
                <span className="text-xs text-foreground font-medium">
                  {item.fmt(item.used)}
                  <span className="text-muted-foreground font-normal">/{item.fmt(item.limit)}</span>
                </span>
              </span>
              {!isPhone && i < arr.length - 1 && (
                <span className="text-muted-foreground">·</span>
              )}
            </span>
          ))}

          {isFreePlan && (
            <button
              onClick={() => navigate("/profile", { state: { tab: "payment" } })}
              className={cn(
                "text-xs font-medium text-foreground border border-border rounded-md px-3 py-1 transition-colors hover:bg-secondary",
                isPhone ? "static" : "absolute right-6",
              )}
            >
              Upgrade to Pro →
            </button>
          )}
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 overflow-y-auto bg-background px-6 py-8 md:px-12">
        <div className="max-w-5xl mx-auto">

          {/* Header */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between mb-8">
            <div>
              <h1 className="text-xl font-semibold text-foreground">My Notebooks</h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                {notebooks.length} {notebooks.length === 1 ? "notebook" : "notebooks"}
              </p>
            </div>
            <button
              onClick={handleCreateRequest}
              className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 shrink-0"
            >
              <Plus className="h-4 w-4" />
              New Notebook
            </button>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-between gap-3 mb-6">
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
              <Input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search notebooks..."
                className="pl-8"
              />
            </div>

            <div className="flex rounded-md border border-border overflow-hidden shrink-0">
              <button
                onClick={() => setView("grid")}
                title="Grid view"
                className={cn(
                  "p-2 transition-colors",
                  view === "grid"
                    ? "bg-secondary text-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/50",
                )}
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
              <button
                onClick={() => setView("list")}
                title="List view"
                className={cn(
                  "p-2 border-l border-border transition-colors",
                  view === "list"
                    ? "bg-secondary text-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/50",
                )}
              >
                <AlignJustify className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Empty state */}
          {notebooks.length === 0 && (
            <div className="rounded-lg border border-dashed border-border px-8 py-16 text-center mb-6">
              <p className="text-base font-medium text-foreground mb-1">No notebooks yet.</p>
              <p className="text-sm text-muted-foreground">
                Hit <strong className="text-foreground">+ New Notebook</strong> to get started.
              </p>
            </div>
          )}

          {/* Notebook grid / list */}
          {view === "grid" ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map((nb) => (
                <NotebookCard
                  key={nb.id}
                  notebook={nb}
                  fileCount={fileCounts[nb.id] ?? 0}
                  openMenuId={openMenuId}
                  onMenuOpen={handleMenuOpen}
                  editingId={editingId}
                  editValue={editValue}
                  onEditChange={setEditValue}
                  onEditConfirm={handleRenameConfirm}
                  onEditCancel={handleRenameCancel}
                  onClick={() => navigate(`/notebook/${nb.id}`)}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col gap-1">
              {filtered.map((nb) => (
                <NotebookRow
                  key={nb.id}
                  notebook={nb}
                  fileCount={fileCounts[nb.id] ?? 0}
                  openMenuId={openMenuId}
                  onMenuOpen={handleMenuOpen}
                  editingId={editingId}
                  editValue={editValue}
                  onEditChange={setEditValue}
                  onEditConfirm={handleRenameConfirm}
                  onEditCancel={handleRenameCancel}
                  onClick={() => navigate(`/notebook/${nb.id}`)}
                />
              ))}
            </div>
          )}

          <ArchivedSection notebooks={archivedNotebooks} onUnarchive={handleUnarchive} />
        </div>
      </div>

      {/* Modals */}
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

      {openMenuNotebook &&
        menuAnchor &&
        createPortal(
          <NotebookMenu
            notebook={openMenuNotebook}
            top={menuAnchor.top}
            right={menuAnchor.right}
            onPin={async () => {
              await notebookService.update(openMenuNotebook.id, {
                pinned: !openMenuNotebook.pinned,
              });
              refreshNotebooks();
              handleMenuOpen(null);
            }}
            onRename={() => handleRenameStart(openMenuNotebook.id, openMenuNotebook.title)}
            onArchive={() => handleArchive(openMenuNotebook.id)}
            onDelete={() => handleDeleteRequest(openMenuNotebook.id)}
          />,
          document.body,
        )}

      <ToastContainer toasts={toasts} />
    </div>
  );
}
