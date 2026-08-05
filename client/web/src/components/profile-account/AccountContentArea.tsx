import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import useAccountService from "../../services/account";
import useAuthService from "../../services/auth";
import type { ProfileTab } from "./ProfileSidebar";
import type { StoredAccount } from "@freshr/shared";
import { getAccount as getCachedAccount } from "../../storage";
import { Button } from "@/components/ui/button";
import { RiLogoutBoxLine } from "@remixicon/react";

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

  useEffect(() => {
    accountService
      .getAccount()
      .then((res) => {
        if (res) setAccount(res.account);
      })
      .catch(() => {});
  }, []);

  if (activeTab !== "account") return null;

  const planLabel = account?.tier_plan ?? "FREE";

  function handleLogout() {
    authService.logout();
    navigate("/login");
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

      <Button variant="destructive" className="w-full" onClick={handleLogout}>
        <RiLogoutBoxLine aria-hidden="true" />
        Log out
      </Button>
    </>
  );
}
