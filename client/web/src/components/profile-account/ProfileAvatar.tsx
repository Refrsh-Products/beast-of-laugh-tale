import { cn } from "../../lib/utils";

export default function ProfileAvatar({
  letter,
  size = 80,
}: {
  letter: string;
  size?: number;
}) {
  const sizeClass = size <= 48 ? "w-12 h-12 text-sm" : "w-20 h-20 text-xl";
  return (
    <div
      className={cn(
        "rounded-full bg-secondary flex items-center justify-center font-semibold text-foreground select-none shrink-0",
        sizeClass,
      )}
    >
      {letter}
    </div>
  );
}
