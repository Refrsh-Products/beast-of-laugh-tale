import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Navigate, useNavigate } from "react-router-dom";
import useNotebookService from "../services/notebooks";
import useAuthService from "../services/auth";
import useAccountService from "../services/account";
import type { Notebook, AccountUseage } from "../storage";

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

const G = "#84e487";
const B = "#000000";
const W = "#FFFFFF";

function MiniBar({ used, limit }: { used: number; limit: number }) {
  const pct = limit > 0 ? Math.min(100, (used / limit) * 100) : 0;
  const fill = pct >= 80 ? "#e53e3e" : pct >= 55 ? "#d97706" : B;
  return (
    <div style={{ width: 52, height: 4, background: "#e0e0e0", flexShrink: 0 }}>
      <div
        style={{
          width: `${pct}%`,
          height: "100%",
          background: fill,
          transition: "width 0.3s",
        }}
      />
    </div>
  );
}

function NewNotebookButton({ onClick }: { onClick: () => void }) {
  const [hovered, setHovered] = useState(false);
  const [pressed, setPressed] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => {
        setHovered(false);
        setPressed(false);
      }}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 7,
        background: G,
        color: B,
        border: `2px solid ${B}`,
        padding: "10px 18px",
        fontFamily: "'IBM Plex Mono', monospace",
        fontWeight: 700,
        fontSize: "0.75rem",
        letterSpacing: "0.04em",
        cursor: "pointer",
        boxShadow: pressed
          ? `1px 1px 0 ${B}`
          : hovered
            ? `5px 5px 0 ${B}`
            : `3px 3px 0 ${B}`,
        transform: pressed
          ? "translate(2px, 2px)"
          : hovered
            ? "translate(-2px, -2px)"
            : "none",
        transition: "transform 0.1s, box-shadow 0.1s",
        flexShrink: 0,
      }}
    >
      <span style={{ fontSize: "1rem", lineHeight: 1 }}>+</span>
      New Notebook
    </button>
  );
}

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
    await notebookService.delete(confirmDeleteId);
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

  const filtered = sorted.filter((nb) =>
    nb.title.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const confirmDeleteNotebook =
    notebooks.find((n) => n.id === confirmDeleteId) ?? null;
  const openMenuNotebook = notebooks.find((n) => n.id === openMenuId) ?? null;

  const userName =
    ((account.first_name ?? "") + " " + (account.last_name ?? "")).trim() ||
    user.email;

  const isFreePlan = !usage || usage.plan?.toLowerCase() === "free";

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        overflow: "hidden",
      }}
    >
      <TopNavbar
        userEmail={user.email ?? ""}
        userName={userName}
        profilePictureUrl={account.profile_picture_url ?? ""}
      />

      {/* Usage strip — all users */}
      {usage && (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            gap: 20,
            padding: "7px 64px",
            background: W,
            borderBottom: `2px solid ${B}`,
            flexShrink: 0,
            position: "relative",
          }}
        >
          <span
            style={{
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: "0.6rem",
              fontWeight: 700,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: B,
            }}
          >
            {usage.plan}
          </span>
          <span style={{ color: "#ddd" }}>·</span>
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
              fmt: (n: number) =>
                n >= 1_048_576
                  ? `${(n / 1_048_576).toFixed(0)}MB`
                  : `${(n / 1_024).toFixed(0)}KB`,
            },
            {
              label: "Quizzes",
              used: usage.daily_quizzes.used,
              limit: usage.daily_quizzes.limit,
              fmt: (n: number) => String(n),
            },
          ].map((item, i, arr) => (
            <span
              key={item.label}
              style={{ display: "flex", alignItems: "center", gap: 20 }}
            >
              <span style={{ display: "flex", alignItems: "center", gap: 7 }}>
                <span
                  style={{
                    fontFamily: "'IBM Plex Mono', monospace",
                    fontSize: "0.6rem",
                    color: "#777",
                  }}
                >
                  {item.label}
                </span>
                <MiniBar used={item.used} limit={item.limit} />
                <span
                  style={{
                    fontFamily: "'IBM Plex Mono', monospace",
                    fontSize: "0.6rem",
                    color: B,
                    fontWeight: 700,
                  }}
                >
                  {item.fmt(item.used)}
                  <span style={{ color: "#bbb", fontWeight: 400 }}>
                    /{item.fmt(item.limit)}
                  </span>
                </span>
              </span>
              {i < arr.length - 1 && <span style={{ color: "#ddd" }}>·</span>}
            </span>
          ))}
          {isFreePlan && (
            <button
              onClick={() =>
                navigate("/profile", { state: { tab: "payment" } })
              }
              onMouseEnter={(e) => {
                e.currentTarget.style.background = G;
                e.currentTarget.style.boxShadow = `3px 3px 0 ${B}`;
                e.currentTarget.style.transform = "translate(-1px, -1px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = W;
                e.currentTarget.style.boxShadow = `2px 2px 0 ${B}`;
                e.currentTarget.style.transform = "none";
              }}
              style={{
                position: "absolute",
                right: 64,
                background: W,
                color: B,
                border: `2px solid ${B}`,
                padding: "4px 12px",
                fontFamily: "'IBM Plex Mono', monospace",
                fontWeight: 700,
                fontSize: "0.6rem",
                letterSpacing: "0.05em",
                cursor: "pointer",
                boxShadow: `2px 2px 0 ${B}`,
                transition: "transform 0.1s, box-shadow 0.1s, background 0.1s",
              }}
            >
              UPGRADE TO PRO →
            </button>
            //<Button variant="green" >Upgrade to Pro →</Button>
          )}
        </div>
      )}

      <div
        style={{
          flex: 1,
          overflowY: "auto",
          background: "#f5f5f0",
          padding: "40px 64px",
        }}
        className="freshr-scroll"
      >
        {/* Title + primary action */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            marginBottom: 24,
            gap: 24,
          }}
        >
          <div>
            <h1
              style={{
                fontFamily: "'Syne', sans-serif",
                fontWeight: 800,
                fontSize: "2rem",
                letterSpacing: "-0.02em",
                margin: 0,
                lineHeight: 1,
              }}
            >
              My Notebooks
            </h1>
            <p
              style={{
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: "0.7rem",
                color: "#888",
                margin: "6px 0 0",
              }}
            >
              {notebooks.length}{" "}
              {notebooks.length === 1 ? "notebook" : "notebooks"}
            </p>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: 16,
              flexShrink: 0,
            }}
          >
            <NewNotebookButton onClick={handleCreateRequest} />
          </div>
        </div>

        {/* Controls: search left, view toggle right */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 28,
          }}
        >
          <div style={{ position: "relative", width: 320 }}>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search notebooks..."
              onMouseEnter={(e) => {
                if (document.activeElement !== e.currentTarget)
                  e.currentTarget.style.borderColor = G;
              }}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = B)}
              onFocus={(e) => (e.currentTarget.style.borderColor = B)}
              style={{
                width: "100%",
                border: `2px solid ${B}`,
                background: W,
                color: B,
                borderRadius: 0,
                padding: "8px 12px 8px 32px",
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: "0.72rem",
                outline: "none",
                boxSizing: "border-box",
                transition: "border-color 0.15s",
              }}
            />
            <svg
              width="13"
              height="13"
              viewBox="0 0 14 14"
              fill="none"
              style={{
                position: "absolute",
                left: 10,
                top: "50%",
                transform: "translateY(-50%)",
                pointerEvents: "none",
              }}
            >
              <circle cx="6" cy="6" r="4.5" stroke="#aaa" strokeWidth="1.5" />
              <path
                d="M10 10l2.5 2.5"
                stroke="#aaa"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </div>

          <div style={{ display: "flex", border: `2px solid ${B}` }}>
            <button
              onClick={() => setView("grid")}
              onMouseEnter={(e) => {
                if (view !== "grid") e.currentTarget.style.background = "#eee";
              }}
              onMouseLeave={(e) => {
                if (view !== "grid") e.currentTarget.style.background = W;
              }}
              style={{
                background: view === "grid" ? B : W,
                color: view === "grid" ? W : B,
                border: "none",
                padding: "8px 10px",
                cursor: "pointer",
                lineHeight: 1,
                transition: "background 0.12s",
              }}
              title="Grid view"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 14 14"
                fill="currentColor"
              >
                <rect x="0" y="0" width="6" height="6" />
                <rect x="8" y="0" width="6" height="6" />
                <rect x="0" y="8" width="6" height="6" />
                <rect x="8" y="8" width="6" height="6" />
              </svg>
            </button>
            <button
              onClick={() => setView("list")}
              onMouseEnter={(e) => {
                if (view !== "list") e.currentTarget.style.background = "#eee";
              }}
              onMouseLeave={(e) => {
                if (view !== "list") e.currentTarget.style.background = W;
              }}
              style={{
                background: view === "list" ? B : W,
                color: view === "list" ? W : B,
                border: "none",
                borderLeft: `1px solid ${B}`,
                padding: "8px 10px",
                cursor: "pointer",
                lineHeight: 1,
                transition: "background 0.12s",
              }}
              title="List view"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 14 14"
                fill="currentColor"
              >
                <rect x="0" y="0" width="14" height="2.5" />
                <rect x="0" y="5.75" width="14" height="2.5" />
                <rect x="0" y="11.5" width="14" height="2.5" />
              </svg>
            </button>
          </div>
        </div>

        {/* Notebook grid / list */}
        {view === "grid" ? (
          <div
            className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3"
            style={{ gap: 20 }}
          >
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
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
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

        <ArchivedSection
          notebooks={archivedNotebooks}
          onUnarchive={handleUnarchive}
        />
      </div>

      {showUpgradeModal && (
        <UpgradeModal
          title="Notebook limit reached"
          description="You've used all your notebook slots on the free plan. Upgrade to Pro to create unlimited notebooks and unlock more storage and daily quizzes."
          onClose={() => setShowUpgradeModal(false)}
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
