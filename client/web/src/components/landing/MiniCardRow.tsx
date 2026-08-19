import { MINI_CARDS } from "../../page/dto/LandingPage.dto";
import { LANDING_ICONS } from "./landingIcons";

/**
 * Three small cards, one per tool, showing what the same notebook turns into.
 *
 * They sit inside the "one notebook, three ways to study it" deck card and are
 * the only place on the page where chat, quiz and slides appear side by side —
 * which is the whole claim of that section, so it is worth showing rather than
 * only saying.
 *
 * The highlighted phrase in each uses the Sulu marker stroke, the same
 * treatment the hero card gives an answer.
 */
export default function MiniCardRow() {
  return (
    <div className="grid gap-3.5 sm:grid-cols-3">
      {MINI_CARDS.map((card) => {
        const Icon = LANDING_ICONS[card.icon];
        return (
          <div
            key={card.label}
            className="border-brand-ink/12 bg-brand-tertiary-50 flex min-h-28 flex-col gap-2 rounded-2xl border p-4 transition-transform hover:-translate-y-1"
          >
            <span className="text-brand-primary-900 inline-flex items-center gap-1.5 text-[0.7rem] font-semibold tracking-[0.06em] uppercase">
              <Icon className="size-3.5" aria-hidden="true" />
              {card.label}
            </span>
            <p className="text-brand-ink text-sm leading-snug font-medium">
              {card.before}
              <span className="landing-mark">{card.highlight}</span>
              {card.after}
            </p>
          </div>
        );
      })}
    </div>
  );
}
