import { Pencil } from "lucide-react";
import { Input } from "../ui/input";
import Button from "../ui/Button";

interface SettingsFieldProps {
  label: string;
  value: string;
  isEditing?: boolean;
  disabled?: boolean;
  onChange?: (val: string) => void;
  onEditStart?: () => void;
  onSave?: () => void;
  onCancel?: () => void;
}

export default function SettingsField({
  label,
  value,
  isEditing = false,
  disabled = false,
  onChange,
  onEditStart,
  onSave,
  onCancel,
}: SettingsFieldProps) {
  return (
    <div className="py-4 border-b border-border">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
        {label}
      </p>

      {isEditing ? (
        <div className="flex items-center gap-2">
          <Input
            autoFocus
            type="text"
            value={value}
            onChange={(e) => onChange?.(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") onSave?.();
              if (e.key === "Escape") onCancel?.();
            }}
            className="flex-1"
          />
          <Button variant="green" onClick={onSave}>Save</Button>
          <Button variant="default" onClick={onCancel}>Cancel</Button>
        </div>
      ) : (
        <div className="group flex items-center justify-between gap-4">
          <span className="text-sm text-foreground break-all">
            {value || <span className="text-muted-foreground">—</span>}
          </span>
          {!disabled && (
            <button
              onClick={onEditStart}
              className="opacity-0 group-hover:opacity-100 flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-all shrink-0"
            >
              <Pencil className="h-3 w-3" />
              Edit
            </button>
          )}
        </div>
      )}

      {disabled && (
        <p className="text-xs text-muted-foreground mt-1">Email cannot be changed</p>
      )}
    </div>
  );
}
