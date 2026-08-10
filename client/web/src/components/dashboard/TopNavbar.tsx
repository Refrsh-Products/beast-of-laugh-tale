import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Avatar, AvatarImage, AvatarFallback } from "../ui/avatar";
import freshrLogoForNav from "../../assets/freshrLogoForNav.svg";

interface TopNavbarProps {
  userEmail: string;
  userName?: string;
  profilePictureUrl?: string;
}

export default function TopNavbar({ userEmail, userName, profilePictureUrl }: TopNavbarProps) {
  const navigate = useNavigate();
  const displayLabel = userName?.trim() || userEmail;
  const avatarLetter = (userName || userEmail || "?")[0].toUpperCase();
  const [avatarError, setAvatarError] = useState(false);

  const hasAvatar = !!profilePictureUrl && profilePictureUrl.trim() !== "" && !avatarError;

  useEffect(() => {
    setAvatarError(false);
  }, [profilePictureUrl]);

  return (
    <header className="sticky top-0 z-10 flex h-14 shrink-0 items-center justify-between border-b border-border bg-background/80 px-6 backdrop-blur-sm">
      <button
        onClick={() => navigate("/dashboard")}
        className="flex items-center gap-1.5 select-none"
      >
        <img src={freshrLogoForNav} alt="Freshr" className="h-7 w-auto" />
        <span className="self-start mt-0.5 rounded-sm bg-secondary px-1 py-px text-[10px] font-semibold text-muted-foreground">
          BETA
        </span>
      </button>

      <button
        onClick={() => navigate("/profile")}
        className="flex items-center gap-2 rounded-md px-2 py-1.5 transition-colors hover:bg-secondary select-none"
      >
        <Avatar className="h-7 w-7">
          {hasAvatar && (
            <AvatarImage
              src={profilePictureUrl}
              alt={displayLabel}
              onError={() => setAvatarError(true)}
            />
          )}
          <AvatarFallback className="text-xs">{avatarLetter}</AvatarFallback>
        </Avatar>
        <span className="hidden sm:block max-w-36 truncate text-sm text-foreground">
          {displayLabel}
        </span>
      </button>
    </header>
  );
}
