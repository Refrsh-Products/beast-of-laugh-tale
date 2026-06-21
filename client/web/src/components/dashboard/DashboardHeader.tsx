import { Search, LayoutGrid, AlignJustify } from "lucide-react";
import { Input } from "../ui/input";
import { cn } from "../../lib/utils";

interface DashboardHeaderProps {
  notebookCount: number;
  searchQuery: string;
  view: "grid" | "list";
  onSearchChange: (val: string) => void;
  onViewChange: (view: "grid" | "list") => void;
}

export default function DashboardHeader({
  notebookCount,
  searchQuery,
  view,
  onSearchChange,
  onViewChange,
}: DashboardHeaderProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">My Notebooks</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          {notebookCount} {notebookCount === 1 ? "notebook" : "notebooks"}
        </p>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
          <Input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search notebooks..."
            className="pl-8 w-52"
          />
        </div>

        <div className="flex rounded-md border border-border overflow-hidden">
          <button
            onClick={() => onViewChange("grid")}
            title="Grid view"
            className={cn(
              "p-2 transition-colors",
              view === "grid"
                ? "bg-secondary text-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary/50",
            )}
          >
            <LayoutGrid className="h-4 w-4" />
          </button>
          <button
            onClick={() => onViewChange("list")}
            title="List view"
            className={cn(
              "p-2 border-l border-border transition-colors",
              view === "list"
                ? "bg-secondary text-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary/50",
            )}
          >
            <AlignJustify className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
