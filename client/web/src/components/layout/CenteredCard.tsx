import type { ReactNode } from "react";
import FreshrLogo from "../logo/FreshrLogo";

/**
 * A single card centred on a full-height brand surface.
 *
 * Used by every "one message, one action" screen: forgot/reset password,
 * verify email, payment success/cancel, and 404. Each of those previously
 * repeated the shell inline with its own B/G/W constants and a hand-typed
 * "FRESHR" wordmark instead of the real logo.
 *
 * The old treatment was a pure-black page behind a white card with an offset
 * Sulu shadow; it is now the brand's Timber Green surface with the same
 * elevated card the rest of the app uses.
 */
export default function CenteredCard({
  title,
  description,
  children,
}: {
  title: ReactNode;
  description?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <div className="bg-primary flex min-h-dvh items-center justify-center p-4 sm:p-6">
      <div className="bg-card ring-foreground/5 w-full max-w-md rounded-3xl p-8 shadow-lg ring-1 sm:p-10">
        <div className="mb-8">
          <FreshrLogo />
        </div>
        <h1 className="font-heading text-foreground mb-2.5 text-2xl leading-tight font-bold tracking-tight">
          {title}
        </h1>
        {description && (
          <p className="text-muted-foreground mb-8 text-sm leading-relaxed">
            {description}
          </p>
        )}
        {children}
      </div>
    </div>
  );
}
