import { useState, useEffect } from "react";
import { useNavigate, useLocation, Navigate } from "react-router-dom";
import useAuthService from "../services/auth";
import useAccountService from "../services/account";
import type { StoredAccount } from "../storage";
import ProfileSidebar, {
  type ProfileTab,
} from "../components/profile-account/ProfileSidebar";
import ProfileContentArea from "../components/profile-account/ProfileContentArea";
import AccountContentArea from "../components/profile-account/AccountContentArea";
import PaymentContentArea from "../components/payment/PaymentContentArea";
import SupportContentArea from "../components/profile-account/SupportContentArea";
import MobileDrawer from "../components/ui/MobileDrawer";
import { track } from "../lib/analytics";
import { useMediaQuery } from "../hooks/useMediaQuery";
import { BP_TABLET } from "../constants/breakpoints";

const B = "#000000";
const W = "#FFFFFF";

export default function ProfilePage() {
  const authService = useAuthService();
  const accountService = useAccountService();
  const navigate = useNavigate();
  const user = authService.getUser();
  const [account, setAccount] = useState<StoredAccount | null>(null);

  const name = account
    ? `${account.first_name} ${account.last_name}`.trim()
    : "";
  const location = useLocation();
  const initialTab =
    (location.state as { tab?: ProfileTab } | null)?.tab ?? "profile";
  const [activeTab, setActiveTab] = useState<ProfileTab>(initialTab);
  const [success, setSuccess] = useState<string | null>(null);
  const isCompact = useMediaQuery(BP_TABLET);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    accountService.getAccount()
      .then((res) => { if (res) setAccount(res.account); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!success) return;
    const timer = setTimeout(() => setSuccess(null), 3000);
    return () => clearTimeout(timer);
  }, [success]);

  useEffect(() => {
    if (activeTab === "payment") track("upgrade-plan-viewed");
  }, [activeTab]);

  if (!authService.isLoggedIn()) return <Navigate to="/login" replace />;

  const avatarLetter = (name || user?.email || "?")[0].toUpperCase();
  // Use the URL if it exists and isn't an empty string, otherwise fallback to the letter
  const avatar =
    account?.profile_picture_url && account.profile_picture_url.trim() !== ""
      ? account.profile_picture_url
      : avatarLetter;
  const planLabel = account?.tier_plan ?? "FREE";

  const handleTabChange = (tab: ProfileTab) => {
    setActiveTab(tab);
    if (isCompact) setDrawerOpen(false);
  };

  return (
    <div
      style={{
        minHeight: "100dvh",
        display: "flex",
        flexDirection: "column",
        background: "#f5f5f0",
        fontFamily: "'IBM Plex Mono', monospace",
      }}
    >
      {/* Top bar */}
      <div
        style={{
          background: W,
          borderBottom: `3px solid ${B}`,
          padding: isCompact ? "12px 16px" : "16px 32px",
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          gap: 12,
        }}
      >
        {isCompact && (
          <button
            onClick={() => setDrawerOpen(true)}
            aria-label="Open menu"
            style={{
              background: W,
              border: `2px solid ${B}`,
              padding: "4px 10px",
              cursor: "pointer",
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: "1rem",
              lineHeight: 1,
              color: B,
            }}
          >
            ☰
          </button>
        )}
        <span
          onClick={() => navigate("/dashboard")}
          onMouseEnter={(e) =>
            (e.currentTarget.style.textDecoration = "underline")
          }
          onMouseLeave={(e) => (e.currentTarget.style.textDecoration = "none")}
          style={{
            fontSize: "0.78rem",
            fontWeight: 700,
            color: B,
            cursor: "pointer",
            letterSpacing: "0.04em",
            textDecoration: "none",
            textUnderlineOffset: "3px",
          }}
        >
          ← Back to dashboard
        </span>
      </div>

      {/* Two-panel layout */}
      <div style={{ display: "flex", flex: 1, minHeight: 0 }}>
        {isCompact ? (
          <MobileDrawer
            open={drawerOpen}
            onClose={() => setDrawerOpen(false)}
            width="min(240px, 85vw)"
            ariaLabel="Profile navigation"
          >
            <ProfileSidebar
              avatar={avatar}
              name={name}
              email={user?.email ?? ""}
              plan={planLabel}
              activeTab={activeTab}
              onTabChange={handleTabChange}
            />
          </MobileDrawer>
        ) : (
          <ProfileSidebar
            avatar={avatar}
            name={name}
            email={user?.email ?? ""}
            plan={planLabel}
            activeTab={activeTab}
            onTabChange={handleTabChange}
          />
        )}

        {/* Content area */}
        <div
          style={{
            flex: 1,
            padding: isCompact ? "24px 16px" : "48px",
            overflowY: "auto",
            display: "flex",
            justifyContent: "center",
            minWidth: 0,
          }}
        >
          <div
            style={{
              width: "100%",
              maxWidth:
                activeTab === "payment"
                  ? 800
                  : activeTab === "support"
                    ? 640
                    : 420,
            }}
          >
            {/* ── Profile tab content area ── */}
            <ProfileContentArea activeTab={activeTab} />

            {/* ── Account tab content area ── */}
            <AccountContentArea activeTab={activeTab} />

            {/* ── Payment tab content area ── */}
            <PaymentContentArea activeTab={activeTab} />

            {/* ── Support tab content area ── */}
            <SupportContentArea
              activeTab={activeTab}
              defaultName={name}
              defaultEmail={user?.email ?? ""}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
