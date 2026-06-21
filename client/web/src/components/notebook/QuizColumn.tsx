import { useState } from "react";
import type { QuizDifficulty, QuizGenerateOptions, NotebookTopic } from "@freshr/shared";
import QuizTopicChip from "../quiz/QuizTopicChip";
import Dropdown from "../ui/Dropdown";
import Divider from "../quiz/Divider";

const COLLAPSED_MAX = 4;

interface QuizColumnProps {
  topics: NotebookTopic[];
  isLoadingTopics: boolean;
  onGenerate: (options: QuizGenerateOptions) => Promise<void>;
  isGenerating: boolean;
}

export default function QuizColumn({
  topics,
  isLoadingTopics,
  onGenerate,
  isGenerating,
}: QuizColumnProps) {
  const [topicsExpanded, setTopicsExpanded] = useState(false);
  const [selectedTopics, setSelectedTopics] = useState<NotebookTopic[]>([]);
  const [prompt, setPrompt] = useState("");
  const [questionCount, setQuestionCount] = useState<number>(5);
  const [difficulty, setDifficulty] = useState<QuizDifficulty>("EASY");
  const [quizType, setQuizType] = useState<string>("PRACTICE");
  const [timeLimit, setTimeLimit] = useState<number | null>(null);

  const canGenerate = !isGenerating;
  const isAllTopicsMode = selectedTopics.length === 0 && prompt.trim().length === 0;

  function toggleTopic(topic: NotebookTopic) {
    setSelectedTopics((prev) =>
      prev.some((t) => t.id === topic.id) ? prev.filter((t) => t.id !== topic.id) : [...prev, topic],
    );
  }

  async function handleGenerate() {
    if (!canGenerate) return;
    await onGenerate({
      topics: selectedTopics,
      prompt: prompt.trim() || undefined,
      questionCount,
      difficulty,
      quizType,
      timeLimit: timeLimit ?? undefined,
    });
  }

  const selectedIds = new Set(selectedTopics.map((t) => t.id));
  const previewTopics = topics.slice(0, COLLAPSED_MAX);
  const hiddenCount = topics.length - COLLAPSED_MAX;

  return (
    <div className="flex flex-col h-full bg-background overflow-hidden">
      <div className="h-11 flex items-center px-4 border-b border-border bg-card shrink-0">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Quiz Generator</span>
      </div>

      <div className="flex-1 overflow-y-auto px-8 py-8">
        <div className="max-w-xl mx-auto">
          <h2 className="text-lg font-semibold text-foreground mb-6">Generate a Quiz</h2>

          {/* Topics */}
          <div className="mb-1">
            <div className="flex items-center justify-between mb-3">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Topics</label>
              {topicsExpanded && (
                <button
                  onClick={() => setTopicsExpanded(false)}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  × Collapse
                </button>
              )}
            </div>

            {isLoadingTopics ? (
              <p className="text-xs text-muted-foreground">Loading topics...</p>
            ) : topics.length === 0 ? (
              <p className="text-xs text-muted-foreground leading-relaxed">
                No topics found. Upload files to your notebook first.
              </p>
            ) : topicsExpanded ? (
              <div className="border border-border bg-secondary/20 rounded-md max-h-32 overflow-y-auto p-2.5 flex flex-wrap gap-1.5">
                {topics.map((topic) => (
                  <QuizTopicChip
                    key={topic.id}
                    label={topic.name}
                    selected={selectedIds.has(topic.id)}
                    onToggle={() => toggleTopic(topic)}
                    compact={false}
                  />
                ))}
              </div>
            ) : (
              <div className="flex flex-wrap gap-1.5 items-center">
                {previewTopics.map((topic) => (
                  <QuizTopicChip
                    key={topic.id}
                    label={topic.name}
                    selected={selectedIds.has(topic.id)}
                    onToggle={() => toggleTopic(topic)}
                    compact
                  />
                ))}
                {hiddenCount > 0 && (
                  <button
                    onClick={() => setTopicsExpanded(true)}
                    className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-4 transition-colors"
                  >
                    +{hiddenCount} more
                  </button>
                )}
              </div>
            )}

            <p className="text-xs text-muted-foreground mt-2">
              {selectedTopics.length > 0
                ? `${selectedTopics.length} topic${selectedTopics.length > 1 ? "s" : ""} selected`
                : topics.length > 0
                  ? "No topics selected — quiz will cover all topics"
                  : ""}
            </p>
          </div>

          <Divider />

          <div className="mb-1">
            <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
              Or describe what you want to be quizzed on
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g. Focus on the differences between mitosis and meiosis..."
              rows={3}
              className="w-full rounded-md border border-border bg-input px-3 py-2 text-sm text-foreground outline-none focus:ring-1 focus:ring-ring placeholder:text-muted-foreground resize-vertical transition-colors leading-relaxed"
            />
          </div>

          <Divider />

          <div className="grid grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Questions</label>
              <Dropdown
                value={String(questionCount)}
                onChange={(v) => setQuestionCount(Number(v))}
                placeholder="5"
                options={[
                  { value: "5", label: "5" },
                  { value: "10", label: "10" },
                  { value: "15", label: "15" },
                  { value: "20", label: "20" },
                ]}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Difficulty</label>
              <Dropdown
                value={difficulty}
                onChange={(v) => setDifficulty(v as QuizDifficulty)}
                placeholder="Easy"
                options={[
                  { value: "EASY", label: "Easy" },
                  { value: "MEDIUM", label: "Medium" },
                  { value: "HARD", label: "Hard" },
                ]}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Mode</label>
              <Dropdown
                value={quizType === "TIMED" ? "yes" : "no"}
                onChange={(v) => {
                  if (v === "yes") { setQuizType("TIMED"); setTimeLimit(5); }
                  else { setQuizType("PRACTICE"); setTimeLimit(null); }
                }}
                placeholder="Practice"
                options={[
                  { value: "yes", label: "Timed" },
                  { value: "no", label: "Practice" },
                ]}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Time Limit</label>
              <Dropdown
                value={timeLimit !== null ? String(timeLimit) : ""}
                onChange={(v) => setTimeLimit(v === "" ? null : Number(v))}
                placeholder="Select..."
                disabled={quizType !== "TIMED"}
                options={[
                  { value: "5", label: "5 min" },
                  { value: "10", label: "10 min" },
                  { value: "15", label: "15 min" },
                  { value: "20", label: "20 min" },
                ]}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-border px-8 py-4 bg-card flex justify-center shrink-0">
        <button
          onClick={handleGenerate}
          disabled={!canGenerate}
          className="rounded-md bg-primary px-8 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {isGenerating ? "Generating..." : isAllTopicsMode ? "Generate from Entire Notebook →" : "Generate Quiz →"}
        </button>
      </div>
    </div>
  );
}
