import { AlertTriangle } from "lucide-react";
import type { Notebook } from "@freshr/shared";
import Button from "../ui/Button";
import { DialogContent, DialogFooter } from "../ui/dialog";

interface DeleteNotebookModalProps {
  notebook: Notebook;
  onConfirm: () => void;
  onClose: () => void;
}

export default function DeleteNotebookModal({
  notebook,
  onConfirm,
  onClose,
}: DeleteNotebookModalProps) {
  return (
    <DialogContent onClose={onClose} className="max-w-sm">
      <div className="flex items-start gap-3 mb-4">
        <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
        <div>
          <p className="text-base font-semibold text-foreground">Delete notebook?</p>
          <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
            <span className="font-medium text-foreground">"{notebook.title}"</span> will be
            permanently deleted. This cannot be undone.
          </p>
        </div>
      </div>

      <DialogFooter>
        <Button variant="default" onClick={onClose}>Cancel</Button>
        <Button variant="danger" onClick={onConfirm}>Delete</Button>
      </DialogFooter>
    </DialogContent>
  );
}
