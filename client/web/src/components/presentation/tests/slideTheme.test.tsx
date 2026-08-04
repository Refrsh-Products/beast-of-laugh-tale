import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, render } from "@testing-library/react";
import type { PresentationSession, PresentationSlide } from "@freshr/shared";
import usePresentationSessions from "../../../hooks/presentation/usePresentationSessions";
import usePresentationService from "../../../services/presentation";
import useNotebookService from "../../../services/notebooks";
import { renderSlideContent } from "../SlideLayouts";
import {
  DEFAULT_SLIDE_THEME,
  PRESENTATION_THEMES,
  PRESENTATION_THEME_KEYS,
  resolveSlideTheme,
} from "../presentationThemes";

vi.mock("../../../services/presentation");
vi.mock("../../../services/notebooks");

const NOTEBOOK_ID = "notebook-1";

function makeSession(
  overrides: Partial<PresentationSession> = {},
): PresentationSession {
  return {
    id: "presentation-1",
    notebook: NOTEBOOK_ID,
    title: "Photosynthesis",
    topic: "Photosynthesis",
    slide_count: 5,
    text_length: "BALANCED",
    theme: "freshr",
    status: "QUEUED",
    is_favourite: false,
    generated_at: new Date().toISOString(),
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// The dropped hop: picker → create payload
// ---------------------------------------------------------------------------

describe("handleGeneratePresentation", () => {
  const createPresentation = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    createPresentation.mockResolvedValue(makeSession({ theme: "dark" }));
    vi.mocked(usePresentationService).mockReturnValue({
      createPresentation,
      getPresentation: vi.fn().mockResolvedValue(makeSession({ theme: "dark" })),
      listPresentationsByNotebook: vi.fn().mockResolvedValue([]),
      updatePresentation: vi.fn(),
      deletePresentation: vi.fn(),
      updateSlide: vi.fn(),
      refineSlide: vi.fn(),
      listFavouritePresentations: vi.fn(),
    });
    vi.mocked(useNotebookService).mockReturnValue({
      listTopics: vi.fn().mockResolvedValue([]),
    } as unknown as ReturnType<typeof useNotebookService>);
  });

  function setup() {
    return renderHook(() =>
      usePresentationSessions(
        NOTEBOOK_ID,
        vi.fn(),
        "presentation",
        vi.fn(),
        vi.fn(),
      ),
    );
  }

  it("sends the picked theme to the create endpoint", async () => {
    const { result } = setup();

    await act(async () => {
      await result.current.handleGeneratePresentation({
        topics: [],
        customTopic: "",
        numSlides: 5,
        textLength: "balanced",
        theme: "dark",
      });
    });

    expect(createPresentation).toHaveBeenCalledWith(
      expect.objectContaining({ theme: "dark" }),
    );
  });

  it("sends whichever theme the user picked, not a fixed default", async () => {
    const { result } = setup();

    await act(async () => {
      await result.current.handleGeneratePresentation({
        topics: [],
        customTopic: "",
        numSlides: 8,
        textLength: "brief",
        theme: "academic",
      });
    });

    expect(createPresentation).toHaveBeenCalledWith(
      expect.objectContaining({ theme: "academic" }),
    );
  });
});

// ---------------------------------------------------------------------------
// Session key → palette
// ---------------------------------------------------------------------------

describe("resolveSlideTheme", () => {
  it("maps each stored key onto its own palette", () => {
    for (const key of PRESENTATION_THEME_KEYS) {
      expect(resolveSlideTheme(key)).toBe(PRESENTATION_THEMES[key]);
    }
  });

  it("gives distinct backgrounds to distinct themes", () => {
    expect(resolveSlideTheme("dark").bg).not.toBe(
      resolveSlideTheme("freshr").bg,
    );
  });

  it("falls back to the default for a missing or unknown key", () => {
    // Decks generated before the field existed carry no theme.
    expect(resolveSlideTheme(undefined)).toBe(DEFAULT_SLIDE_THEME);
    expect(resolveSlideTheme("neon-vaporwave")).toBe(DEFAULT_SLIDE_THEME);
  });
});

