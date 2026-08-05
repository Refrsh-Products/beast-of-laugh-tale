import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import BrandMark from "../logo/BrandMark";
import ThemeToggle from "@/components/ui/ThemeToggle";
import type { ActiveView } from "./types";
import {
  RiChat3Line,
  RiChat3Fill,
  RiSurveyLine,
  RiSurveyFill,
  RiSlideshow3Line,
  RiSlideshow3Fill,
  RiMicLine,
  RiMicFill,
  RiQuestionLine,
  RiSettings3Line,
  RiPencilLine,
  RiArchive2Line,
  RiDeleteBin6Line,
  RiArrowLeftLine,
} from "@remixicon/react";

interface Tool {
  id: ActiveView;
  label: string;
  Icon: typeof RiChat3Line;
  ActiveIcon: typeof RiChat3Fill;
}

const TOOLS: Tool[] = [
  { id: "chat", label: "Chat", Icon: RiChat3Line, ActiveIcon: RiChat3Fill },
  { id: "quiz", label: "Quiz", Icon: RiSurveyLine, ActiveIcon: RiSurveyFill },
  {
    id: "presentation",
    label: "Slides",
    Icon: RiSlideshow3Line,
    ActiveIcon: RiSlideshow3Fill,
  },
  { id: "audio", label: "Audio", Icon: RiMicLine, ActiveIcon: RiMicFill },
];

export interface NotebookSettingsActions {
  onRename: () => void;
  onArchive: () => void;
  onDelete: () => void;
  isArchived: boolean;
}

export default function NotebookToolRail({
  activeView,
  onViewChange,
  settings,
}: {
  activeView: ActiveView;
  onViewChange: (view: ActiveView) => void;
  settings: NotebookSettingsActions;
}) {
  const navigate = useNavigate();

  return (
    <TooltipProvider delayDuration={300}>
      <nav
        aria-label="Notebook tools"
        className="bg-card border-border flex h-full w-20 shrink-0 flex-col items-center gap-1 border-r py-3"
      >
        <button
          type="button"
          onClick={() => navigate("/dashboard")}
          aria-label="Back to dashboard"
          className="text-primary hover:bg-accent mb-2 flex size-11 cursor-pointer items-center justify-center rounded-lg transition-colors"
        >
          <BrandMark size={48} />
        </button>

        {TOOLS.map((tool) => {
          const isActive = activeView === tool.id;
          const Glyph = isActive ? tool.ActiveIcon : tool.Icon;
          return (
            <button
              key={tool.id}
              type="button"
              onClick={() => onViewChange(tool.id)}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "focus-visible:ring-ring/50 flex w-16 cursor-pointer flex-col items-center gap-1 rounded-lg px-1 py-2 transition-colors focus-visible:ring-[3px] focus-visible:outline-none",
                isActive
                  ? "bg-secondary text-secondary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
              )}
            >
              <Glyph className="size-5" aria-hidden="true" />
              <span className="text-[0.65rem] font-semibold tracking-[0.06em] uppercase">
                {tool.label}
              </span>
            </button>
          );
        })}

        <div className="mt-auto flex flex-col items-center gap-1">
          <ThemeToggle side="right" size="icon-lg" />

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon-lg"
                aria-label="Help and support"
                onClick={() => navigate("/support")}
              >
                <RiQuestionLine aria-hidden="true" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">Help &amp; support</TooltipContent>
          </Tooltip>

          <DropdownMenu>
            <Tooltip>
              <TooltipTrigger asChild>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon-lg"
                    aria-label="Notebook settings"
                  >
                    <RiSettings3Line aria-hidden="true" />
                  </Button>
                </DropdownMenuTrigger>
              </TooltipTrigger>
              <TooltipContent side="right">Notebook settings</TooltipContent>
            </Tooltip>
            <DropdownMenuContent side="right" align="end" className="w-52">
              <DropdownMenuLabel>Notebook</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onSelect={settings.onRename}
                disabled={settings.isArchived}
              >
                <RiPencilLine aria-hidden="true" />
                Rename
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={settings.onArchive}>
                <RiArchive2Line aria-hidden="true" />
                {settings.isArchived ? "Restore" : "Archive"}
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => navigate("/dashboard")}>
                <RiArrowLeftLine aria-hidden="true" />
                Back to dashboard
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                variant="destructive"
                onSelect={settings.onDelete}
              >
                <RiDeleteBin6Line aria-hidden="true" />
                Delete notebook
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </nav>
    </TooltipProvider>
  );
}
