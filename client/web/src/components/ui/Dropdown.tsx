import { useState, useRef, useEffect } from "react";
import { cn } from "../../lib/utils";

interface SelectOption {
  value: string;
  label: string;
}

interface DropdownProps {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  options: SelectOption[];
  disabled?: boolean;
}

export default function Dropdown({
  value,
  onChange,
  placeholder,
  options,
  disabled = false,
}: DropdownProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const selectedLabel = options.find((o) => o.value === value)?.label;

  return (
    <div ref={containerRef} className="relative select-none">
      <div
        onClick={() => !disabled && setOpen((o) => !o)}
        className={cn(
          "flex items-center justify-between w-full px-3 py-2 text-sm rounded-md border border-border bg-input text-foreground transition-colors",
          disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:bg-secondary",
          open && "ring-1 ring-ring",
        )}
      >
        <span className={selectedLabel ? "text-foreground" : "text-muted-foreground"}>
          {selectedLabel ?? placeholder}
        </span>
        <span
          className="text-muted-foreground transition-transform duration-150 text-xs"
          style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
        >
          ▾
        </span>
      </div>

      {open && (
        <div className="absolute top-[calc(100%+4px)] left-0 right-0 z-50 bg-popover border border-border rounded-md shadow-lg overflow-hidden">
          {options.map((opt) => {
            const isSelected = opt.value === value;
            return (
              <div
                key={opt.value}
                onMouseDown={() => {
                  onChange(opt.value);
                  setOpen(false);
                }}
                className={cn(
                  "px-3 py-2 text-sm cursor-pointer transition-colors",
                  isSelected
                    ? "bg-secondary text-foreground font-medium"
                    : "text-foreground hover:bg-secondary",
                )}
              >
                {opt.label}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
