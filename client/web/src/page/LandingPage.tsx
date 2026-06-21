import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import Button from "../components/ui/Button";
import FeatureCard from "../components/landing/FeatureCard";
import TestimonialSection from "../components/landing/TestimonialSection";
import RotatingText from "../components/landing/RotatingText";
import PricingSection from "../components/landing/PricingSection";
import LineWaves from "../components/landing/LineWaves";
import { FEATURES, STEPS, TICKER_TEXT } from "./dto/LandingPage.dto";

export default function LandingPage() {
  const navigate = useNavigate();
  const [loaded, setLoaded] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const t = setTimeout(() => setLoaded(true), 60);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    function handleScroll() {
      setScrolled(window.scrollY > 20);
    }
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const fadeIn = (delay = 0): React.CSSProperties => ({
    opacity: loaded ? 1 : 0,
    transform: loaded ? "none" : "translateY(20px)",
    transition: `opacity 0.6s ${delay}s ease, transform 0.6s ${delay}s ease`,
  });

  return (
    <div className="bg-background text-foreground overflow-x-hidden">
      {/* ── NAV ── */}
      <nav
        className={`sticky top-0 z-50 flex items-center justify-between px-6 md:px-16 h-14 transition-all duration-300 ${
          scrolled ? "bg-background/90 backdrop-blur-sm border-b border-border" : "bg-transparent"
        }`}
      >
        <button
          onClick={() => navigate("/")}
          className="text-base font-bold text-foreground tracking-tight"
        >
          FRESHR
        </button>

        <div className="flex items-center gap-2">
          <Button variant="default" onClick={() => navigate("/login")}>Log in</Button>
          <Button variant="green" onClick={() => navigate("/signup")}>Sign up</Button>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section
        ref={heroRef}
        className="relative min-h-[calc(100dvh-56px)] flex flex-col justify-center px-6 md:px-16 pt-16 pb-24 border-b border-border overflow-hidden"
      >
        {/* LineWaves — very subtle in hero */}
        <div className="absolute inset-0 z-0 opacity-[0.12]">
          <LineWaves
            color1="#84e487"
            color2="#84e487"
            color3="#2A2A30"
            brightness={0.4}
            speed={0.15}
            warpIntensity={0.6}
            rotation={-20}
            edgeFadeWidth={0.3}
            innerLineCount={24}
            outerLineCount={28}
          />
        </div>

        <div className="relative z-10 max-w-6xl mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-center">
          {/* Copy */}
          <div style={fadeIn(0)}>
            <div className="inline-flex items-center gap-2 text-xs font-medium text-muted-foreground border border-border rounded-full px-3 py-1.5 mb-8">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
              AI-powered learning platform
            </div>

            <h1 className="text-[clamp(3.5rem,8vw,6.5rem)] font-bold tracking-[-0.04em] leading-[1.0] mb-6 text-foreground">
              Your<br />
              <span className="text-primary">
                <RotatingText words={["notes.", "AI.", "edge."]} />
              </span>
            </h1>

            <p className="text-sm text-muted-foreground leading-relaxed max-w-md mb-8">
              Upload your study materials into notebooks. FRESHR reads and learns everything you add, then answers your questions like a tutor who has read every page you have.
            </p>

            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate("/signup")}
                className="inline-flex items-center gap-2 rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                Get started free
                <ArrowRight className="h-4 w-4" />
              </button>
              <button
                onClick={() => navigate("/login")}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Log in →
              </button>
            </div>
          </div>

          {/* Product mockup — dark card */}
          <div style={fadeIn(0.15)} className="hidden lg:block">
            <div className="rounded-xl border border-border bg-card shadow-2xl overflow-hidden">
              {/* Card header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-card/50">
                <div className="flex items-center gap-2">
                  <span className="rounded-sm bg-primary/20 border border-primary/30 px-2 py-0.5 text-xs font-medium text-primary">
                    Organic Chemistry — S1
                  </span>
                </div>
                <span className="text-xs text-muted-foreground">3 docs · indexed ✓</span>
              </div>

              <div className="p-5 flex flex-col gap-4">
                {/* User question */}
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">You</p>
                  <div className="rounded-lg bg-secondary border border-border px-4 py-3 text-sm text-foreground leading-relaxed">
                    What's the difference between supervised and unsupervised learning?
                  </div>
                </div>

                {/* AI answer */}
                <div>
                  <div className="flex items-center gap-1.5 mb-2">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Freshr</p>
                    <span className="text-primary text-xs">AI ◆</span>
                  </div>
                  <div className="rounded-lg border border-border bg-background px-4 py-3 text-sm text-foreground leading-relaxed">
                    From your notes in <strong className="text-foreground">lecture_03.pdf</strong>: Supervised
                    learning trains on labeled data, while unsupervised finds
                    hidden patterns without labels...
                    <span
                      className="inline-block w-1.5 h-4 bg-primary ml-1 align-middle animate-[blink_1s_step-end_infinite]"
                    />
                  </div>
                </div>

                {/* Source tags */}
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-primary/10 border border-primary/20 px-2.5 py-0.5 text-xs font-medium text-primary">
                    lecture_03.pdf
                  </span>
                  <span className="rounded-full border border-border px-2.5 py-0.5 text-xs text-muted-foreground">
                    + 2 sources
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── TICKER ── */}
      <div className="border-b border-border bg-card overflow-hidden py-3">
        <div
          className="inline-flex whitespace-nowrap"
          style={{ animation: "ticker 26s linear infinite" }}
        >
          {[0, 1].map((i) => (
            <span key={i} className="text-xs font-medium text-muted-foreground tracking-wider">
              {TICKER_TEXT}
            </span>
          ))}
        </div>
      </div>

      {/* ── STATS ── */}
      <section className="py-16 px-6 md:px-16 border-b border-border">
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {(
            [
              ["1", "Place for everything"],
              ["∞", "Documents"],
              ["0", "Lost notes"],
              ["100%", "Private and secure"],
            ] as [string, string][]
          ).map(([n, l]) => (
            <div key={l}>
              <p className="text-4xl md:text-5xl font-bold text-primary tracking-tight leading-none">{n}</p>
              <p className="text-xs text-muted-foreground mt-2 uppercase tracking-wider">{l}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section className="py-24 px-6 md:px-16 border-b border-border">
        <div className="max-w-6xl mx-auto">
          <div className="mb-12">
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wider border border-border rounded-full px-3 py-1 mb-4">
              Features
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight leading-tight">
              Everything your<br />notes deserve.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map((f, i) => (
              <FeatureCard key={i} {...f} />
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="py-24 px-6 md:px-16 border-b border-border bg-card/30">
        <div className="max-w-5xl mx-auto">
          <div className="mb-12">
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wider border border-border rounded-full px-3 py-1 mb-4">
              How it works
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight leading-tight">
              Three steps.<br />Zero complexity.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {STEPS.map((s) => (
              <div key={s.n} className="rounded-lg border border-border bg-card p-6">
                <p className="text-5xl font-bold text-primary/20 tracking-tight leading-none mb-4">{s.n}</p>
                <h3 className="text-sm font-semibold text-foreground mb-2">{s.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <TestimonialSection />

      {/* ── PRICING ── */}
      <PricingSection />

      {/* ── CTA BAND ── */}
      <section className="py-24 px-6 md:px-16 border-b border-border text-center">
        <div className="max-w-xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight mb-4">
            Start studying smarter<br />
            <span className="text-primary">today.</span>
          </h2>
          <p className="text-sm text-muted-foreground mb-8 leading-relaxed">
            Free to start. No credit card required. Your notes, your AI.
          </p>
          <button
            onClick={() => navigate("/signup")}
            className="inline-flex items-center gap-2 rounded-md bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Get started free
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="px-6 md:px-16 py-7 flex flex-wrap items-center justify-between gap-4 border-t border-border">
        <span className="text-base font-bold text-foreground tracking-tight">FRESHR</span>

        <div className="flex items-center flex-wrap gap-6">
          {[
            { label: "Support", path: "/support" },
            { label: "Privacy", path: "/privacy-policy" },
            { label: "Terms", path: "/terms-of-service" },
            { label: "Refund", path: "/refund-policy" },
          ].map((link) => (
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
    </div>
  );
}
