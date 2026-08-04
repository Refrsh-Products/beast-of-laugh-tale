import { useEffect, useRef, useState } from "react";
import { Deck, Slide } from "@revealjs/react";
import resetCssUrl from "reveal.js/reset.css?url";
import revealCssUrl from "reveal.js/reveal.css?url";
import type { PresentationSession, PresentationSlide } from "@freshr/shared";
import SlideEditor from "./SlideEditor";
import { renderSlideContent } from "./SlideLayouts";
import { exportAsPdf, exportAsPptx } from "./exportPresentation";
import {
  DEFAULT_SLIDE_THEME,
  blendedSlideText,
  type SlideTheme,
} from "./presentationThemes";
import MobileDrawer from "../ui/MobileDrawer";
import { useMediaQuery } from "../../hooks/useMediaQuery";
import { BP_TABLET } from "../../constants/breakpoints";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import {
  RiArrowLeftSLine,
  RiArrowRightSLine,
  RiCloseLine,
  RiEditLine,
  RiGalleryView2,
  RiMenuLine,
  RiSendPlane2Line,
} from "@remixicon/react";

interface AiMessage {
  role: "user" | "ai";
  content: string;
}

interface PresentationViewerProps {
  presentation: PresentationSession;
  onClose: () => void;
  onUpdate?: (updatedSlides: PresentationSlide[]) => void;
  onRefineSlide?: (
    slideId: string,
    feedback: string,
  ) => Promise<PresentationSlide>;
  /**
   * The deck's palette. Defaults to Freshr because PresentationSession carries
   * no theme field yet — see DEFAULT_SLIDE_THEME.
   */
  theme?: SlideTheme;
}

// ─── Slide thumbnail (right panel) ───────────────────────────────────────────

