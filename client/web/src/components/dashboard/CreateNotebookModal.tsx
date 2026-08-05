import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function CreateNotebookModal({
  title,
  error,
  onTitleChange,
  onSubmit,
  onClose,
}: {
  title: string;
  error: string;
  onTitleChange: (val: string) => void;
  onSubmit: () => void;
  onClose: () => void;
}) {
  return (
    <Dialog open onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="sm:max-w-md">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit();
          }}
          className="flex flex-col gap-6"
        >
          <DialogHeader>
            <DialogTitle>Create a notebook</DialogTitle>
            <DialogDescription>
              Give it a name you'll recognise later — you can rename it any time.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-2">
            <Label htmlFor="notebook-title">Title</Label>
            <Input
              id="notebook-title"
              autoFocus
              value={title}
              onChange={(e) => onTitleChange(e.target.value)}
              placeholder="e.g. Cellular Structures"
              aria-invalid={!!error}
              aria-describedby={error ? "notebook-title-error" : undefined}
            />
            {error && (
              <p
                id="notebook-title-error"
                role="alert"
                className="text-destructive text-sm"
              >
                {error}
              </p>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">Create notebook</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
