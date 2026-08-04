import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Shared chrome for the notebook sidebar's two stacked regions: the contextual
 * panel on top (which swaps with the active tool) and the persistent materials
 * list below it. Keeping the heading, action slot and scroll behaviour here is
 * what makes those regions read as one column rather than four unrelated lists.
 */
export function SidebarSection({
  title,
  action,
  children,
  className,
  bodyClassName,
}: {
  title: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <section className={cn("flex min-h-0 flex-col", className)}>
      <header className="flex items-center justify-between gap-2 px-4 pt-4 pb-2">
        <h2 className="text-muted-foreground text-xs font-semibold tracking-widest uppercase">
          {title}
        </h2>
      </header>
      <div
        className={cn(
          "freshr-scroll min-h-0 flex-1 overflow-y-auto px-2 pb-2",
          bodyClassName,
        )}
      >
        {action}
        {children}
      </div>
    </section>
  );
}

/** Consistent "nothing here yet" treatment for every sidebar list. */
export function SidebarEmpty({ children }: { children: ReactNode }) {
  return (
    <p className="text-muted-foreground px-2 py-6 text-center text-xs">
      {children}
    </p>
  );
}

export function SidebarItem({
  active = false,
  onClick,
  children,
  className,
  ...props
}: {
  active?: boolean;
  onClick?: () => void;
  children: ReactNode;
  className?: string;
} & Omit<React.ComponentProps<"button">, "onClick" | "children">) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={active ? "true" : undefined}
      className={cn(
        "focus-visible:ring-ring/50 flex w-full cursor-pointer items-center gap-2 rounded-md px-2 py-2 text-left text-sm transition-colors focus-visible:ring-[3px] focus-visible:outline-none",
        active
          ? "bg-accent text-accent-foreground font-semibold"
          : "hover:bg-accent/60",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
