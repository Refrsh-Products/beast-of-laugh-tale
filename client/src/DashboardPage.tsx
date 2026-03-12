import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useNavigate, Navigate } from "react-router-dom";
import Sidebar from "./Sidebar";
import notebookService from "./services/notebooks";
import useAuthService from "./services/auth";
import type { Notebook } from "./storage";

import DashboardHeader from "./components/dashboard/DashboardHeader";
import NotebookCard from "./components/dashboard/NotebookCard";
import CreateCard from "./components/dashboard/CreateCard";
import NotebookRow from "./components/dashboard/NotebookRow";
import CreateRow from "./components/dashboard/CreateRow";
import CreateNotebookModal from "./components/dashboard/CreateNotebookModal";
import DeleteNotebookModal from "./components/dashboard/DeleteNotebookModal";
import ArchivedSection from "./components/dashboard/ArchivedSection";
import NotebookMenu from "./components/dashboard/NotebookMenu";

export default function DashboardPage() {
  const navigate = useNavigate();
  const authService = useAuthService();
  const user = authService.getUser();
  const account = authService.getAccount();

  const [notebooks, setNotebooks] = useState<Notebook[]>([]);
  const [archivedNotebooks, setArchivedNotebooks] = useState<Notebook[]>([]);
  const [view, setView] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const [menuAnchor, setMenuAnchor] = useState<{
    top: number;
    right: number;
  } | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editValue, setEditValue] = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createTitle, setCreateTitle] = useState("");
  const [createError, setCreateError] = useState("");
  const [onboardingComplete, setOnboardingComplete] = useState<boolean | null>(
    null,
  );

  useEffect(() => {
    if (!authService.isLoggedIn()) return;
    authService.hasCompletedOnboarding().then(setOnboardingComplete);
  }, []);

  async function refreshNotebooks() {
    setNotebooks(await notebookService.list());
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

  function handleMenuOpen(
    id: number | null,
    anchor?: { top: number; right: number },
  ) {
    setOpenMenuId(id);
    setMenuAnchor(anchor ?? null);
  }

  function handleRenameStart(id: number, title: string) {
    handleMenuOpen(null);
    setEditingId(id);
    setEditValue(title);
  }

  async function handleRenameConfirm() {
    if (editingId === null) return;
    const trimmed = editValue.trim();
    if (trimmed) await notebookService.update(editingId, { title: trimmed });
    setEditingId(null);
    setEditValue("");
    refreshNotebooks();
  }

  function handleRenameCancel() {
    setEditingId(null);
    setEditValue("");
  }

  async function handleArchive(id: number) {
    handleMenuOpen(null);
    await notebookService.archive(id);
    await refreshNotebooks();
    await refreshArchived();
  }

  async function handleUnarchive(id: number) {
    await notebookService.unarchive(id);
    await refreshNotebooks();
    await refreshArchived();
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
  }

  function handleDeleteRequest(id: number) {
    handleMenuOpen(null);
    setConfirmDeleteId(id);
  }

  async function handleDeleteConfirm() {
    if (confirmDeleteId === null) return;
    await notebookService.delete(confirmDeleteId);
    setConfirmDeleteId(null);
    refreshNotebooks();
  }

  function handleLogout() {
    authService.logout();
    navigate("/login");
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
        onLogout={handleLogout}
        userEmail={user.email ?? ""}
        userName={
          (account.first_name ?? user.email) + " " + (account.last_name ?? "")
        }
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
          {view === "grid" ? (
            <div
              className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3"
              style={{ gap: 20 }}
            >
              <CreateCard onCreate={() => setShowCreateModal(true)} />
              {sorted.map((nb) => (
                <NotebookCard
                  key={nb.id}
                  notebook={nb}
                  openMenuId={openMenuId}
                  onMenuOpen={handleMenuOpen}
                  editingId={editingId}
                  editValue={editValue}
                  onEditChange={setEditValue}
                  onEditConfirm={handleRenameConfirm}
                  onEditCancel={handleRenameCancel}
                />
              ))}
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <CreateRow onCreate={() => setShowCreateModal(true)} />
              {sorted.map((nb) => (
                <NotebookRow
                  key={nb.id}
                  notebook={nb}
                  openMenuId={openMenuId}
                  onMenuOpen={handleMenuOpen}
                  editingId={editingId}
                  editValue={editValue}
                  onEditChange={setEditValue}
                  onEditConfirm={handleRenameConfirm}
                  onEditCancel={handleRenameCancel}
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
    </div>
  );
}
