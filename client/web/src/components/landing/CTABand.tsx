import { useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";

export function CTABand() {
  const navigate = useNavigate();

  return (
    <section className="lp-theme-cta-band py-24 px-6 md:px-16 text-center reveal">
      <div className="max-w-xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight mb-4">
          Start studying smarter<br />
          <span className="text-[#1B3A2A]">today.</span>
        </h2>
        <p className="text-sm text-muted-foreground mb-8 leading-relaxed">
          Free to start. No credit card required. Your notes, your AI.
        </p>
        <button
          onClick={() => navigate("/signup")}
          className="inline-flex items-center gap-2 rounded-sm bg-[#1B3A2A] px-6 py-3 text-sm font-semibold text-[#B4FF6E] transition-transform hover:-translate-y-px hover:bg-[#142E22]"
        >
          Get started free
          <ArrowRight className="h-4 w-4 text-[#B4FF6E]" />
        </button>
      </div>
    </section>
  );
}
