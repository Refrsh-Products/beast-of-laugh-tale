import { Skeleton } from "@/components/ui/skeleton";

/**
 * Loading placeholder for the notebook workspace, shown until the notebook
 * itself has loaded.
 *
 * Its whole job is to occupy the same space the real chrome will, so the page
 * doesn't shift when content arrives. That means three dimensions below are
 * deliberate copies of the real components, and have to be kept in step by
 * hand — nothing enforces them:
 *
 *   - `w-20` rail    → NotebookToolRail.tsx
 *   - `w-72` sidebar → sidebar/NotebookSidebar.tsx
 *   - `h-14` top bar → NotebookTopBar.tsx
 *
 * If you change a width in one of those, change it here too or this skeleton
 * will cause the very layout shift it exists to prevent.
 */
export default function NotebookPageSkeleton({
  isCompact,
}: {
  /** Passed in rather than re-querying, so both halves of the page agree. */
  isCompact: boolean;
}) {
  return (
    <div className="bg-background flex h-dvh overflow-hidden">
      {!isCompact && (
        <>
          {/* Rail skeleton */}
          <div className="bg-card border-border flex h-full w-20 shrink-0 flex-col items-center gap-3 border-r py-3">
            <Skeleton className="size-11 rounded-lg" />
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-16 rounded-lg" />
            ))}
          </div>
          {/* Sidebar skeleton */}
          <div className="bg-card border-border flex h-full w-72 shrink-0 flex-col gap-4 border-r p-4">
            <Skeleton className="h-4 w-24" />
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-full rounded-md" />
            ))}
            <div className="border-border mt-auto border-t pt-4">
              <Skeleton className="mb-3 h-4 w-32" />
              <Skeleton className="h-8 w-full rounded-md" />
            </div>
          </div>
        </>
      )}
      {/* Content skeleton */}
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="border-border flex h-14 items-center gap-3 border-b px-4">
          <Skeleton className="h-5 w-48" />
        </div>
        <div className="flex-1 p-6">
          <div className="mx-auto flex max-w-2xl flex-col gap-4">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="mt-4 h-24 w-full rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  );
}
