import { RiAddLine } from "@remixicon/react";

/**
 * The dashed "new notebook" tile that leads the grid. It is a button rather
 * than a Card so the whole tile is one focusable, labelled control.
 */
export default function CreateCard({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="border-input text-muted-foreground hover:border-primary hover:text-primary hover:bg-accent/40 focus-visible:ring-ring/50 flex min-h-44 cursor-pointer flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed transition-colors focus-visible:ring-[3px] focus-visible:outline-none"
    >
      <span className="bg-secondary text-secondary-foreground flex size-11 items-center justify-center rounded-full">
        <RiAddLine className="size-5" aria-hidden="true" />
      </span>
      <span className="text-foreground font-semibold">Create new notebook</span>
    </button>
  );
}
