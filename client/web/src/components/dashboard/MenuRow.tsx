import { cn } from "../../lib/utils";

interface MenuRowProps {
  label: string;
  action: () => void;
  isDelete?: boolean;
}

export default function MenuRow({ label, action, isDelete = false }: MenuRowProps) {
  return (
    <button
      onClick={action}
      className={cn(
        "w-full px-3 py-2 text-left text-sm transition-colors",
        isDelete
          ? "text-destructive hover:bg-destructive/10"
          : "text-foreground hover:bg-secondary",
      )}
    >
      {label}
    </button>
  );
}
