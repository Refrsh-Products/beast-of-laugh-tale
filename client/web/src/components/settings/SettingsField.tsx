import { useId } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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
  const id = useId();

  return (
    <div className="border-border border-b pb-5">
      <Label
        htmlFor={isEditing ? id : undefined}
        className="text-muted-foreground mb-2 text-xs font-semibold tracking-[0.14em] uppercase"
      >
        {label}
      </Label>

      {isEditing ? (
        <div className="flex items-center gap-2.5">
          <Input
            id={id}
            autoFocus
            type="text"
            value={value}
            onChange={(e) => onChange?.(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") onSave?.();
              if (e.key === "Escape") onCancel?.();
            }}
          />
          <Button onClick={onSave}>Save</Button>
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      ) : (
        <div className="flex items-center justify-between gap-4">
          <span className="text-foreground text-sm break-all">
            {value || <span className="text-muted-foreground">—</span>}
          </span>
          {!disabled && (
            <Button
              variant="link"
              size="sm"
              className="h-auto shrink-0 p-0"
              onClick={onEditStart}
            >
              Edit
            </Button>
          )}
        </div>
      )}

      {disabled && (
        <p className="text-muted-foreground mt-1.5 text-xs">
          Email cannot be changed
        </p>
      )}
    </div>
  );
}
