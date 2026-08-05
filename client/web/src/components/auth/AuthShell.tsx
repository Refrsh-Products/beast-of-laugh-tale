import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import FreshrLogo from "../logo/FreshrLogo";
import { cn } from "@/lib/utils";

/**
 * Shared chrome for the seven auth screens.
 *
 * They previously repeated the same shell seven times — each with its own
 * B/G/W constants, its own hand-typed "FRESHR" wordmark instead of the real
 * logo, and Login/Signup each injecting a <style> tag with a hardcoded
 * media query to go responsive. Everything here is tokens and Tailwind
 * variants instead, so the palette and the breakpoint live in one place.
 */

/** Uppercase tracked label, matching the notebook panels' field headings. */
export const AUTH_LABEL = "text-xs font-semibold tracking-[0.12em] uppercase";

/**
 * The split layout: login and signup.
 *
 * `brandSide` picks which half carries the Timber Green panel — login puts it
 * on the right, signup on the left. Below `md` the panel is hidden entirely
 * and the form takes the full width, with the logo shown inline instead.
 */
export function AuthSplitLayout({
  brandSide,
  children,
}: {
  brandSide: "left" | "right";
  children: ReactNode;
}) {
  const brandPanel = (
    <div
      className={cn(
        "bg-primary hidden p-12 md:block md:basis-1/2",
        brandSide === "left" ? "order-first" : "order-last",
      )}
    >
      <FreshrLogo className="text-secondary" />
    </div>
  );

  return (
    <div className="flex min-h-dvh">
      {brandPanel}
      <div className="bg-background flex flex-1 flex-col items-center px-6 py-12 md:basis-1/2 md:px-8">
        {/* Shown only where the brand panel is hidden. */}
        <div className="w-full max-w-105 md:hidden">
          <FreshrLogo />
        </div>
        <div className="flex w-full flex-1 flex-col items-center justify-center">
          <div className="w-full max-w-105">{children}</div>
        </div>
      </div>
    </div>
  );
}

export function AuthHeading({ children }: { children: ReactNode }) {
  return (
    <h1 className="font-heading text-foreground mb-8 text-3xl leading-tight font-bold tracking-tight">
      {children}
    </h1>
  );
}

/** The "or" rule between the Google button and the email form. */
export function AuthDivider({ label = "or" }: { label?: string }) {
  return (
    <div className="mb-6 flex items-center gap-3">
      <div className="bg-border h-px flex-1" />
      <span className="text-muted-foreground text-xs font-semibold tracking-[0.1em] uppercase">
        {label}
      </span>
      <div className="bg-border h-px flex-1" />
    </div>
  );
}

/**
 * Form-level error. role="alert" so it is announced — the old markup was a
 * bare coloured <p>, which screen readers passed over silently.
 */
export function AuthError({ children }: { children: ReactNode }) {
  if (!children) return null;
  return (
    <p role="alert" className="text-destructive mb-4 text-sm">
      {children}
    </p>
  );
}

/** Trailing "Back to login" / "Need help?" links, consistent across screens. */
export function AuthFootLink({
  to,
  children,
  className,
}: {
  to: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Link
      to={to}
      className={cn(
        "text-primary font-semibold underline underline-offset-[3px] hover:no-underline",
        className,
      )}
    >
      {children}
    </Link>
  );
}

/** The Terms/Privacy note under the submit button. */
export function AuthLegalNote({ action }: { action: string }) {
  return (
    <p className="text-muted-foreground mt-1 text-center text-xs leading-relaxed">
      By {action}, you agree to FRESHR's{" "}
      <AuthFootLink to="/terms-of-service">Terms of Service</AuthFootLink> and{" "}
      <AuthFootLink to="/privacy-policy">Privacy Policy</AuthFootLink>.
    </p>
  );
}
