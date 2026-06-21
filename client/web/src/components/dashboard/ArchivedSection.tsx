import type { Notebook } from "@freshr/shared";
import Button from "../ui/Button";

interface ArchivedSectionProps {
  notebooks: Notebook[];
  onUnarchive: (id: string) => void;
}

export default function ArchivedSection({ notebooks, onUnarchive }: ArchivedSectionProps) {
  if (notebooks.length === 0) return null;

  return (
    <div className="mt-10">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
        Archived <span className="font-normal">({notebooks.length})</span>
      </p>
      <div className="flex flex-col gap-1.5">
        {notebooks.map((nb) => (
          <div
            key={nb.id}
            className="flex items-center gap-3 rounded-md border border-border bg-card/50 px-4 py-2.5"
          >
            <span className="flex-1 min-w-0 truncate text-sm text-muted-foreground">
              {nb.title}
            </span>
            <Button variant="default" onClick={() => onUnarchive(nb.id)}>
              Unarchive
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
