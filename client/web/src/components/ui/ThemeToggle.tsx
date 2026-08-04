import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import useTheme from "@/hooks/useTheme";
import type { ThemePreference } from "@/lib/theme";
import { RiSunLine, RiMoonLine, RiComputerLine, RiCheckLine } from "@remixicon/react";

const OPTIONS: Array<{
  value: ThemePreference;
  label: string;
  Icon: typeof RiSunLine;
}> = [
  { value: "light", label: "Light", Icon: RiSunLine },
  { value: "dark", label: "Dark", Icon: RiMoonLine },
  { value: "system", label: "System", Icon: RiComputerLine },
];

export default function ThemeToggle({
  side = "bottom",
  size = "icon",
}: {
  side?: "top" | "right" | "bottom" | "left";
  size?: "icon" | "icon-sm" | "icon-lg";
}) {
  const { preference, resolved, setTheme } = useTheme();

  // The trigger shows what you're actually looking at, so "system" reads as
  // sun or moon rather than a monitor that tells you nothing about the theme.
  const TriggerIcon = resolved === "dark" ? RiMoonLine : RiSunLine;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size={size} aria-label="Change theme">
          <TriggerIcon aria-hidden="true" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent side={side} align="end" className="w-40">
        <DropdownMenuLabel>Theme</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {OPTIONS.map(({ value, label, Icon }) => (
          <DropdownMenuItem key={value} onSelect={() => setTheme(value)}>
            <Icon aria-hidden="true" />
            {label}
            {preference === value && (
              <RiCheckLine className="ml-auto size-4" aria-hidden="true" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
