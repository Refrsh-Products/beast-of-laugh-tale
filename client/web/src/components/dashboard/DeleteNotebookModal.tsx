import type { Notebook } from "@freshr/shared";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function DeleteNotebookModal({
  notebook,
  onConfirm,
  onClose,
}: {
  notebook: Notebook;
  onConfirm: () => void;
  onClose: () => void;
}) {
  return (
    <Dialog open onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Delete “{notebook.title}”?</DialogTitle>
          <DialogDescription>
            This permanently removes the notebook and every file, quiz and
            presentation inside it. This cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={onConfirm}>
            Delete notebook
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
