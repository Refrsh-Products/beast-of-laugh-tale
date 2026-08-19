import { Link } from "react-router-dom";
import FullLogoMark from "../logo/FullLogoMark";
import { FOOTER, FOOTER_COLUMNS } from "../../page/dto/LandingPage.dto";

/**
 * The landing page footer.
 *
 * Every link here resolves to a route that exists — the inspiration's footer
 * carried "Changelog", "Status" and "For study groups" pointing at "#", and a
 * dead link in a footer is worse than no link, because it is exactly where
 * someone goes looking for the refund policy.
 */
export default function LandingFooter() {
  const year = new Date().getFullYear();

  return (
    <footer
      id="footer"
      className="border-brand-secondary-300/20 border-t px-5 pt-12 pb-14 sm:px-9"
    >
      <div className="mx-auto grid max-w-320 gap-9 sm:grid-cols-2 lg:grid-cols-[1.4fr_repeat(3,1fr)]">
        <div>
          <FullLogoMark className="text-brand-tertiary-100 mb-4 h-6 w-auto" />
          <p className="text-brand-paper/80 max-w-64 text-sm leading-relaxed">
            {FOOTER.blurb}
          </p>
        </div>

        {FOOTER_COLUMNS.map((col) => (
          <div key={col.heading}>
            <h3 className="text-brand-secondary-300 mb-3 text-xs font-semibold tracking-[0.08em] uppercase">
              {col.heading}
            </h3>
            <ul className="flex flex-col gap-2 text-sm">
              {col.links.map((link) => (
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
          </div>
        ))}
      </div>

      <div className="border-brand-paper/12 mx-auto mt-12 flex max-w-320 flex-wrap items-center justify-between gap-3 border-t pt-6 text-xs">
        <span id="footer-copyright" className="text-brand-paper/70">
          © {year} FRESHR
        </span>
        <span className="text-brand-paper/70">{FOOTER.madeIn}</span>
      </div>
    </footer>
  );
}
