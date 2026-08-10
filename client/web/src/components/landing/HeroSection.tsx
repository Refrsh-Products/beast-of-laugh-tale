import { useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { RotatingText } from "./RotatingText";
import { FlashcardStage } from "./FlashcardStage";

export function HeroSection() {
  const navigate = useNavigate();

  return (
    <section className="relative min-h-dvh flex flex-col justify-center px-6 md:px-16 pt-24 pb-24 border-b border-border">
      <div className="max-w-6xl mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-center">
        <div className="animate-[fade-in_0.6s_ease]">
          <div className="inline-flex items-center gap-2 text-xs font-medium text-primary border border-primary/20 rounded-full px-3 py-1.5 mb-8">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            AI-powered learning platform
          </div>

          <h1 className="text-[clamp(2.5rem,5.6vw,4.875rem)] font-bold tracking-[-0.035em] leading-[0.96] text-foreground">
            Your<br />
            <span className="text-primary">
              <RotatingText words={["notes.", "AI.", "edge."]} />
            </span>
          </h1>

          <p className="mt-6 mb-8 text-lg text-foreground/80 leading-relaxed max-w-md">
            Upload your study materials into notebooks. FRESHR reads and learns everything you add, then answers your questions like a tutor who has read every page you have.
          </p>

          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/signup")}
              className="inline-flex items-center gap-2 rounded-sm bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition-transform hover:-translate-y-px"
            >
              Get started free
              <ArrowRight className="h-4 w-4" />
            </button>
            <button
              onClick={() => navigate("/login")}
              className="rounded-sm px-5 py-3 text-sm font-medium text-foreground border border-border transition-colors hover:text-primary hover:border-primary"
            >
              Log in
            </button>
          </div>
        </div>

        <FlashcardStage />
      </div>
    </section>
  );
}
