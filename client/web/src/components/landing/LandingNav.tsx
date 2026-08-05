import { Link } from "react-router-dom";
import FullLogoMark from "../logo/FullLogoMark";
import LandingButton from "./LandingButton";
import { NAV_LINKS } from "../../page/dto/LandingPage.dto";

/**
 * The landing page's floating nav.
 *
 * Deliberately not pinned flush to the top edge: it sits inset on all sides as
 * its own rounded island, which reads as one more card floating on the green
 * surface alongside the deck below. Content scrolls past on either side of it
 * rather than disappearing beneath a full-bleed slab.
 *
 * It is still sticky — it travels down with you — but `top-4` keeps the gap
 * above it once stuck, so it never becomes a fixed bar. Translucent Timber
 * Green over a blur means whatever passes underneath stays faintly visible.
 *
 * The inspiration collapsed to a hamburger below 760px, but its button opened
 * nothing. Rather than build a drawer for four links on a page that is one
 * continuous scroll, the links themselves drop away on small screens and the
 * "Start free" action stays — that is the only thing a phone visitor needs
 * from this bar, and the sections are immediately below anyway.
 */
export default function LandingNav() {
  return (
    <div className="sticky top-4 z-50 px-4 sm:px-6">
      <nav
        id="nav"
        className="border-brand-secondary-300/20 bg-brand-primary-900/70 landing-lift mx-auto flex max-w-320 items-center justify-between gap-4 rounded-full border px-5 py-3 backdrop-blur-md sm:px-6"
      >
        <Link to="/" aria-label="FRESHR home" className="shrink-0">
          <FullLogoMark className="text-brand-secondary-300 h-6 w-auto" />
        </Link>

        <ul className="hidden items-center gap-7 text-sm md:flex">
          {NAV_LINKS.map((link) => (
            <li key={link.href}>
              {link.href.startsWith("#") ? (
                <a
                  href={link.href}
                  className="text-brand-paper hover:text-brand-secondary-300 transition-colors"
                >
                  {link.label}
                </a>
              ) : (
                <Link
                  to={link.href}
                  className="text-brand-paper hover:text-brand-secondary-300 transition-colors"
                >
                  {link.label}
                </Link>
              )}
            </li>
          ))}
        </ul>

        <LandingButton id="nav-cta" to="/signup" size="default">
          Start free
        </LandingButton>
      </nav>
    </div>
  );
}
