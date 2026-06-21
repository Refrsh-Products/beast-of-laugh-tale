import { Plus } from "lucide-react";

export default function CreateCard({ onCreate }: { onCreate: () => void }) {
  return (
    <button
      onClick={onCreate}
      className="flex h-36 w-full flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border text-left transition-all hover:border-primary/50 hover:bg-secondary/30"
    >
      <Plus className="h-5 w-5 text-muted-foreground" />
      <span className="text-sm text-muted-foreground">New notebook</span>
    </button>
  );
}
