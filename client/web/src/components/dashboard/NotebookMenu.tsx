import type { Notebook } from "@freshr/shared";
import MenuRow from "./MenuRow";
import { Separator } from "../ui/separator";

interface NotebookMenuProps {
  notebook: Notebook;
  top: number;
  right: number;
  onPin: () => void;
  onRename: () => void;
  onArchive: () => void;
  onDelete: () => void;
}

export default function NotebookMenu({
  notebook,
  top,
  right,
  onPin,
  onRename,
  onArchive,
  onDelete,
}: NotebookMenuProps) {
  return (
    <div
      style={{ top, right }}
      className="fixed z-50 min-w-36 overflow-hidden rounded-md border border-border bg-popover shadow-lg"
      onMouseDown={(e) => e.stopPropagation()}
    >
      <MenuRow label={notebook.pinned ? "Unpin" : "Pin"} action={onPin} />
      <MenuRow label="Rename" action={onRename} />
      <Separator />
      <MenuRow label="Archive" action={onArchive} />
      <MenuRow label="Delete" action={onDelete} isDelete />
    </div>
  );
}
