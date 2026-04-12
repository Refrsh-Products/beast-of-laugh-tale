import { useState, useEffect } from "react";
import { useNavigate, useLocation, Navigate } from "react-router-dom";
import useAuthService from "../services/auth";
import useAccountService from "../services/account";
import ProfileSidebar, {
  type ProfileTab,
} from "../components/profile-account/ProfileSidebar";
import ProfileContentArea from "../components/profile-account/ProfileContentArea";
import AccountContentArea from "../components/profile-account/AccountContentArea";
import PaymentContentArea from "../components/payment/PaymentContentArea";

const B = "#000000";
const W = "#FFFFFF";

export default function ProfilePage() {
  const authService = useAuthService();
  const accountService = useAccountService();
  const navigate = useNavigate();
  const user = authService.getUser();
  const account = accountService.getAccount();

  const name = account
    ? `${account.first_name} ${account.last_name}`.trim()
    : "";
  const location = useLocation();
  const initialTab =
    (location.state as { tab?: ProfileTab } | null)?.tab ?? "profile";
  const [activeTab, setActiveTab] = useState<ProfileTab>(initialTab);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (!success) return;
    const timer = setTimeout(() => setSuccess(null), 3000);
    return () => clearTimeout(timer);
  }, [success]);

  if (!authService.isLoggedIn()) return <Navigate to="/login" replace />;

  const avatarLetter = (name || user?.email || "?")[0].toUpperCase();
  // Use the URL if it exists and isn't an empty string, otherwise fallback to the letter
  const avatar =
    account?.profile_picture_url && account.profile_picture_url.trim() !== ""
      ? account.profile_picture_url
      : avatarLetter;
  const planLabel = account?.tier_plan ?? "FREE";

  return (
    <div
      style={{
        minHeight: "100vh",
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
          padding: "16px 32px",
          flexShrink: 0,
        }}
      >
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
      <div style={{ display: "flex", flex: 1 }}>
        <ProfileSidebar
          avatar={avatar}
          name={name}
          email={user?.email ?? ""}
          plan={planLabel}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />

        {/* Content area */}
        <div
          style={{
            flex: 1,
            padding: "48px",
            overflowY: "auto",
            display: "flex",
            justifyContent: "center",
          }}
        >
          <div style={{ width: "100%", maxWidth: 420 }}>
            {/* ── Profile tab content area ── */}
            <ProfileContentArea activeTab={activeTab} />

            {/* ── Account tab content area ── */}
            <AccountContentArea activeTab={activeTab} />

            {/* ── Payment tab content area ── */}
            <PaymentContentArea activeTab={activeTab} />
          </div>
        </div>
      </div>
    </div>
  );
}
