import { createPortal } from "react-dom";
import { AlertTriangle } from "lucide-react";
import type { Notebook } from "@freshr/shared";
import Button from "../ui/Button";

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
  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onMouseDown={onClose}
    >
      <div
        className="w-full max-w-sm rounded-lg border border-border bg-card p-6 shadow-xl"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-3 mb-4">
          <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
          <div>
            <h2 className="text-base font-semibold text-foreground">Delete notebook?</h2>
            <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
              <span className="font-medium text-foreground">"{notebook.title}"</span> will be
              permanently deleted. This cannot be undone.
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="default" onClick={onClose}>Cancel</Button>
          <Button variant="danger" onClick={onConfirm}>Delete</Button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
