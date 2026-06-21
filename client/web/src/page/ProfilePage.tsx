import { useState, useEffect } from "react";
import { useNavigate, useLocation, Navigate } from "react-router-dom";
import { Menu } from "lucide-react";
import useAuthService from "../services/auth";
import useAccountService from "../services/account";
import type { StoredAccount } from "@freshr/shared";
import ProfileSidebar, { type ProfileTab } from "../components/profile-account/ProfileSidebar";
import ProfileContentArea from "../components/profile-account/ProfileContentArea";
import AccountContentArea from "../components/profile-account/AccountContentArea";
import PaymentContentArea from "../components/payment/PaymentContentArea";
import SupportContentArea from "../components/profile-account/SupportContentArea";
import MobileDrawer from "../components/ui/MobileDrawer";
import { track } from "../lib/analytics";
import { useMediaQuery } from "../hooks/useMediaQuery";
import { BP_TABLET } from "../constants/breakpoints";

export default function ProfilePage() {
  const authService = useAuthService();
  const accountService = useAccountService();
  const navigate = useNavigate();
  const user = authService.getUser();
  const [account, setAccount] = useState<StoredAccount | null>(null);

  const name = account ? `${account.first_name} ${account.last_name}`.trim() : "";
  const location = useLocation();
  const initialTab = (location.state as { tab?: ProfileTab } | null)?.tab ?? "profile";
  const [activeTab, setActiveTab] = useState<ProfileTab>(initialTab);
  const isCompact = useMediaQuery(BP_TABLET);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    accountService.getAccount()
      .then((res) => { if (res) setAccount(res.account); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (activeTab === "payment") track("upgrade-plan-viewed");
  }, [activeTab]);

  if (!authService.isLoggedIn()) return <Navigate to="/login" replace />;

  const avatarLetter = (name || user?.email || "?")[0].toUpperCase();
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
    <div className="min-h-dvh flex flex-col bg-background">
      {/* Top bar */}
      <div className="h-14 flex items-center gap-3 px-6 border-b border-border bg-card shrink-0">
        {isCompact && (
          <button
            onClick={() => setDrawerOpen(true)}
            aria-label="Open menu"
            className="flex items-center justify-center h-8 w-8 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
          >
            <Menu className="h-4 w-4" />
          </button>
        )}
        <button
          onClick={() => navigate("/dashboard")}
          className="text-xs text-muted-foreground hover:text-foreground hover:underline underline-offset-4 transition-colors"
        >
          ← Back to dashboard
        </button>
      </div>

      {/* Two-panel layout */}
      <div className="flex flex-1 min-h-0">
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
        <div className="flex-1 overflow-y-auto px-8 py-8 flex justify-center min-w-0">
          <div
            className="w-full"
            style={{
              maxWidth: activeTab === "payment" ? 800 : activeTab === "support" ? 640 : 420,
            }}
          >
            <ProfileContentArea activeTab={activeTab} />
            <AccountContentArea activeTab={activeTab} />
            <PaymentContentArea activeTab={activeTab} />
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
