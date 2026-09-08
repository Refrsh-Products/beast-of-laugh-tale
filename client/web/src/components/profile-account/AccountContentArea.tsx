import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import useAccountService from "../../services/account";
import useAuthService from "../../services/auth";
import type { ProfileTab } from "./ProfileSidebar";
import {
  COMMUNITY_OFF,
  type CommunityStatus,
  type StoredAccount,
} from "@freshr/shared";
import { getAccount as getCachedAccount } from "../../storage";
import { Button } from "@/components/ui/button";
import { RiLogoutBoxLine, RiGroupLine } from "@remixicon/react";

interface AccountContentAreaProps {
  activeTab: ProfileTab;
}

function formatMemberSince(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
    });
  } catch {
    return "—";
  }
}

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString("en-US", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return "—";
  }
}

function ReadOnlyRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-border border-b pb-5">
      <div className="text-muted-foreground mb-2 text-xs font-semibold tracking-[0.14em] uppercase">
        {label}
      </div>
      <div className="text-foreground text-sm">{value || "—"}</div>
    </div>
  );
}

export default function AccountContentArea({
  activeTab,
}: AccountContentAreaProps) {
  const authService = useAuthService();
  const accountService = useAccountService();
  const navigate = useNavigate();
  const user = authService.getUser();
  const [account, setAccount] = useState<StoredAccount | null>(
    getCachedAccount(),
  );
  const [community, setCommunity] = useState<CommunityStatus>(COMMUNITY_OFF);

  useEffect(() => {
    accountService
      .getAccount()
      .then((res) => {
        if (res) setAccount(res.account);
      })
      .catch(() => {});
    // No .catch — getCommunity resolves to COMMUNITY_OFF rather than rejecting.
    accountService.getCommunity().then(setCommunity);
  }, []);

  if (activeTab !== "account") return null;

  const planLabel = account?.tier_plan ?? "FREE";

  function handleLogout() {
    authService.logout();
    navigate("/login");
  }

  function handleOpenCommunity() {
    // First statement in the gesture, before any await — see OnboardingPage.
    window.open(community.invite_url, "_blank", "noopener,noreferrer");
    accountService
      .joinCommunity()
      .then(setCommunity)
      .catch(() => {});
  }

  return (
    <>
      <h2 className="font-heading text-foreground mb-8 text-2xl leading-tight font-bold tracking-tight">
        Account
      </h2>

      <div className="mb-10 flex flex-col">
        <ReadOnlyRow label="Email" value={user?.email ?? ""} />
        <ReadOnlyRow label="Plan" value={planLabel} />
        <ReadOnlyRow
          label="Member since"
          value={user?.created_at ? formatMemberSince(user.created_at) : "—"}
        />
      </div>

      {community.enabled && (
        <div className="border-border mb-10 rounded-2xl border p-5">
          <div className="mb-1.5 flex items-center gap-2">
            <RiGroupLine
              aria-hidden="true"
              className="text-muted-foreground size-4 shrink-0"
            />
            <h3 className="text-foreground text-sm font-semibold">
              WhatsApp community
            </h3>
          </div>
          <p className="text-muted-foreground mb-4 text-sm leading-relaxed">
            {community.opted_in_at
              ? // Never "you're a member" — we only know we opened the invite.
                `You opened the invite on ${formatDate(community.opted_in_at)}. Not in the group? Open it again.`
              : community.message}
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={handleOpenCommunity}
          >
            {community.opted_in_at ? "Open the invite again" : "Join on WhatsApp"}
          </Button>
        </div>
      )}

      <Button variant="destructive" className="w-full" onClick={handleLogout}>
        <RiLogoutBoxLine aria-hidden="true" />
        Log out
      </Button>
    </>
  );
}
