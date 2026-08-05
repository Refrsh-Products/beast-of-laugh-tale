import { useState, useEffect } from "react";
import { useLocation, Navigate, Link } from "react-router-dom";
import useAuthService from "../services/auth";
import useAccountService from "../services/account";
import type { StoredAccount } from "@freshr/shared";
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
import { Button } from "@/components/ui/button";
import { RiArrowLeftLine, RiMenuLine } from "@remixicon/react";

/** Each tab wants a different measure; billing is the widest. */
const TAB_WIDTH: Record<ProfileTab, string> = {
  profile: "max-w-105",
  account: "max-w-105",
  payment: "max-w-200",
  support: "max-w-160",
};

export default function ProfilePage() {
  const authService = useAuthService();
  const accountService = useAccountService();
  const user = authService.getUser();
  const [account, setAccount] = useState<StoredAccount | null>(null);

  const name = account
    ? `${account.first_name} ${account.last_name}`.trim()
    : "";
  const location = useLocation();
  const initialTab =
    (location.state as { tab?: ProfileTab } | null)?.tab ?? "profile";
  const [activeTab, setActiveTab] = useState<ProfileTab>(initialTab);
  const isCompact = useMediaQuery(BP_TABLET);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    accountService
      .getAccount()
      .then((res) => {
        if (res) setAccount(res.account);
      })
      .catch(() => {});
  }, []);

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

  const sidebar = (
    <ProfileSidebar
      avatar={avatar}
      name={name}
      email={user?.email ?? ""}
      plan={planLabel}
      activeTab={activeTab}
      onTabChange={handleTabChange}
    />
  );

  return (
    <div className="bg-background flex min-h-dvh flex-col">
      {/* Top bar */}
      <div className="border-border bg-card flex shrink-0 items-center gap-3 border-b px-4 py-3 sm:px-8 sm:py-4">
        {isCompact && (
          <Button
            variant="outline"
            size="icon-sm"
            aria-label="Open menu"
            onClick={() => setDrawerOpen(true)}
          >
            <RiMenuLine aria-hidden="true" />
          </Button>
        )}
        <Button variant="ghost" size="sm" asChild>
          <Link to="/dashboard">
            <RiArrowLeftLine aria-hidden="true" />
            Back to dashboard
          </Link>
        </Button>
      </div>

      {/* Two-panel layout */}
      <div className="flex min-h-0 flex-1">
        {isCompact ? (
          <MobileDrawer
            open={drawerOpen}
            onClose={() => setDrawerOpen(false)}
            width="min(240px, 85vw)"
            ariaLabel="Profile navigation"
          >
            {sidebar}
          </MobileDrawer>
        ) : (
          sidebar
        )}

        {/* Content area */}
        <div className="flex min-w-0 flex-1 justify-center overflow-y-auto px-4 py-6 sm:px-12 sm:py-12">
          <div className={`w-full ${TAB_WIDTH[activeTab]}`}>
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
