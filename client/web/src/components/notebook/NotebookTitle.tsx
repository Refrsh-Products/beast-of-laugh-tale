import { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { RiPencilLine } from "@remixicon/react";

interface NotebookTitleProps {
  title: string;
  onSave: (newTitle: string) => void;
  /**
   * Increment to open the editor from elsewhere — the rail's settings menu
   * uses this so "Rename" focuses the title rather than opening a dialog.
   * The initial 0 is ignored so the field doesn't open on mount.
   */
  editSignal?: number;
}

export default function NotebookTitle({
  title,
  onSave,
  editSignal = 0,
}: NotebookTitleProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState(title);
  const escapeRef = useRef(false);

  useEffect(() => {
    if (editSignal > 0) {
      setValue(title);
      setIsEditing(true);
    }
    // Only the signal should reopen the editor; retitling elsewhere must not.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editSignal]);

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
      <Input
        autoFocus
        aria-label="Notebook title"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            confirmEdit();
          }
          if (e.key === "Escape") {
            escapeRef.current = true;
            e.currentTarget.blur();
          }
        }}
        onBlur={() => {
          if (escapeRef.current) {
            escapeRef.current = false;
            cancelEdit();
          } else {
            confirmEdit();
          }
        }}
        className="h-9 max-w-80 text-base font-bold"
      />
    );
  }

  return (
    <button
      type="button"
      onClick={() => {
        setValue(title);
        setIsEditing(true);
      }}
      title="Click to rename"
      className="group/title hover:bg-accent flex min-w-0 cursor-pointer items-center gap-2 rounded-md px-2 py-1 transition-colors"
    >
      <span className="truncate text-lg font-bold tracking-[-0.02em]">
        {title}
      </span>
      <RiPencilLine
        className="text-muted-foreground size-4 shrink-0 opacity-0 transition-opacity group-hover/title:opacity-100"
        aria-hidden="true"
      />
    </button>
  );
}
