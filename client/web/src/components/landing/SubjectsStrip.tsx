import { SUBJECTS, SUBJECTS_LABEL } from "../../page/dto/LandingPage.dto";
import { LANDING_ICONS } from "./landingIcons";

/**
 * The full-bleed Ecru band between the hero and the deck.
 *
 * Its job is a breath of light between two dark-backed sections, and a quiet
 * signal that this is for coursework rather than office work. The subjects are
 * course areas, not claimed integrations — Freshr has no per-subject
 * behaviour, and implying one here would be a promise the product doesn't make.
 */
export default function SubjectsStrip() {
  return (
    <div
      id="subjects"
      className="bg-brand-tertiary-100 text-brand-ink border-brand-ink/10 flex flex-wrap items-center justify-center gap-x-7 gap-y-3 border-y px-5 py-7 text-sm sm:px-9"
    >
      <span className="text-brand-primary-900 text-xs font-semibold tracking-[0.04em] uppercase">
        {SUBJECTS_LABEL}
      </span>
      {SUBJECTS.map((subject) => {
        const Icon = LANDING_ICONS[subject.icon];
        return (
          <span key={subject.label} className="inline-flex items-center gap-1.5">
            <Icon className="text-brand-primary-900 size-4" aria-hidden="true" />
            {subject.label}
          </span>
        );
      })}
    </div>
  );
}
