import { useNavigate } from "react-router-dom";
import useAccountService from "../../services/account";
import useAuthService from "../../services/auth";
import type { ProfileTab } from "./ProfileSidebar";

const B = "#000000";
const W = "#FFFFFF";

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
  const account = accountService.getAccount();

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

          <button
            onClick={handleLogout}
            style={{
              width: "100%",
              padding: "14px",
              background: W,
              border: `2px solid #cc0000`,
              color: "#cc0000",
              fontFamily: "'IBM Plex Mono', monospace",
              fontWeight: 700,
              fontSize: "0.78rem",
              letterSpacing: "0.08em",
              cursor: "pointer",
              boxShadow: `3px 3px 0 ${B}`,
              transition: "background 0.15s, color 0.15s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#cc0000";
              e.currentTarget.style.color = W;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = W;
              e.currentTarget.style.color = "#cc0000";
            }}
          >
            LOGOUT
          </button>
        </>
      )}
    </>
  );
}
