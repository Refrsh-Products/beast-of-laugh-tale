import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import useAccountService from "../../services/account";
import useAuthService from "../../services/auth";
import type { ProfileTab } from "./ProfileSidebar";
import type { StoredAccount } from "@freshr/shared";
import { getAccount as getCachedAccount } from "../../storage";
import Button from "../ui/Button";
import { Separator } from "../ui/separator";

interface AccountContentAreaProps {
  activeTab: ProfileTab;
}

function formatMemberSince(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString("en-US", { month: "long", year: "numeric" });
  } catch {
    return "—";
  }
}

function ReadOnlyRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="py-4 border-b border-border">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">{label}</p>
      <p className="text-sm text-foreground">{value || "—"}</p>
    </div>
  );
}

export default function AccountContentArea({ activeTab }: AccountContentAreaProps) {
  const authService = useAuthService();
  const accountService = useAccountService();
  const navigate = useNavigate();
  const user = authService.getUser();
  const [account, setAccount] = useState<StoredAccount | null>(getCachedAccount());

  useEffect(() => {
    accountService.getAccount()
      .then((res) => { if (res) setAccount(res.account); })
      .catch((err) => { console.error("[AccountContentArea] Failed to load account:", err); });
  }, []);

  const planLabel = account?.tier_plan ?? "FREE";

  function handleLogout() {
    authService.logout();
    navigate("/login");
  }

  if (activeTab !== "account") return null;

  return (
    <div>
      <h2 className="text-lg font-semibold text-foreground mb-6">Account</h2>

      <div className="flex flex-col mb-8">
        <ReadOnlyRow label="Email" value={user?.email ?? ""} />
        <ReadOnlyRow label="Plan" value={planLabel} />
        <ReadOnlyRow
          label="Member since"
          value={user?.created_at ? formatMemberSince(user.created_at) : "—"}
        />
      </div>

      <Separator className="mb-6" />

      <Button variant="danger" fullWidth onClick={handleLogout}>Log out</Button>
    </div>
  );
}