function SlideThumbnail({
  slide,
  index,
  selected,
  theme,
  onClick,
}: {
  slide: PresentationSlide;
  index: number;
  selected: boolean;
  theme: SlideTheme;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={selected}
      className={cn(
        "border-border focus-visible:ring-ring/50 block w-full cursor-pointer border-b p-2.5 text-left transition-colors focus-visible:ring-[3px] focus-visible:outline-none",
        selected ? "bg-accent" : "hover:bg-muted/50",
      )}
    >
      {/* 16:9 thumbnail, painted in the deck's own palette */}
      <div
        className={cn(
          "flex aspect-video w-full overflow-hidden rounded-sm border transition-colors",
          selected ? "border-primary" : "border-border",
        )}
        style={{ background: theme.bg }}
      >
        {theme.accentStrip && (
          <div
            style={{ width: 4, background: theme.accent, flexShrink: 0 }}
          />
        )}
        <div className="flex flex-1 flex-col gap-[3px] overflow-hidden px-[7px] py-[5px]">
          <div
            className="truncate text-[0.42rem] leading-tight font-bold"
            style={{ color: theme.text }}
          >
            {slide.title || slide.caption || slide.quote || "Untitled"}
          </div>
          {slide.bullets.slice(0, 3).map((bullet, i) => (
            <div key={i} className="flex items-start gap-[3px]">
              <div
                className="mt-[2px] size-[2px] shrink-0 rounded-full"
                style={{ background: theme.accent }}
              />
              <div
                className="truncate text-[0.32rem] leading-tight"
                style={{ color: blendedSlideText(theme) }}
              >
                {bullet}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div
        className={cn(
          "mt-[5px] text-center text-[0.58rem] tabular-nums",
          selected ? "text-foreground font-bold" : "text-muted-foreground",
        )}
      >
        {index + 1}
      </div>
    </button>
  );
}

// ─── AI chat transcript, shared by the inline panel and the mobile drawer ────

function AiTranscript({
  messages,
  isRefining,
  emptyHint = false,
  endRef,
}: {
  messages: AiMessage[];
  isRefining: boolean;
  emptyHint?: boolean;
  endRef?: React.RefObject<HTMLDivElement | null>;
}) {
  return (
    <div className="freshr-scroll min-h-0 flex-1 overflow-y-auto p-3">
      {emptyHint && messages.length === 0 && (
        <p className="text-muted-foreground p-2 text-xs">
          No messages yet. Ask AI to edit the current slide using the input
          below.
        </p>
      )}
      {messages.map((msg, i) => (
        <div
          key={i}
          className={cn(
            "mb-3 flex flex-col",
            msg.role === "user" ? "items-end" : "items-start",
          )}
        >
          <div
            className={cn(
              "max-w-[85%] rounded-2xl px-2.5 py-2 text-xs leading-relaxed",
              msg.role === "user"
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-foreground",
            )}
          >
            {msg.content}
          </div>
        </div>
      ))}
      {isRefining && (
        <div className="mb-3 flex items-start">
          <div className="bg-muted text-muted-foreground rounded-2xl px-2.5 py-2 text-xs">
            Thinking…
          </div>
        </div>
      )}
      <div ref={endRef} />
    </div>
  );
}

/** Small caps heading used by both side panels. */
function PanelHeader({
  title,
  action,
}: {
  title: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="border-border flex h-10 shrink-0 items-center justify-between border-b px-3">
      <span className="text-muted-foreground text-xs font-semibold tracking-[0.1em] uppercase">
        {title}
      </span>
      {action}
    </div>
  );
}

// ─── Main viewer ─────────────────────────────────────────────────────────────

export default function PresentationViewer({
  presentation,
  onClose,
  onUpdate,
  onRefineSlide,
  theme = DEFAULT_SLIDE_THEME,
}: PresentationViewerProps) {
  const deckRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const [editMode, setEditMode] = useState(false);
  const [draftSlides, setDraftSlides] = useState<PresentationSlide[]>([]);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [aiMessages, setAiMessages] = useState<AiMessage[]>([]);
  const [aiPanelCollapsed, setAiPanelCollapsed] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [isRefining, setIsRefining] = useState(false);
  const [slideEditorKey, setSlideEditorKey] = useState(0);
  const [deckKey, setDeckKey] = useState(0);
  const [exporting, setExporting] = useState(false);
  const isCompact = useMediaQuery(BP_TABLET);
  const [chatDrawerOpen, setChatDrawerOpen] = useState(false);
  const [slidesDrawerOpen, setSlidesDrawerOpen] = useState(false);

  // Inject / remove reveal.js CSS in normal mode
  useEffect(() => {
    if (editMode) return;
    const links = [resetCssUrl, revealCssUrl].map((href) => {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = href;
      document.head.appendChild(link);
      return link;
    });
    return () => links.forEach((l) => l.remove());
  }, [editMode]);

  // ResizeObserver for reveal.js layout
  useEffect(() => {
    if (editMode || !containerRef.current) return;
    const observer = new ResizeObserver(() => deckRef.current?.layout());
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [editMode]);

  // Scroll AI chat to bottom on new message
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [aiMessages]);

  async function handleExport(format: "pdf" | "pptx") {
    setExporting(true);
    try {
      if (format === "pdf") await exportAsPdf(presentation, theme);
      else await exportAsPptx(presentation, theme);
    } finally {
      setExporting(false);
    }
  }

  const slides = presentation.slides ?? [];

  function enterEditMode() {
    const currentIndex = deckRef.current?.getIndices()?.h ?? 0;
    setDraftSlides(slides.map((s) => ({ ...s, bullets: [...s.bullets] })));
    setCurrentSlideIndex(currentIndex);
    setEditMode(true);
  }

  function commitEdits() {
    onUpdate?.(draftSlides);
    setDeckKey((k) => k + 1);
    setEditMode(false);
    setDraftSlides([]);
    setAiMessages([]);
  }

  function discardEdits() {
    if (draftSlides.length > 0) {
      if (!window.confirm("Discard changes?")) return;
    }
    setEditMode(false);
    setDraftSlides([]);
    setAiMessages([]);
  }

  function updateSlide(index: number, updated: PresentationSlide) {
    setDraftSlides((prev) => prev.map((s, i) => (i === index ? updated : s)));
  }

  async function handleSendChat() {
    if (!chatInput.trim() || isRefining) return;
    const content = chatInput.trim();
    setChatInput("");
    setAiPanelCollapsed(false);
    setAiMessages((prev) => [...prev, { role: "user", content }]);

    if (!onRefineSlide || !activeDraftSlide) {
      setAiMessages((prev) => [
        ...prev,
        { role: "ai", content: "AI slide editing is not available." },
      ]);
      return;
    }

    setIsRefining(true);
    try {
      const updatedSlide = await onRefineSlide(activeDraftSlide.id, content);
      updateSlide(currentSlideIndex, updatedSlide);
      setSlideEditorKey((k) => k + 1);
      setAiMessages((prev) => [
        ...prev,
        { role: "ai", content: "I have successfully made your changes." },
      ]);
    } catch {
      setAiMessages((prev) => [
        ...prev,
        {
          role: "ai",
          content: "Sorry, failed to update the slide, try again.",
        },
      ]);
    } finally {
      setIsRefining(false);
    }
  }

  const showAiPanel = aiMessages.length > 0;

  // ── Top bar ─────────────────────────────────────────────────────────────────

  const topBar = (
    <div className="border-border bg-card flex h-12 shrink-0 items-center justify-between gap-2 border-b px-3 sm:px-6">
      <div className="flex min-w-0 flex-1 items-center gap-2">
        {editMode && isCompact && (
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Open AI chat"
            onClick={() => setChatDrawerOpen(true)}
          >
            <RiMenuLine aria-hidden="true" />
          </Button>
        )}
        <span className="text-primary truncate text-xs font-bold tracking-[0.1em]">
          {presentation.topic || "Presentation"}
        </span>
        {editMode && (
          <span className="text-muted-foreground shrink-0 text-[0.6rem] tracking-[0.08em]">
            · EDITING
          </span>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-1.5 sm:gap-2.5">
        {editMode && isCompact && (
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Open slide list"
            onClick={() => setSlidesDrawerOpen(true)}
          >
            <RiGalleryView2 aria-hidden="true" />
          </Button>
        )}
        {editMode ? (
          <>
            <Button variant="secondary" size="sm" onClick={commitEdits}>
              Done editing
            </Button>
            <Button variant="ghost" size="sm" onClick={discardEdits}>
              <RiCloseLine aria-hidden="true" />
              <span className="hidden sm:inline">Discard</span>
            </Button>
          </>
        ) : (
          <>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" disabled={exporting}>
                  {exporting ? "Exporting…" : "Export"}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onSelect={() => handleExport("pdf")}>
                  Export as PDF
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => handleExport("pptx")}>
                  Export as PPTX
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button variant="outline" size="sm" onClick={enterEditMode}>
              <RiEditLine aria-hidden="true" />
              <span className="hidden sm:inline">Edit</span>
            </Button>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <RiCloseLine aria-hidden="true" />
              <span className="hidden sm:inline">Close</span>
            </Button>
          </>
        )}
      </div>
    </div>
  );

  // The viewer is a full-screen media surface, so its chrome is pinned to the
  // dark palette regardless of the app's theme — the same reasoning as a
  // lightbox. Scoping the `dark` class here keeps that a token lookup rather
  // than a second set of hardcoded colours.
  // Follows the app's own theme rather than pinning itself dark like a
  // lightbox: the export menu and the mobile drawers are portalled to <body>,
  // so they escape any theme class scoped to this subtree and would render
  // light against dark chrome.
  //
  // z-40 sits above page content (which tops out at z-10) and below the z-50
  // portal layer, so those same portals paint over this surface, not under it.
  const shellClass =
    "bg-background text-foreground fixed inset-0 z-40 flex flex-col";

  // ── Normal mode (reveal.js) ──────────────────────────────────────────────────

  if (!editMode) {
    return (
      <div className={shellClass}>
        {topBar}
        <div ref={containerRef} className="relative flex-1 overflow-hidden">
          <Deck
            key={deckKey}
            onReady={(d) => {
              deckRef.current = d;
            }}
            config={{
              embedded: true,
              width: 1280,
              height: 720,
              margin: 0.08,
              controls: true,
              controlsTutorial: false,
              progress: true,
              center: true,
              transition: "slide",
              keyboard: true,
            }}
          >
            {slides.length > 0 ? (
              slides.map((slide) => (
                <Slide key={slide.id} background={theme.bg}>
                  <div
                    style={{
                      textAlign: "left",
                      display: "flex",
                      flexDirection: "column",
                      height: "100%",
                      padding: "0.8em 0.8em 0.6em",
                      boxSizing: "border-box",
                    }}
                  >
                    <div
                      style={{ display: "flex", flex: 1, overflow: "hidden" }}
                    >
                      {renderSlideContent(slide, theme)}
                    </div>
                    <div
                      style={{
                        borderTop: `1px solid ${blendedSlideText(theme, 0.15)}`,
                        marginTop: "0.6em",
                        paddingTop: "0.4em",
                        display: "flex",
                        justifyContent: "space-between",
                        flexShrink: 0,
                        fontFamily: "'IBM Plex Mono', monospace",
                        fontSize: "0.55em",
                        color: blendedSlideText(theme),
                      }}
                    >
                      <span style={{ letterSpacing: "0.1em" }}>
                        {presentation.topic?.toUpperCase()}
                      </span>
                      <span>
                        {slide.order_index + 1} / {slides.length}
                      </span>
                    </div>
                  </div>
                </Slide>
              ))
            ) : (
              <Slide background={theme.bg}>
                <p
                  style={{
                    fontFamily: "'IBM Plex Mono', monospace",
                    color: blendedSlideText(theme),
                  }}
                >
                  No slides available.
                </p>
              </Slide>
            )}
          </Deck>
        </div>
      </div>
    );
  }

  // ── Edit mode ────────────────────────────────────────────────────────────────

  const activeDraftSlide = draftSlides[currentSlideIndex];
  const showAiPanelInline = showAiPanel && !isCompact;

  return (
    <div className={shellClass}>
      {topBar}

      <div className="flex flex-1 overflow-hidden">
        {/* AI chat panel (inline on desktop) */}
        {showAiPanelInline && (
          <div
            className={cn(
              "border-border bg-card flex shrink-0 flex-col overflow-hidden border-r transition-[width]",
              aiPanelCollapsed ? "w-9" : "w-65",
            )}
          >
            {aiPanelCollapsed ? (
              <div className="flex h-full items-start justify-center pt-3">
                <Button
                  variant="ghost"
                  size="icon-xs"
                  aria-label="Expand chat"
                  onClick={() => setAiPanelCollapsed(false)}
                >
                  <RiArrowRightSLine aria-hidden="true" />
                </Button>
              </div>
            ) : (
              <>
                <PanelHeader
                  title="AI chat"
                  action={
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      aria-label="Collapse chat"
                      onClick={() => setAiPanelCollapsed(true)}
                    >
                      <RiArrowLeftSLine aria-hidden="true" />
                    </Button>
                  }
                />
                <AiTranscript
                  messages={aiMessages}
                  isRefining={isRefining}
                  endRef={chatEndRef}
                />
              </>
            )}
          </div>
        )}

        {/* Center: slide editor + chat input */}
        <div className="border-border flex flex-1 flex-col overflow-hidden border-r">
          <div className="flex-1 overflow-hidden">
            {activeDraftSlide && (
              <SlideEditor
                key={`${activeDraftSlide.id}-${slideEditorKey}`}
                slide={activeDraftSlide}
                totalSlides={draftSlides.length}
                theme={theme}
                onChange={(updated) => updateSlide(currentSlideIndex, updated)}
              />
            )}
          </div>

          {/* Chat input */}
          <div className="border-border bg-card flex shrink-0 gap-2.5 border-t px-4 py-3">
            <Input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSendChat()}
              placeholder="Ask AI to edit this slide..."
              aria-label="Ask AI to edit this slide"
              disabled={isRefining}
            />
            <Button onClick={handleSendChat} disabled={isRefining}>
              <RiSendPlane2Line aria-hidden="true" />
              <span className="hidden sm:inline">Send</span>
            </Button>
          </div>
        </div>

        {/* Right: slide thumbnails (inline on desktop) */}
        {!isCompact && (
          <div className="bg-card w-45 shrink-0 overflow-y-auto">
            <PanelHeader title="Slides" />
            {draftSlides.map((slide, i) => (
              <SlideThumbnail
                key={slide.id}
                slide={slide}
                index={i}
                theme={theme}
                selected={i === currentSlideIndex}
                onClick={() => setCurrentSlideIndex(i)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Mobile drawers for AI chat + slide list */}
      {isCompact && (
        <>
          <MobileDrawer
            open={chatDrawerOpen}
            onClose={() => setChatDrawerOpen(false)}
            side="left"
            width="min(320px, 90vw)"
            ariaLabel="AI chat"
          >
            <div className="bg-card flex h-full flex-col">
              <PanelHeader
                title="AI chat"
                action={
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    aria-label="Close chat"
                    onClick={() => setChatDrawerOpen(false)}
                  >
                    <RiCloseLine aria-hidden="true" />
                  </Button>
                }
              />
              <AiTranscript
                messages={aiMessages}
                isRefining={isRefining}
                emptyHint
              />
            </div>
          </MobileDrawer>

          <MobileDrawer
            open={slidesDrawerOpen}
            onClose={() => setSlidesDrawerOpen(false)}
            side="right"
            width="min(220px, 75vw)"
            ariaLabel="Slide list"
          >
            <div className="bg-card flex h-full flex-col">
              <PanelHeader
                title="Slides"
                action={
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    aria-label="Close slide list"
                    onClick={() => setSlidesDrawerOpen(false)}
                  >
                    <RiCloseLine aria-hidden="true" />
                  </Button>
                }
              />
              <div className="freshr-scroll min-h-0 flex-1 overflow-y-auto">
                {draftSlides.map((slide, i) => (
                  <SlideThumbnail
                    key={slide.id}
                    slide={slide}
                    index={i}
                    theme={theme}
                    selected={i === currentSlideIndex}
                    onClick={() => {
                      setCurrentSlideIndex(i);
                      setSlidesDrawerOpen(false);
                    }}
                  />
                ))}
              </div>
            </div>
          </MobileDrawer>
        </>
      )}
    </div>
  );
}
