import { useNavigate } from "react-router-dom";

const FOOTER_LINKS = [
  { label: "Support", path: "/support" },
  { label: "Privacy", path: "/privacy-policy" },
  { label: "Terms", path: "/terms-of-service" },
  { label: "Refund", path: "/refund-policy" },
];

export function LandingFooter() {
  const navigate = useNavigate();

  return (
    <footer className="px-6 md:px-16 py-7 flex flex-wrap items-center justify-between gap-4 border-t border-primary/18">
      <span className="text-base font-bold text-foreground tracking-tight">FRESHR</span>

      <div className="flex items-center flex-wrap gap-6">
        {FOOTER_LINKS.map((link) => (
          <button
            key={link.path}
            onClick={() => navigate(link.path)}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            {link.label}
          </button>
        ))}
        <span className="text-xs text-muted-foreground">© 2026 FRESHR</span>
      </div>
    </footer>
  );
}
