import { useState } from "react";
import { Check } from "lucide-react";
import type { QuizSession } from "@freshr/shared";
import QuizCard from "../quiz/QuizCard";
import Button from "../ui/Button";
import { DialogContent, DialogFooter } from "../ui/dialog";

interface PreviousQuizzesColumnProps {
  quizzes: QuizSession[];
  selectedQuizId: string | null;
  onQuizClick: (quiz: QuizSession) => void;
  onDeleteSelected: (ids: string[]) => void;
}

export default function PreviousQuizzesColumn({
  quizzes,
  selectedQuizId,
  onQuizClick,
  onDeleteSelected,
}: PreviousQuizzesColumnProps) {
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
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Your Quizzes</span>

        {quizzes.length > 0 && (
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
        {quizzes.length === 0 ? (
          <div className="py-8 px-4 text-center">
            <p className="text-xs text-muted-foreground leading-relaxed">
              No quizzes yet.<br />Generate your first one.
            </p>
          </div>
        ) : (
          quizzes.map((quiz) => (
            <QuizCard
              key={quiz.id}
              quiz={quiz}
              selected={quiz.id === selectedQuizId}
              onClick={() => onQuizClick(quiz)}
              bulkMode={bulkMode}
              bulkSelected={selectedIds.includes(quiz.id!)}
              onToggleSelect={toggleSelect}
            />
          ))
        )}
      </div>

      {showConfirm && (
        <DialogContent onClose={() => setShowConfirm(false)} className="max-w-xs">
          <p className="text-base font-semibold text-foreground mb-1">
            Delete {selectedIds.length} quiz{selectedIds.length > 1 ? "zes" : ""}?
          </p>
          <p className="text-sm text-muted-foreground mb-2">This cannot be undone.</p>
          <DialogFooter>
            <Button variant="danger" fullWidth onClick={confirmDelete}>Delete</Button>
            <Button variant="default" fullWidth onClick={() => setShowConfirm(false)}>Cancel</Button>
          </DialogFooter>
        </DialogContent>
      )}
    </div>
  );
}
