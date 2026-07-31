import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

/**
 * Compatibility adapter over the shadcn Select.
 *
 * Despite the name this was never a menu — its props are a controlled select
 * (value / onChange / options), so Select is the matching primitive. The
 * hand-rolled version tracked open and hover state itself and handled
 * click-outside with a document listener; Radix now provides that plus
 * keyboard navigation, typeahead and the ARIA wiring it was missing.
 *
 * The prop shape is unchanged so the existing call sites keep working.
 */

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
  return (
    <Select
      value={value || undefined}
      onValueChange={onChange}
      disabled={disabled}
    >
      <SelectTrigger className="w-full">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
