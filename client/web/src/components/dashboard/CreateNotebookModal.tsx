import { createPortal } from "react-dom";
import Button from "../ui/Button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { cn } from "../../lib/utils";

interface CreateNotebookModalProps {
  title: string;
  error: string;
  onTitleChange: (val: string) => void;
  onSubmit: () => void;
  onClose: () => void;
}

export default function CreateNotebookModal({
  title,
  error,
  onTitleChange,
  onSubmit,
  onClose,
}: CreateNotebookModalProps) {
  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onMouseDown={onClose}
    >
      <div
        className="w-full max-w-md rounded-lg border border-border bg-card p-6 shadow-xl"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <h2 className="text-base font-semibold text-foreground mb-5">New notebook</h2>

        <form
          onSubmit={(e) => { e.preventDefault(); onSubmit(); }}
          className="flex flex-col gap-4"
        >
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="notebook-title">Title</Label>
            <Input
              id="notebook-title"
              autoFocus
              type="text"
              value={title}
              onChange={(e) => onTitleChange(e.target.value)}
              placeholder="e.g. Physics — Semester 2"
              className={cn(error && "border-destructive focus:ring-destructive")}
            />
            {error && <p className="text-xs text-destructive">{error}</p>}
          </div>

          <div className="flex justify-end gap-2 mt-2">
            <Button variant="default" type="button" onClick={onClose}>Cancel</Button>
            <Button variant="green" type="submit">Create →</Button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  );
}
