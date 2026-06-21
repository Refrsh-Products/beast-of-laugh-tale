import Button from "../ui/Button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../ui/dialog";
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
  return (
    <DialogContent onClose={onClose}>
      <DialogHeader>
        <DialogTitle>New notebook</DialogTitle>
      </DialogHeader>

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

        <DialogFooter>
          <Button variant="default" type="button" onClick={onClose}>Cancel</Button>
          <Button variant="green" type="submit">Create →</Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}
