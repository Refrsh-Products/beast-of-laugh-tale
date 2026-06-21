import { cn } from "../../lib/utils";

export type ProfileTab = "profile" | "account" | "payment" | "support";

interface ProfileSidebarProps {
  avatar: string;
  name: string;
  email: string;
  plan: string;
  activeTab: ProfileTab;
  onTabChange: (tab: ProfileTab) => void;
}

const NAV_ITEMS: { id: ProfileTab; label: string }[] = [
  { id: "profile", label: "Profile" },
  { id: "account", label: "Account" },
  { id: "payment", label: "Upgrade Plan" },
  { id: "support", label: "Support" },
];

export default function ProfileSidebar({
  avatar,
  name,
  email,
  plan,
  activeTab,
  onTabChange,
}: ProfileSidebarProps) {
  const isUrl = avatar.startsWith("http");

  return (
    <div className="w-60 shrink-0 border-r border-border bg-card flex flex-col p-5 gap-1">
      {/* Avatar */}
      <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center text-base font-semibold text-foreground overflow-hidden select-none shrink-0 mb-3">
        {isUrl ? (
          <img
            src={avatar}
            alt={name}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover"
          />
        ) : (
          avatar
        )}
      </div>

      {/* Name */}
      <p className="text-sm font-medium text-foreground leading-snug break-words">
        {name || "Your Name"}
      </p>

      {/* Email */}
      <p className="text-xs text-muted-foreground break-all leading-relaxed">
        {email}
      </p>

      {/* Plan badge */}
      <span className={cn(
        "self-start mt-1 mb-4 text-xs rounded-full px-2.5 py-0.5 border",
        plan === "FREE"
          ? "bg-secondary text-muted-foreground border-border"
          : "bg-primary/10 text-primary border-primary/20",
      )}>
        {plan} PLAN
      </span>

      <div className="h-px bg-border mb-2" />

      {/* Nav */}
      <nav className="flex flex-col gap-0.5">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.id}
            onClick={() => onTabChange(item.id)}
            className={cn(
              "w-full text-left px-3 py-2 text-sm rounded-md transition-colors",
              activeTab === item.id
                ? "bg-secondary text-foreground font-medium"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary/50",
            )}
          >
            {item.label}
          </button>
        ))}
      </nav>
    </div>
  );
}
