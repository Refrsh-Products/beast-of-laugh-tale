import { useState } from "react";
import type { NotebookTopic } from "@freshr/shared";
import QuizTopicChip from "../quiz/QuizTopicChip";
import Dropdown from "../ui/Dropdown";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { RiCloseLine, RiLoader4Line } from "@remixicon/react";
import {
  PRESENTATION_THEMES,
  PRESENTATION_THEME_KEYS,
  type PresentationTheme,
} from "../presentation/presentationThemes";

const COLLAPSED_MAX = 4;

const FIELD_LABEL = "text-xs font-semibold tracking-[0.1em] uppercase";

/**
 * A miniature of the slide theme. The swatch colours come from the theme data
 * rather than design tokens on purpose — it previews how the exported deck
 * will look, which must not change with the app's own light/dark mode.
 */
function ThemeCard({
  themeKey,
  selected,
  onClick,
}: {
  themeKey: PresentationTheme;
  selected: boolean;
  onClick: () => void;
}) {
  const theme = PRESENTATION_THEMES[themeKey];
  const isDark = themeKey === "dark";

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className="focus-visible:ring-ring/50 flex cursor-pointer flex-col gap-1.5 rounded-lg focus-visible:ring-[3px] focus-visible:outline-none"
    >
      <div
        className={cn(
          "flex aspect-video w-full overflow-hidden rounded-md border-2 transition-colors",
          selected ? "border-primary" : "border-border hover:border-input",
        )}
        // eslint-disable-next-line no-restricted-syntax -- slide theme preview, not app chrome
        style={{ background: theme.bg }}
      >
        {theme.accentStrip && (
          <div
            className="w-1.5 shrink-0"
            // eslint-disable-next-line no-restricted-syntax -- slide theme preview
            style={{ background: theme.accent }}
          />
        )}
        <div className="flex flex-1 flex-col gap-1 p-2">
          <div
            className="h-1 w-[55%] rounded-full"
            // eslint-disable-next-line no-restricted-syntax -- slide theme preview
            style={{ background: isDark ? theme.accent : theme.text }}
          />
          {[78, 62, 70].map((width) => (
            <div
              key={width}
              className="h-0.5 rounded-full"
              // eslint-disable-next-line no-restricted-syntax -- slide theme preview
              style={{
                width: `${width}%`,
                background: theme.text,
                opacity: isDark ? 0.5 : 0.22,
              }}
            />
          ))}
        </div>
      </div>
      <span
        className={cn(
          "text-xs",
          selected ? "text-foreground font-semibold" : "text-muted-foreground",
        )}
      >
        {theme.label}
      </span>
    </button>
  );
}

export interface PresentationGenerateOptions {
  topics: NotebookTopic[];
  customTopic: string;
  numSlides: number;
  textLength: "brief" | "balanced" | "detailed";
  theme: PresentationTheme;
}

interface PresentationColumnProps {
  topics: NotebookTopic[];
  isLoadingTopics: boolean;
  onGenerate: (options: PresentationGenerateOptions) => Promise<void>;
  isGenerating: boolean;
}

export default function PresentationColumn({
  topics,
  isLoadingTopics,
  onGenerate,
  isGenerating,
}: PresentationColumnProps) {
  const [topicsExpanded, setTopicsExpanded] = useState(false);
  const [selectedTopics, setSelectedTopics] = useState<NotebookTopic[]>([]);
  const [customTopic, setCustomTopic] = useState("");
  const [numSlides, setNumSlides] = useState(10);
  const [textLength, setTextLength] = useState<
    "brief" | "balanced" | "detailed"
  >("balanced");
  const [theme, setTheme] = useState<PresentationTheme>("freshr");

  const canGenerate = !isGenerating;
  const isAllTopicsMode =
    selectedTopics.length === 0 && customTopic.trim().length === 0;

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
      customTopic: customTopic.trim(),
      numSlides,
      textLength,
      theme,
    });
  }

  const selectedIds = new Set(selectedTopics.map((t) => t.id));
  const previewTopics = topics.slice(0, COLLAPSED_MAX);
  const hiddenCount = topics.length - COLLAPSED_MAX;

  return (
    <div className="bg-background flex h-full flex-col overflow-hidden">
      <div className="bg-card border-border flex h-11 shrink-0 items-center border-b px-4">
        <span className="text-muted-foreground text-xs font-semibold tracking-[0.12em] uppercase">
          Presentation generator
        </span>
      </div>

      <div className="freshr-scroll flex-1 overflow-y-auto px-4 py-8 md:px-8">
        <div className="mx-auto flex max-w-xl flex-col gap-6">
          <h2 className="text-2xl font-bold tracking-[-0.02em]">
            Generate a presentation
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
                  No topics selected — the deck will cover all topics
                </p>
              )
            )}
          </section>

          <Separator />

          <section className="flex flex-col gap-2">
            <Label htmlFor="presentation-topic" className={FIELD_LABEL}>
              Or describe your own topic
            </Label>
            <Textarea
              id="presentation-topic"
              value={customTopic}
              onChange={(e) => setCustomTopic(e.target.value)}
              placeholder="e.g. A 10-minute overview of photosynthesis for first years..."
              rows={3}
            />
          </section>

          <Separator />

          <section className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <span className={FIELD_LABEL}>Slides</span>
              <Dropdown
                value={String(numSlides)}
                onChange={(v) => setNumSlides(Number(v))}
                placeholder="10"
                options={[
                  { value: "5", label: "5" },
                  { value: "8", label: "8" },
                  { value: "10", label: "10" },
                  { value: "15", label: "15" },
                  { value: "20", label: "20" },
                ]}
              />
            </div>
            <div className="flex flex-col gap-2">
              <span className={FIELD_LABEL}>Length</span>
              <Dropdown
                value={textLength}
                onChange={(v) =>
                  setTextLength(v as "brief" | "balanced" | "detailed")
                }
                placeholder="Balanced"
                options={[
                  { value: "brief", label: "Brief" },
                  { value: "balanced", label: "Balanced" },
                  { value: "detailed", label: "Detailed" },
                ]}
              />
            </div>
          </section>

          <section className="flex flex-col gap-2">
            <span className={FIELD_LABEL}>Style</span>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {PRESENTATION_THEME_KEYS.map((key) => (
                <ThemeCard
                  key={key}
                  themeKey={key}
                  selected={theme === key}
                  onClick={() => setTheme(key)}
                />
              ))}
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
              : "Generate presentation"}
        </Button>
      </div>
    </div>
  );
}
