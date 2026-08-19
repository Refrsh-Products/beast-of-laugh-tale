import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

export type ProfileTab = "profile" | "account" | "payment" | "support";

interface ProfileSidebarProps {
  avatar: string;
  name: string;
  email: string;
  plan: string;
  activeTab: ProfileTab;
  onTabChange: (tab: ProfileTab) => void;
}

const TABS: Array<{ id: ProfileTab; label: string }> = [
  { id: "profile", label: "Profile" },
  { id: "account", label: "Account" },
  { id: "payment", label: "Upgrade plan" },
  { id: "support", label: "Support" },
];

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
    <button
      type="button"
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      className={cn(
        "focus-visible:ring-ring/50 cursor-pointer border-l-[3px] py-2.5 pl-3.5 text-left text-xs font-bold tracking-[0.1em] uppercase transition-colors focus-visible:ring-[3px] focus-visible:outline-none",
        active
          ? "border-primary text-foreground"
          : "text-muted-foreground hover:text-foreground border-transparent",
      )}
    >
      {label}
    </button>
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
    <div className="border-border bg-card flex w-55 min-w-55 flex-col border-r px-6 py-10">
      <Avatar className="mb-4 size-15">
        {avatar.startsWith("http") && (
          <AvatarImage src={avatar} alt={name} referrerPolicy="no-referrer" />
        )}
        <AvatarFallback className="font-heading text-xl font-bold">
          {avatar.startsWith("http") ? (name || "?").charAt(0) : avatar}
        </AvatarFallback>
      </Avatar>

      <p className="font-heading text-foreground mb-1.5 text-base leading-tight font-bold break-words">
        {name || "Your Name"}
      </p>

      <p className="text-muted-foreground mb-4 text-xs leading-relaxed break-all">
        {email}
      </p>

      <Badge
        variant={plan === "FREE" ? "outline" : "secondary"}
        className="mb-8 self-start"
      >
        {plan} plan
      </Badge>

      <Separator className="mb-4" />

      <nav className="flex flex-col gap-0.5">
        {TABS.map((tab) => (
          <NavItem
            key={tab.id}
            label={tab.label}
            active={activeTab === tab.id}
            onClick={() => onTabChange(tab.id)}
          />
        ))}
      </nav>
    </div>
  );
}
