import { useId, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { RiEyeLine, RiEyeOffLine } from "@remixicon/react";
import { AUTH_LABEL } from "./AuthShell";

/**
 * Password input with a show/hide toggle.
 *
 * This markup appeared five times across login, signup and reset-password,
 * each copy re-implementing the toggle with its own absolute positioning and
 * imperative hover handlers. Beyond the duplication the old version had two
 * real defects this fixes: the toggle was an unlabelled button showing the
 * text "SHOW"/"HIDE" with no accessible name for its purpose, and no field
 * had a label bound to its input, so clicking the label did nothing and
 * screen readers announced the inputs unlabelled.
 */
export default function PasswordField({
  label,
  value,
  onChange,
  autoComplete,
  placeholder = "••••••••",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete?: string;
  placeholder?: string;
}) {
  const [visible, setVisible] = useState(false);
  const id = useId();

  return (
    <div>
      <Label htmlFor={id} className={`${AUTH_LABEL} mb-1.5`}>
        {label}
      </Label>
      <div className="relative">
        <Input
          id={id}
          type={visible ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          className="pr-11"
        />
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label={visible ? "Hide password" : "Show password"}
          aria-pressed={visible}
          onClick={() => setVisible((v) => !v)}
          className="absolute top-1/2 right-1 -translate-y-1/2"
        >
          {visible ? (
            <RiEyeOffLine aria-hidden="true" />
          ) : (
            <RiEyeLine aria-hidden="true" />
          )}
        </Button>
      </div>
    </div>
  );
}
