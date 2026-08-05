import { useNavigate } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import NotebookTitle from "./NotebookTitle";
import { RiMenuLine, RiArchive2Line } from "@remixicon/react";

export default function NotebookTopBar({
  title,
  onTitleSave,
  isArchived,
  profilePictureUrl,
  userLabel,
  onOpenSidebar,
  titleEditSignal,
}: {
  title: string;
  onTitleSave: (next: string) => void;
  isArchived: boolean;
  profilePictureUrl?: string;
  userLabel: string;
  /** Only supplied on compact widths, where the sidebar lives in a drawer. */
  onOpenSidebar?: () => void;
  /** Bumped by the rail's "Rename" action to open the title editor. */
  titleEditSignal?: number;
}) {
  const navigate = useNavigate();
  const initial = userLabel.trim()[0]?.toUpperCase() ?? "?";

  return (
    <header className="bg-card border-border flex h-14 shrink-0 items-center justify-between gap-3 border-b px-3 md:px-5">
      <div className="flex min-w-0 items-center gap-2">
        {onOpenSidebar && (
          <Button
            variant="ghost"
            size="icon"
            aria-label="Open notebook panels"
            onClick={onOpenSidebar}
          >
            <RiMenuLine aria-hidden="true" />
          </Button>
        )}
        <NotebookTitle
          title={title}
          onSave={onTitleSave}
          editSignal={titleEditSignal}
        />
        {isArchived && (
          <Badge variant="outline" className="gap-1 whitespace-nowrap">
            <RiArchive2Line className="size-3" aria-hidden="true" />
            Archived
          </Badge>
        )}
      </div>

      <Button
        variant="ghost"
        aria-label="Profile and account"
        onClick={() => navigate("/profile")}
        className="h-auto shrink-0 gap-2 px-2 py-1.5"
      >
        <Avatar className="size-7">
          <AvatarImage src={profilePictureUrl} alt="" />
          <AvatarFallback className="bg-secondary text-secondary-foreground text-xs font-semibold">
            {initial}
          </AvatarFallback>
        </Avatar>
        <span className="text-muted-foreground hidden max-w-36 truncate text-sm lg:inline">
          {userLabel}
        </span>
      </Button>
    </header>
  );
}
