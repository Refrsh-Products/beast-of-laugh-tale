import { useNavigate } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { useMobileMenu } from "../../hooks/useMobileMenu";
import freshrLogoForNav from "../../assets/freshrLogoForNav.svg";

export function LandingNav() {
  const navigate = useNavigate();
  const { isOpen, close, toggle, buttonRef, panelRef } = useMobileMenu();

  const goHome = () => navigate("/");

  const loginButtonClasses =
    "w-full md:w-auto text-center rounded-sm px-4 py-2 text-sm font-medium text-foreground border border-border transition-colors hover:text-primary hover:border-primary";
  const signupButtonClasses =
    "w-full md:w-auto text-center rounded-sm bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-transform hover:-translate-y-px";

  return (
    <nav className="lp-theme-nav-dark sticky top-0 z-50 relative flex items-center justify-between px-6 md:px-16 h-14 bg-[#19392E] border-b border-primary/18">
      <button
        onClick={goHome}
        className="flex items-center transition-opacity hover:opacity-80"
      >
        <img src={freshrLogoForNav} alt="Freshr" className="h-7 w-auto" />
      </button>

      <div className="hidden md:flex items-center gap-2">
        <button
          onClick={() => navigate("/login")}
          className="rounded-sm px-4 py-2 text-sm font-medium text-foreground border border-border transition-colors hover:text-primary hover:border-primary"
        >
          Log in
        </button>
        <button
          onClick={() => navigate("/signup")}
          className="rounded-sm bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-transform hover:-translate-y-px"
        >
          Sign up
        </button>
      </div>

      <button
        ref={buttonRef}
        onClick={toggle}
        aria-label={isOpen ? "Close menu" : "Open menu"}
        aria-expanded={isOpen}
        className="md:hidden w-10 h-10 flex items-center justify-center text-foreground rounded-sm"
      >
        {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {isOpen && (
        <div
          ref={panelRef}
          role="dialog"
          aria-label="Mobile navigation"
          className="absolute top-full left-0 right-0 z-50 bg-[#19392E] border-b border-primary/18 px-6 py-5 flex flex-col gap-3"
        >
          <button
            onClick={() => {
              close();
              navigate("/login");
            }}
            className={loginButtonClasses}
          >
            Log in
          </button>
          <button
            onClick={() => {
              close();
              navigate("/signup");
            }}
            className={signupButtonClasses}
          >
            Sign up
          </button>
        </div>
      )}
    </nav>
  );
}
