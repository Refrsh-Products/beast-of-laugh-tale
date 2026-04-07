const G = "#84e487";
const B = "#000000";
const W = "#FFFFFF";

export type ProfileTab = "profile" | "account" | "payment";

interface ProfileSidebarProps {
  avatar: string;
  name: string;
  email: string;
  plan: string;
  activeTab: ProfileTab;
  onTabChange: (tab: ProfileTab) => void;
}

function NavItem({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <div
      onClick={onClick}
      style={{
        padding: "10px 0 10px 14px",
        borderLeft: `3px solid ${active ? B : "transparent"}`,
        fontFamily: "'IBM Plex Mono', monospace",
        fontSize: "0.72rem",
        fontWeight: 700,
        letterSpacing: "0.1em",
        color: active ? B : "#aaa",
        cursor: "pointer",
        userSelect: "none",
      }}
    >
      {label}
    </div>
  );
}

export default function ProfileSidebar({
  avatar,
  name,
  email,
  plan,
  activeTab,
  onTabChange,
}: ProfileSidebarProps) {
  return (
    <div
      style={{
        width: 220,
        minWidth: 220,
        background: W,
        borderRight: `2px solid ${B}`,
        padding: "40px 24px",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Avatar */}
      <div
        style={{
          width: 60,
          height: 60,
          background: G,
          border: `3px solid ${B}`,
          borderRadius: "50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
          position: "relative",
          fontFamily: "'Syne', sans-serif",
          fontWeight: 800,
          fontSize: "1.4rem",
          color: B,
          boxShadow: `3px 3px 0 ${B}`,
          userSelect: "none",
          marginBottom: 16,
          flexShrink: 0,
        }}
      >
        {avatar.startsWith("http") ? (
          <img
            src={avatar}
            alt={name}
            referrerPolicy="no-referrer"
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        ) : (
          avatar // This is the single letter fallback
        )}
      </div>

      {/* Name */}
      <div
        style={{
          fontFamily: "'Syne', sans-serif",
          fontWeight: 800,
          fontSize: "1rem",
          letterSpacing: "-0.01em",
          lineHeight: 1.2,
          marginBottom: 6,
          wordBreak: "break-word",
        }}
      >
        {name || "Your Name"}
      </div>

      {/* Email */}
      <div
        style={{
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: "0.72rem",
          color: "#888",
          marginBottom: 16,
          wordBreak: "break-all",
          lineHeight: 1.6,
        }}
      >
        {email}
      </div>

      {/* Plan badge */}
      <div
        style={{
          display: "inline-block",
          border: `2px solid ${B}`,
          padding: "4px 10px",
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: "0.62rem",
          fontWeight: 700,
          letterSpacing: "0.1em",
          background: plan === "FREE" ? W : G,
          marginBottom: 32,
          alignSelf: "flex-start",
        }}
      >
        {plan} PLAN
      </div>

      {/* Divider */}
      <div style={{ height: 1, background: "#e5e5e5", marginBottom: 16 }} />

      {/* Nav */}
      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <NavItem
          label="PROFILE"
          active={activeTab === "profile"}
          onClick={() => onTabChange("profile")}
        />
        <NavItem
          label="ACCOUNT"
          active={activeTab === "account"}
          onClick={() => onTabChange("account")}
        />
        <NavItem
          label="UPGADE PLAN"
          active={activeTab === "payment"}
          onClick={() => onTabChange("payment")}
        />
      </div>
    </div>
  );
}
