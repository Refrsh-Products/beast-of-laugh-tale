import { useState } from "react";
import { Check } from "lucide-react";
import type { PresentationSession } from "@freshr/shared";
import Button from "../ui/Button";
import { cn } from "../../lib/utils";

function timeAgo(isoDate: string): string {
  if (!isoDate) return "";
  const diff = Date.now() - new Date(isoDate).getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  const weeks = Math.floor(days / 7);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return `${weeks}w ago`;
}

interface PastPresentationsColumnProps {
  presentations: PresentationSession[];
  onPresentationClick: (presentation: PresentationSession) => void;
  onDeleteSelected: (ids: string[]) => void;
}

export default function PastPresentationsColumn({
  presentations,
  onPresentationClick,
  onDeleteSelected,
}: PastPresentationsColumnProps) {
  const [bulkMode, setBulkMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showConfirm, setShowConfirm] = useState(false);

  function toggleSelect(id: string) {
    setSelectedIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  }

  function toggleBulkMode() {
    setBulkMode((v) => { if (v) setSelectedIds([]); return !v; });
  }

  function confirmDelete() {
    onDeleteSelected(selectedIds);
    setBulkMode(false);
    setSelectedIds([]);
    setShowConfirm(false);
  }

  return (
    <div className="flex flex-col h-full bg-card border-l border-border overflow-hidden relative">
      <div className="h-11 flex items-center justify-between px-4 border-b border-border shrink-0">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Your Slides</span>

        {presentations.length > 0 && (
          <div className="flex items-center gap-2">
            {bulkMode && selectedIds.length > 0 && (
              <Button variant="danger" onClick={() => setShowConfirm(true)}>
                Delete ({selectedIds.length})
              </Button>
            )}
            <button
              onClick={toggleBulkMode}
              title="Bulk delete"
              className={`w-4 h-4 rounded-sm border border-destructive/50 flex items-center justify-center transition-colors ${bulkMode ? "bg-destructive/20" : "hover:bg-destructive/10"}`}
            >
              {bulkMode && <Check className="h-2.5 w-2.5 text-destructive" />}
            </button>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto">
        {presentations.length === 0 ? (
          <div className="py-8 px-4 text-center">
            <p className="text-xs text-muted-foreground leading-relaxed">
              No presentations yet.<br />Generate your first one.
            </p>
          </div>
        ) : (
          <>
            <style>{`@keyframes presentation-card-pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.45; } }`}</style>
            {presentations.map((p) => {
              const isLoading = p.status === "QUEUED" || p.status === "GENERATING";
              const bulkSelected = selectedIds.includes(p.id);

              function handleCardClick() {
                if (isLoading) return;
                if (bulkMode) toggleSelect(p.id);
                else onPresentationClick(p);
              }

              return (
                <div
                  key={p.id}
                  onClick={handleCardClick}
                  className={cn(
                    "px-4 py-3 border-b border-border border-l-2 transition-colors select-none",
                    isLoading ? "border-l-border cursor-default" : "cursor-pointer",
                    bulkSelected ? "border-l-destructive bg-destructive/5" : "border-l-primary hover:bg-secondary/30",
                  )}
                  style={{ animation: isLoading ? "presentation-card-pulse 1.6s ease-in-out infinite" : "none" }}
                >
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <p className="text-xs font-medium text-foreground truncate flex-1">
                      {p.topic || "Presentation"}
                    </p>
                    <span className="text-xs font-medium text-muted-foreground border border-border rounded px-1.5 py-0.5 shrink-0">
                      {isLoading ? "—" : `${p.slide_count}`}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <span>{isLoading ? "generating..." : timeAgo(p.generated_at)}</span>
                    {!isLoading && (
                      <>
                        <span>·</span>
                        <span className="capitalize">{p.text_length.toLowerCase()}</span>
                        <span>·</span>
                        <span>{p.slide_count} slides</span>
                      </>
                    )}
                  </div>

                  {bulkMode && !isLoading && (
                    <div className="flex justify-end mt-1.5">
                      <input
                        type="checkbox"
                        checked={bulkSelected}
                        onChange={() => toggleSelect(p.id)}
                        onClick={(e) => e.stopPropagation()}
                        className="cursor-pointer accent-destructive w-3.5 h-3.5"
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </>
        )}
      </div>

      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-xs rounded-lg border border-border bg-card p-6 shadow-xl">
            <p className="text-base font-semibold text-foreground mb-1">
              Delete {selectedIds.length} presentation{selectedIds.length > 1 ? "s" : ""}?
            </p>
            <p className="text-sm text-muted-foreground mb-5">This cannot be undone.</p>
            <div className="flex gap-2">
              <Button variant="danger" fullWidth onClick={confirmDelete}>Delete</Button>
              <Button variant="default" fullWidth onClick={() => setShowConfirm(false)}>Cancel</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
