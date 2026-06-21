import { Plus } from "lucide-react";

export default function CreateRow({ onCreate }: { onCreate: () => void }) {
  return (
    <button
      onClick={onCreate}
      className="flex w-full items-center gap-3 rounded-md border border-dashed border-border px-4 py-3 text-left transition-all hover:border-primary/50 hover:bg-secondary/30"
    >
      <Plus className="h-4 w-4 text-muted-foreground" />
      <span className="text-sm text-muted-foreground">New notebook</span>
    </button>
  );
}
