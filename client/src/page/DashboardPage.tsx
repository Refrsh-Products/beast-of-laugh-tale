import { useState, useEffect, use } from "react";
import { createPortal } from "react-dom";
import { Navigate, useNavigate } from "react-router-dom";
import Sidebar from "../components/sidebar/Sidebar";
import useNotebookService from "../services/notebooks";
import useAuthService from "../services/auth";
import useAccountService from "../services/account";
import type { Notebook } from "../storage";

import DashboardHeader from "../components/dashboard/DashboardHeader";
import NotebookCard from "../components/dashboard/NotebookCard";
import CreateCard from "../components/dashboard/CreateCard";
import NotebookRow from "../components/dashboard/NotebookRow";
import CreateRow from "../components/dashboard/CreateRow";
import CreateNotebookModal from "../components/dashboard/CreateNotebookModal";
import DeleteNotebookModal from "../components/dashboard/DeleteNotebookModal";
import ArchivedSection from "../components/dashboard/ArchivedSection";
import NotebookMenu from "../components/dashboard/NotebookMenu";
import { useToast } from "../hooks/useToast";
import ToastContainer from "../components/ui/ToastContainer";
import UsageBanner from "../components/dashboard/UsageBanner";
import UpgradeModal from "../components/dashboard/UpgradeModal";
import type { AccountUseage } from "../storage";

export default function DashboardPage() {
  const authService = useAuthService();
  const accountService = useAccountService();
  const notebookService = useNotebookService();
  const navigate = useNavigate();
  const user = authService.getUser();
  const account = accountService.getAccount();

  const [notebooks, setNotebooks] = useState<Notebook[]>([]);
  const [archivedNotebooks, setArchivedNotebooks] = useState<Notebook[]>([]);
  const [fileCounts, setFileCounts] = useState<Record<string, number>>({});
  const [view, setView] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [menuAnchor, setMenuAnchor] = useState<{
    top: number;
    right: number;
  } | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [createTitle, setCreateTitle] = useState("");
  const [createError, setCreateError] = useState("");
  const { toasts, showToast } = useToast();
  const [onboardingComplete, setOnboardingComplete] = useState<boolean | null>(
    null,
  );
  const [usage, setUsage] = useState<AccountUseage | null>(null);

  useEffect(() => {
    if (!authService.isLoggedIn()) return;
    accountService.hasCompletedOnboarding().then(setOnboardingComplete);
    accountService
      .getAccountUsage()
      .then(setUsage)
      .catch(() => {});
    console.log(usage);
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

  // Close menu on outside click
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

  function handleCreateRequest() {
    if (usage && usage.notebooks.used >= usage.notebooks.limit) {
      setShowUpgradeModal(true);
    } else {
      setShowCreateModal(true);
    }
  }

  function handleMenuOpen(
    id: string | null,
    anchor?: { top: number; right: number },
  ) {
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
    showToast("Notebook archived", "neutral");
  }

  async function handleUnarchive(id: string) {
    await notebookService.unarchive(id);
    await refreshNotebooks();
    await refreshArchived();
    showToast("Notebook restored", "neutral");
  }

  async function handleCreateSubmit() {
    const trimmed = createTitle.trim();
    if (!trimmed) {
      setCreateError("Please enter a title.");
      return;
    }
    await notebookService.create(trimmed);
    setCreateTitle("");
    setCreateError("");
    setShowCreateModal(false);
    refreshNotebooks();
    showToast("Notebook created");
  }

  function handleDeleteRequest(id: string) {
    handleMenuOpen(null);
    setConfirmDeleteId(id);
  }

  async function handleDeleteConfirm() {
    if (confirmDeleteId === null) return;
    console.log(confirmDeleteId);
    const resp = await notebookService.delete(confirmDeleteId);
    console.log(resp);
    setConfirmDeleteId(null);
    refreshNotebooks();
    showToast("Notebook deleted", "danger");
  }

  if (!authService.isLoggedIn()) return <Navigate to="/login" replace />;
  if (onboardingComplete === null) return null;
  if (!onboardingComplete) return <Navigate to="/onboarding" replace />;
  if (!user || !account) return <Navigate to="/login" replace />;

  const sorted = [...notebooks].sort((a, b) => {
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  const confirmDeleteNotebook =
    notebooks.find((n) => n.id === confirmDeleteId) ?? null;
  const openMenuNotebook = notebooks.find((n) => n.id === openMenuId) ?? null;

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden" }}>
      <Sidebar
        userEmail={user.email ?? ""}
        userName={
          (account.first_name ?? user.email) + " " + (account.last_name ?? "")
        }
        profilePictureUrl={account.profile_picture_url ?? ""}
      />

      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          background: "#f5f5f0",
          minWidth: 0,
        }}
      >
        <DashboardHeader
          notebookCount={notebooks.length}
          searchQuery={searchQuery}
          view={view}
          onSearchChange={setSearchQuery}
          onViewChange={setView}
        />

        <div
          className="freshr-scroll"
          style={{ flex: 1, overflowY: "auto", padding: "24px 32px" }}
        >
          {usage && <UsageBanner usage={usage} />}

          {view === "grid" ? (
            <div
              className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3"
              style={{ gap: 20 }}
            >
              <CreateCard onCreate={handleCreateRequest} />
              {sorted.map((nb) => (
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
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <CreateRow onCreate={handleCreateRequest} />
              {sorted.map((nb) => (
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

          <ArchivedSection
            notebooks={archivedNotebooks}
            onUnarchive={handleUnarchive}
          />
        </div>
      </div>

      {showUpgradeModal && (
        <UpgradeModal onClose={() => setShowUpgradeModal(false)} />
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
            onRename={() =>
              handleRenameStart(openMenuNotebook.id, openMenuNotebook.title)
            }
            onArchive={() => handleArchive(openMenuNotebook.id)}
            onDelete={() => handleDeleteRequest(openMenuNotebook.id)}
          />,
          document.body,
        )}
      <ToastContainer toasts={toasts} />
    </div>
  );
}