// ---------------------------------------------------------------------------
// Palette → rendered slide
// ---------------------------------------------------------------------------

describe("renderSlideContent", () => {
  const slide: PresentationSlide = {
    id: "slide-1",
    order_index: 0,
    layout: "bullets",
    title: "Light reactions",
    bullets: ["Chlorophyll absorbs photons", "Water is split"],
    speaker_notes: "",
    images: [],
  };

  /** jsdom serialises inline colours as `rgb(r, g, b)`. */
  function rgb(hex: string): string {
    const n = parseInt(hex.replace("#", ""), 16);
    return `rgb(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255})`;
  }

  function renderWithTheme(theme = DEFAULT_SLIDE_THEME) {
    const { container } = render(<div>{renderSlideContent(slide, theme)}</div>);
    const title = Array.from(container.querySelectorAll("div")).find(
      (el) => el.textContent === slide.title,
    ) as HTMLElement;

    return {
      title,
      bullet: container.querySelector("span") as HTMLElement,
      html: container.innerHTML,
    };
  }

  it("paints the title and bullets in the theme's colours", () => {
    const { title, bullet } = renderWithTheme(PRESENTATION_THEMES.dark);

    expect(title.style.color).toBe(rgb(PRESENTATION_THEMES.dark.text));
    expect(bullet.style.color).toBe(rgb(PRESENTATION_THEMES.dark.accent));
  });

  it("renders the same slide differently under a different theme", () => {
    const dark = renderWithTheme(PRESENTATION_THEMES.dark);
    const academic = renderWithTheme(PRESENTATION_THEMES.academic);

    expect(dark.html).not.toBe(academic.html);
    expect(academic.title.style.color).toBe(
      rgb(PRESENTATION_THEMES.academic.text),
    );
    expect(academic.bullet.style.color).toBe(
      rgb(PRESENTATION_THEMES.academic.accent),
    );
  });

  it("sets each theme's own body face", () => {
    // jsdom's CSSOM rewrites single quotes in a font stack to double quotes.
    const faces = (s: string) => s.replace(/['"]/g, "");

    expect(
      faces(renderWithTheme(PRESENTATION_THEMES.serif).title.style.fontFamily),
    ).toBe(faces(PRESENTATION_THEMES.serif.bodyFont));
    expect(
      faces(renderWithTheme(PRESENTATION_THEMES.freshr).title.style.fontFamily),
    ).toBe(faces(PRESENTATION_THEMES.freshr.bodyFont));
    // Serif and Freshr must not resolve to the same face.
    expect(faces(PRESENTATION_THEMES.serif.bodyFont)).not.toBe(
      faces(PRESENTATION_THEMES.freshr.bodyFont),
    );
  });

  it("omits the accent strip for themes that do not use one", () => {
    const freshr = renderWithTheme(PRESENTATION_THEMES.freshr);
    const minimal = renderWithTheme(PRESENTATION_THEMES.minimal);

    // `margin-right: 0.8em` is unique to the strip element.
    expect(freshr.html).toContain("margin-right: 0.8em");
    expect(minimal.html).not.toContain("margin-right: 0.8em");
  });
});

// ---------------------------------------------------------------------------
// Every theme must be renderable and exportable
// ---------------------------------------------------------------------------

describe("PRESENTATION_THEMES", () => {
  it("gives every theme a PPTX-safe single font name", () => {
    for (const key of PRESENTATION_THEME_KEYS) {
      const { pptxFont } = PRESENTATION_THEMES[key];
      // Office rejects CSS font stacks — no commas, no quotes.
      expect(pptxFont).not.toMatch(/[,'"]/);
      expect(pptxFont.length).toBeGreaterThan(0);
    }
  });
});
