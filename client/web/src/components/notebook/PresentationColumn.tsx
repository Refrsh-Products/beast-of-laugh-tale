import { useState } from "react";
import type { NotebookTopic } from "@freshr/shared";
import QuizTopicChip from "../quiz/QuizTopicChip";
import Dropdown from "../ui/Dropdown";
import { cn } from "../../lib/utils";

const COLLAPSED_MAX = 4;

type PresentationTheme = "freshr" | "minimal" | "dark" | "academic" | "serif";

const THEMES: Record<PresentationTheme, { label: string; bg: string; text: string; accent: string }> = {
  freshr:   { label: "Freshr",   bg: "#ffffff", text: "#000000", accent: "#84e487" },
  minimal:  { label: "Minimal",  bg: "#ffffff", text: "#333333", accent: "#cccccc" },
  dark:     { label: "Dark",     bg: "#1a1a1a", text: "#ffffff", accent: "#84e487" },
  academic: { label: "Academic", bg: "#eef3f8", text: "#1e3a5f", accent: "#2a72b5" },
  serif:    { label: "Serif",    bg: "#faf7f2", text: "#3b2f1e", accent: "#8b6a1f" },
};

function ThemeCard({
  themeKey, selected, onClick,
}: { themeKey: PresentationTheme; selected: boolean; onClick: () => void }) {
  const t = THEMES[themeKey];
  const isFreshr = themeKey === "freshr";
  const isDark = themeKey === "dark";

  return (
    <button onClick={onClick} type="button" className="text-left w-full">
      <div
        className={cn(
          "w-full overflow-hidden rounded border-2 transition-all",
          selected ? "border-primary shadow-md" : "border-border hover:border-primary/50",
        )}
        style={{ aspectRatio: "16/9", background: t.bg, display: "flex" }}
      >
        {isFreshr && <div style={{ width: 6, background: t.accent, flexShrink: 0 }} />}
        <div style={{ flex: 1, padding: "8px 10px", display: "flex", flexDirection: "column", gap: 4 }}>
          <div style={{ height: 4, width: "55%", background: isDark ? t.accent : isFreshr ? "#000" : t.accent, borderRadius: 1 }} />
          {[78, 62, 70].map((w, i) => (
            <div key={i} style={{ height: 3, width: `${w}%`, background: t.text, opacity: isDark ? 0.5 : 0.22, borderRadius: 1 }} />
          ))}
        </div>
      </div>
      <span className={cn("block mt-1.5 text-xs text-foreground", selected && "font-medium")}>{t.label}</span>
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
  const [textLength, setTextLength] = useState<"brief" | "balanced" | "detailed">("balanced");
  const [theme, setTheme] = useState<PresentationTheme>("freshr");

  const canGenerate = !isGenerating;
  const isAllTopicsMode = selectedTopics.length === 0 && customTopic.trim().length === 0;

  function toggleTopic(topic: NotebookTopic) {
    setSelectedTopics((prev) =>
      prev.some((t) => t.id === topic.id) ? prev.filter((t) => t.id !== topic.id) : [...prev, topic],
    );
  }

  async function handleGenerate() {
    if (!canGenerate) return;
    await onGenerate({ topics: selectedTopics, customTopic: customTopic.trim(), numSlides, textLength, theme });
  }

  const selectedIds = new Set(selectedTopics.map((t) => t.id));
  const previewTopics = topics.slice(0, COLLAPSED_MAX);
  const hiddenCount = topics.length - COLLAPSED_MAX;

  return (
    <div className="flex flex-col h-full bg-background overflow-hidden">
      <div className="h-11 flex items-center px-4 border-b border-border bg-card shrink-0">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Presentation Generator</span>
      </div>

      <div className="flex-1 overflow-y-auto px-8 py-8">
        <div className="max-w-xl mx-auto space-y-5">
          <h2 className="text-lg font-semibold text-foreground">Generate a Presentation</h2>

          {/* Topics */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Topics</label>
              {topicsExpanded && (
                <button onClick={() => setTopicsExpanded(false)} className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                  × Collapse
                </button>
              )}
            </div>

            {isLoadingTopics ? (
              <p className="text-xs text-muted-foreground">Loading topics...</p>
            ) : topics.length === 0 ? (
              <p className="text-xs text-muted-foreground leading-relaxed">No topics found. Upload files to your notebook first.</p>
            ) : topicsExpanded ? (
              <div className="border border-border rounded-md bg-secondary/20 max-h-28 overflow-y-auto p-2.5 flex flex-wrap gap-1.5">
                {topics.map((topic) => (
                  <QuizTopicChip key={topic.id} label={topic.name} selected={selectedIds.has(topic.id)} onToggle={() => toggleTopic(topic)} compact={false} />
                ))}
              </div>
            ) : (
              <div className="flex flex-wrap gap-1.5 items-center">
                {previewTopics.map((topic) => (
                  <QuizTopicChip key={topic.id} label={topic.name} selected={selectedIds.has(topic.id)} onToggle={() => toggleTopic(topic)} compact />
                ))}
                {hiddenCount > 0 && (
                  <button onClick={() => setTopicsExpanded(true)} className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-4">
                    +{hiddenCount} more
                  </button>
                )}
              </div>
            )}

            <p className="text-xs text-muted-foreground mt-1.5">
              {selectedTopics.length > 0
                ? `${selectedTopics.length} topic${selectedTopics.length > 1 ? "s" : ""} selected`
                : topics.length > 0 ? "No topics selected — presentation will cover all topics" : ""}
            </p>
          </div>

          {/* Custom topic */}
          <div>
            <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
              Or describe your own topic
            </label>
            <textarea
              value={customTopic}
              onChange={(e) => setCustomTopic(e.target.value)}
              placeholder="e.g. Compare the causes and effects of WWI and WWII..."
              rows={3}
              className="w-full rounded-md border border-border bg-input px-3 py-2 text-sm text-foreground outline-none focus:ring-1 focus:ring-ring placeholder:text-muted-foreground resize-vertical transition-colors leading-relaxed"
            />
          </div>

          {/* Slides + Length */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Slides</label>
              <Dropdown
                value={String(numSlides)}
                onChange={(v) => setNumSlides(Number(v))}
                placeholder="10"
                options={[
                  { value: "5", label: "5" }, { value: "8", label: "8" },
                  { value: "10", label: "10" }, { value: "15", label: "15" }, { value: "20", label: "20" },
                ]}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Length</label>
              <Dropdown
                value={textLength}
                onChange={(v) => setTextLength(v as "brief" | "balanced" | "detailed")}
                placeholder="Balanced"
                options={[
                  { value: "brief", label: "Brief" },
                  { value: "balanced", label: "Balanced" },
                  { value: "detailed", label: "Detailed" },
                ]}
              />
            </div>
          </div>

          {/* Style cards */}
          <div>
            <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">Style</label>
            <div className="grid grid-cols-3 gap-3">
              {(Object.keys(THEMES) as PresentationTheme[]).map((key) => (
                <ThemeCard key={key} themeKey={key} selected={theme === key} onClick={() => setTheme(key)} />
              ))}
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
          {isGenerating ? "Generating..." : isAllTopicsMode ? "Generate from Entire Notebook →" : "Generate Presentation →"}
        </button>
      </div>
    </div>
  );
}
