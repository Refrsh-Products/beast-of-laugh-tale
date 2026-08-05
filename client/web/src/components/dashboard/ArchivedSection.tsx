import type { Notebook } from "@freshr/shared";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { RiArchive2Line, RiInboxUnarchiveLine } from "@remixicon/react";
import { formatRelativeTime } from "@/lib/formatRelativeTime";
import EmptyState from "./EmptyState";

/**
 * The archived tab panel. Archived notebooks are read-only here — the single
 * action is restoring one, which can fail on quota, so the parent owns it.
 */
export default function ArchivedSection({
  notebooks,
  onUnarchive,
}: {
  notebooks: Notebook[];
  onUnarchive: (id: string) => void;
}) {
  if (notebooks.length === 0) {
    return (
      <EmptyState
        icon={<RiArchive2Line className="size-6" aria-hidden="true" />}
        title="Nothing archived"
        description="Notebooks you archive are kept here so you can restore them later."
      />
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      {notebooks.map((notebook) => (
        <Card
          key={notebook.id}
          className="flex-row items-center justify-between gap-3 p-4"
        >
          <div className="flex min-w-0 flex-col gap-0.5">
            <span className="truncate font-semibold">{notebook.title}</span>
            <span className="text-muted-foreground truncate text-xs">
              Archived · Edited {formatRelativeTime(notebook.updated_at)}
            </span>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="shrink-0"
            onClick={() => onUnarchive(notebook.id)}
          >
            <RiInboxUnarchiveLine aria-hidden="true" />
            Restore
          </Button>
        </Card>
      ))}
    </div>
  );
}
