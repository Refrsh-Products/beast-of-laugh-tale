import { Link } from "react-router-dom";
import FreshrLogo from "../components/logo/FreshrLogo";
import {
  SupportDetails,
  SupportForm,
} from "../components/support/SupportContact";
import { Button } from "@/components/ui/button";
import { RiArrowLeftLine } from "@remixicon/react";

export default function SupportPage() {
  return (
    <div className="bg-background text-foreground flex min-h-dvh flex-col">
      <nav className="border-border bg-card sticky top-0 z-10 flex items-center justify-between gap-4 border-b px-6 py-4 md:px-16">
        <FreshrLogo />
        <Button variant="ghost" size="sm" asChild>
          <Link to="/">
            <RiArrowLeftLine aria-hidden="true" />
            Back to home
          </Link>
        </Button>
      </nav>

      <main className="flex-1 px-6 py-12 md:px-16">
        <div className="mx-auto max-w-260">
          <h1 className="font-heading text-foreground mb-2 text-4xl leading-tight font-bold tracking-tight">
            Support
          </h1>
          <p className="text-muted-foreground mb-8 text-sm leading-relaxed">
            Send us a message and our team will get back to you.
          </p>

          <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
            <SupportForm />
            <SupportDetails />
          </div>
        </div>
      </main>

      <footer className="border-border mt-10 flex flex-wrap items-center justify-between gap-4 border-t px-6 py-7 md:px-16">
        <FreshrLogo />
        <span className="text-muted-foreground text-xs">© 2026 FRESHR</span>
      </footer>
    </div>
  );
}
