import { MessageSquare, BookOpen, Presentation, Mic } from "lucide-react";
import { cn } from "../../lib/utils";

export type ActiveView = "chat" | "quiz" | "presentation" | "audio";

interface NavItem {
  id: ActiveView;
  label: string;
  sublabel: string;
  icon: React.ReactNode;
}

const NAV_ITEMS: NavItem[] = [
  {
    id: "chat",
    label: "Chat",
    sublabel: "Ask questions about your notes",
    icon: <MessageSquare className="h-4 w-4 shrink-0" />,
  },
  {
    id: "quiz",
    label: "Quiz Generator",
    sublabel: "Test your knowledge",
    icon: <BookOpen className="h-4 w-4 shrink-0" />,
  },
  {
    id: "presentation",
    label: "Presentation",
    sublabel: "Generate slide decks",
    icon: <Presentation className="h-4 w-4 shrink-0" />,
  },
  {
    id: "audio",
    label: "Audio Notes",
    sublabel: "Transcribe lectures to notes",
    icon: <Mic className="h-4 w-4 shrink-0" />,
  },
];

export default function OptionsColumn({
  activeView,
  onViewChange,
}: {
  activeView: ActiveView;
  onViewChange: (view: ActiveView) => void;
}) {
  return (
    <div className="flex flex-col h-full bg-card border-r border-border overflow-hidden">
      <div className="h-11 flex items-center px-4 border-b border-border shrink-0">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Tools
        </span>
      </div>

      <div className="flex-1 overflow-y-auto p-2 flex flex-col gap-0.5">
        {NAV_ITEMS.map((item) => {
          const isActive = activeView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id)}
              className={cn(
                "flex items-start gap-3 px-3 py-2.5 rounded-md text-left w-full transition-colors",
                isActive
                  ? "bg-secondary text-foreground"
                  : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground",
              )}
            >
              <span className="mt-0.5">{item.icon}</span>
              <div>
                <p className="text-xs font-medium leading-tight">{item.label}</p>
                <p className="text-xs text-muted-foreground mt-0.5 leading-snug">{item.sublabel}</p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
