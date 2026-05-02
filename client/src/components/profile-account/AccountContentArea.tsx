import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import useAccountService from "../../services/account";
import useAuthService from "../../services/auth";
import type { ProfileTab } from "./ProfileSidebar";
import type { StoredAccount } from "../../storage";
import { getAccount as getCachedAccount } from "../../storage";
import Button from "../ui/Button";

const B = "#000000";

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
    <div style={{ borderBottom: `2px solid ${B}`, paddingBottom: 20 }}>
      <div
        style={{
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: "0.65rem",
          fontWeight: 700,
          letterSpacing: "0.14em",
          color: "#aaa",
          marginBottom: 8,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: "0.88rem",
          color: "#888",
        }}
      >
        {value || "—"}
      </div>
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
  const [account, setAccount] = useState<StoredAccount | null>(getCachedAccount());

  useEffect(() => {
    accountService.getAccount().then((acc) => { if (acc) setAccount(acc); }).catch(() => {});
  }, []);

  const planLabel = account?.tier_plan ?? "FREE";

  function handleLogout() {
    authService.logout();
    navigate("/login");
  }

  return (
    <>
      {activeTab === "account" && (
        <>
          <h2
            style={{
              fontFamily: "'Syne', sans-serif",
              fontWeight: 800,
              fontSize: "1.5rem",
              letterSpacing: "-0.02em",
              marginBottom: 32,
              lineHeight: 1.1,
            }}
          >
            Account
          </h2>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 0,
              marginBottom: 40,
            }}
          >
            <ReadOnlyRow label="EMAIL" value={user?.email ?? ""} />
            <ReadOnlyRow label="PLAN" value={planLabel} />
            <ReadOnlyRow
              label="MEMBER SINCE"
              value={
                user?.created_at ? formatMemberSince(user.created_at) : "—"
              }
            />
          </div>

          <Button variant="danger" fullWidth onClick={handleLogout}>LOGOUT</Button>
        </>
      )}
    </>
  );
}
