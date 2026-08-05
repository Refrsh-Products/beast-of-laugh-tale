import type { DeckChip } from "../../page/dto/LandingPage.dto";
import { LANDING_ICONS } from "./landingIcons";
import { cn } from "@/lib/utils";

/**
 * The illustration row at the bottom of a deck card — file names on the upload
 * card, a question and its citation on the ask card.
 *
 * One chip in each row is `solid` (Sulu filled) to give the row a focal point;
 * the rest are outlined. On the ink card the outline has to lift off a
 * near-black surface rather than sit on paper, hence the variant.
 */
export default function DeckChips({
  chips,
  variant = "ecru",
}: {
  chips: DeckChip[];
  variant?: "ecru" | "ink";
}) {
  return (
    <div className="flex flex-wrap gap-3">
      {chips.map((chip) => {
        const Icon = LANDING_ICONS[chip.icon];
        return (
          <span
            key={chip.label}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium",
              chip.solid
                ? "bg-brand-secondary-300 text-brand-primary-900"
                : variant === "ink"
                  ? "border-brand-paper/30 text-brand-tertiary-100 border"
                  : "border-brand-ink/12 text-brand-ink border",
            )}
          >
            <Icon className="size-4 shrink-0" aria-hidden="true" />
            {chip.label}
          </span>
        );
      })}
    </div>
  );
}
