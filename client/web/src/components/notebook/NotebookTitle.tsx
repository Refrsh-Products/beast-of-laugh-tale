import { useState, useRef } from "react";
import { Pencil } from "lucide-react";

interface NotebookTitleProps {
  title: string;
  onSave: (newTitle: string) => void;
}

export default function NotebookTitle({ title, onSave }: NotebookTitleProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState(title);
  const escapeRef = useRef(false);

  function startEdit() {
    setValue(title);
    setIsEditing(true);
  }

  function confirmEdit() {
    const trimmed = value.trim();
    if (trimmed && trimmed !== title) onSave(trimmed);
    setIsEditing(false);
  }

  function cancelEdit() {
    setValue(title);
    setIsEditing(false);
  }

  if (isEditing) {
    return (
      <input
        autoFocus
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") { e.preventDefault(); confirmEdit(); }
          if (e.key === "Escape") { escapeRef.current = true; e.currentTarget.blur(); }
        }}
        onBlur={() => {
          if (escapeRef.current) { escapeRef.current = false; cancelEdit(); }
          else confirmEdit();
        }}
        className="bg-transparent border-0 border-b border-primary text-sm font-medium text-foreground outline-none py-0.5 w-full max-w-xs text-center"
      />
    );
  }

  return (
    <button
      onClick={startEdit}
      title="Click to rename"
      className="flex items-center gap-1.5 text-sm font-medium text-foreground hover:text-primary transition-colors group"
    >
      <span>{title}</span>
      <Pencil className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
    </button>
  );
}
