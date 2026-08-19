import type { PresentationSession } from "@freshr/shared";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RiDeleteBin6Line } from "@remixicon/react";
import { SidebarEmpty, SidebarItem, SidebarSection } from "./SidebarSection";

export default function PresentationsPanel({
  presentations,
  onPresentationClick,
  onDeleteSelected,
  disabled = false,
}: {
  presentations: PresentationSession[];
  onPresentationClick: (presentation: PresentationSession) => void;
  onDeleteSelected: (ids: string[]) => void;
  disabled?: boolean;
}) {
  return (
    <SidebarSection title="Generated slides">
      {presentations.length === 0 ? (
        <SidebarEmpty>
          No presentations yet. Generate one to get started.
        </SidebarEmpty>
      ) : (
        <ul className="flex flex-col gap-0.5">
          {presentations.map((presentation) => {
            const isReady = presentation.status === "COMPLETED";
            return (
              <li key={presentation.id} className="group/deck relative">
                <SidebarItem
                  onClick={() => onPresentationClick(presentation)}
                  className="flex-col items-start gap-1 pr-8"
                >
                  <span className="w-full truncate">{presentation.title}</span>
                  <span className="text-muted-foreground flex items-center gap-2 text-xs font-normal">
                    {!isReady && (
                      <Badge variant="outline" className="px-1.5 py-0">
                        {presentation.status}
                      </Badge>
                    )}
                    {presentation.slide_count} slides
                  </span>
                </SidebarItem>

                <Button
                  variant="ghost"
                  size="icon-xs"
                  disabled={disabled}
                  aria-label={`Delete ${presentation.title}`}
                  onClick={() => onDeleteSelected([presentation.id])}
                  className="absolute top-2 right-1 z-10 opacity-0 focus-visible:opacity-100 group-hover/deck:opacity-100"
                >
                  <RiDeleteBin6Line aria-hidden="true" />
                </Button>
              </li>
            );
          })}
        </ul>
      )}
    </SidebarSection>
  );
}
