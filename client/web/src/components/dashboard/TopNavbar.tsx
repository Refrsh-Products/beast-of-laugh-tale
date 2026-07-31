import { useNavigate } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import FullLogoMark from "../logo/FullLogoMark";
import { RiUser3Line, RiLifebuoyLine, RiLogoutBoxRLine } from "@remixicon/react";

interface TopNavbarProps {
  userEmail: string;
  userName?: string;
  profilePictureUrl?: string;
  onLogout?: () => void;
}

export default function TopNavbar({
  userEmail,
  userName,
  profilePictureUrl,
  onLogout,
}: TopNavbarProps) {
  const navigate = useNavigate();
  const displayLabel = userName?.trim() || userEmail;
  const initial = (userName || userEmail || "?").trim()[0]?.toUpperCase() ?? "?";

  return (
    <header className="bg-card border-border flex h-14 shrink-0 items-center justify-between gap-4 border-b px-4 md:px-8">
      <button
        type="button"
        onClick={() => navigate("/dashboard")}
        aria-label="FRESHR dashboard"
        className="text-primary flex cursor-pointer items-start gap-2"
      >
        <FullLogoMark className="h-5 md:h-6" />
        <Badge
          variant="secondary"
          className="hidden text-[0.6rem] font-bold sm:inline-flex"
        >
          BETA
        </Badge>
      </button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-auto gap-2 px-2 py-1.5">
            <Avatar className="size-7">
              {/* AvatarImage removes itself when the URL fails to load, so the
                  fallback initial covers the broken-image case for free. */}
              <AvatarImage src={profilePictureUrl} alt="" />
              <AvatarFallback className="bg-secondary text-secondary-foreground text-xs font-semibold">
                {initial}
              </AvatarFallback>
            </Avatar>
            <span className="text-muted-foreground hidden max-w-40 truncate text-sm md:inline">
              {displayLabel}
            </span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel className="flex flex-col gap-0.5">
            <span className="truncate font-semibold">{displayLabel}</span>
            {userName?.trim() && (
              <span className="text-muted-foreground truncate text-xs font-normal">
                {userEmail}
              </span>
            )}
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={() => navigate("/profile")}>
            <RiUser3Line aria-hidden="true" />
            Profile &amp; account
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => navigate("/support")}>
            <RiLifebuoyLine aria-hidden="true" />
            Support
          </DropdownMenuItem>
          {onLogout && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" onSelect={onLogout}>
                <RiLogoutBoxRLine aria-hidden="true" />
                Log out
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
