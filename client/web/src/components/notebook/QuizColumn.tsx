import { useState } from "react";
import {
  type QuizDifficulty,
  type QuizGenerateOptions,
  type NotebookTopic,
  QUESTION_COUNT_OPTIONS,
  DIFFICULTY_OPTIONS,
  MODE_OPTIONS,
  TIMER_OPTIONS,
  COLLAPSED_MAX,
} from "@freshr/shared";
import QuizTopicChip from "../quiz/QuizTopicChip";
import Dropdown from "../ui/Dropdown";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { RiCloseLine, RiLoader4Line } from "@remixicon/react";

const FIELD_LABEL = "text-xs font-semibold tracking-[0.1em] uppercase";

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

  const isAllTopicsMode =
    selectedTopics.length === 0 && prompt.trim().length === 0;

  function toggleTopic(topic: NotebookTopic) {
    setSelectedTopics((prev) =>
      prev.some((t) => t.id === topic.id)
        ? prev.filter((t) => t.id !== topic.id)
        : [...prev, topic],
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
    <div className="bg-background flex h-full flex-col overflow-hidden">
      <div className="bg-card border-border flex h-11 shrink-0 items-center border-b px-4">
        <span className="text-muted-foreground text-xs font-semibold tracking-[0.12em] uppercase">
          Quiz generator
        </span>
      </div>

      <div className="freshr-scroll flex-1 overflow-y-auto px-4 py-8 md:px-8">
        <div className="mx-auto flex max-w-xl flex-col gap-6">
          <h2 className="text-2xl font-bold tracking-[-0.02em]">
            Generate a quiz
          </h2>

          <section className="flex flex-col gap-2.5">
            <div className="flex items-center justify-between gap-2">
              <span className={FIELD_LABEL}>Topics</span>
              {topicsExpanded && (
                <Button
                  variant="ghost"
                  size="xs"
                  onClick={() => setTopicsExpanded(false)}
                >
                  <RiCloseLine aria-hidden="true" />
                  Collapse
                </Button>
              )}
            </div>

            {isLoadingTopics ? (
              <p className="text-muted-foreground flex items-center gap-2 text-sm">
                <RiLoader4Line
                  className="size-4 animate-spin"
                  aria-hidden="true"
                />
                Loading topics…
              </p>
            ) : topics.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                No topics found. Upload files to your notebook first.
              </p>
            ) : topicsExpanded ? (
              <div className="bg-card border-input freshr-scroll flex max-h-36 flex-wrap gap-1.5 overflow-y-auto rounded-lg border p-3">
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
              <div className="flex flex-wrap items-center gap-1.5">
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
                  <Button
                    variant="link"
                    size="xs"
                    onClick={() => setTopicsExpanded(true)}
                  >
                    +{hiddenCount} more
                  </Button>
                )}
              </div>
            )}

            {selectedTopics.length > 0 ? (
              <p className="text-muted-foreground text-sm">
                {selectedTopics.length} topic
                {selectedTopics.length > 1 ? "s" : ""} selected
              </p>
            ) : (
              topics.length > 0 && (
                <p className="text-muted-foreground text-sm">
                  No topics selected — quiz will cover all topics
                </p>
              )
            )}
          </section>

          <Separator />

          <section className="flex flex-col gap-2">
            <Label htmlFor="quiz-prompt" className={FIELD_LABEL}>
              Or describe what you want to be quizzed on
            </Label>
            <Textarea
              id="quiz-prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g. Focus on the differences between mitosis and meiosis..."
              rows={3}
            />
          </section>

          <Separator />

          {/* Two-up on small screens so the four controls never overflow. */}
          <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <div className="flex flex-col gap-2">
              <span className={FIELD_LABEL}>Questions</span>
              <Dropdown
                value={String(questionCount)}
                onChange={(v) => setQuestionCount(Number(v))}
                placeholder="5"
                options={QUESTION_COUNT_OPTIONS.map((opt) => ({
                  value: String(opt.value),
                  label: opt.label,
                }))}
              />
            </div>

            <div className="flex flex-col gap-2">
              <span className={FIELD_LABEL}>Difficulty</span>
              <Dropdown
                value={difficulty}
                onChange={(v) => setDifficulty(v as QuizDifficulty)}
                placeholder="Easy"
                options={DIFFICULTY_OPTIONS}
              />
            </div>

            <div className="flex flex-col gap-2">
              <span className={FIELD_LABEL}>Mode</span>
              <Dropdown
                value={quizType}
                onChange={(v) => {
                  setQuizType(v);
                  if (v === "TIMED") {
                    setTimeLimit(5);
                  } else {
                    setTimeLimit(null);
                  }
                }}
                placeholder="Practice"
                options={MODE_OPTIONS}
              />
            </div>

            <div className="flex flex-col gap-2">
              <span className={FIELD_LABEL}>Time limit</span>
              <Dropdown
                value={timeLimit !== null ? String(timeLimit) : ""}
                onChange={(v) => setTimeLimit(v === "" ? null : Number(v))}
                placeholder="Select..."
                disabled={quizType !== "TIMED"}
                options={TIMER_OPTIONS.map((opt) => ({
                  value: String(opt.value),
                  label: opt.label,
                }))}
              />
            </div>
          </section>
        </div>
      </div>

      <div className="bg-card border-border flex shrink-0 justify-center border-t px-4 py-4">
        <Button size="lg" onClick={handleGenerate} disabled={!canGenerate}>
          {isGenerating && (
            <RiLoader4Line className="animate-spin" aria-hidden="true" />
          )}
          {isGenerating
            ? "Generating…"
            : isAllTopicsMode
              ? "Generate from entire notebook"
              : "Generate quiz"}
        </Button>
      </div>
    </div>
  );
}
