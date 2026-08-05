import type {
  PresentationCreatePayload,
  PresentationService,
  PresentationSession,
  PresentationSlide,
  SlideImage,
  SlideUpdatePayload,
} from "@freshr/shared";
import { DEFAULT_PRESENTATION_THEME_KEY } from "@freshr/shared";

const mockStore = new Map<string, PresentationSession>();

const img = (seed: number, w = 800, h = 500): SlideImage => ({
  query: `seed-${seed}`,
  url: `https://picsum.photos/seed/${seed}/${w}/${h}`,
  attribution: "picsum.photos",
  source_page: `https://picsum.photos/seed/${seed}`,
});

function makeFakeSlides(topic: string): PresentationSlide[] {
  return [
    {
      id: crypto.randomUUID(),
      order_index: 0,
      layout: "bullets",
      title: `Introduction to ${topic}`,
      bullets: [
        `Overview of key concepts in ${topic}`,
        "Why this topic matters",
        "What you will learn in this presentation",
      ],
      speaker_notes: "Engage the audience with a question.",
      images: [],
    },
    {
      id: crypto.randomUUID(),
      order_index: 1,
      layout: "title-only",
      title: `${topic} Changed Everything`,
      bullets: [],
      speaker_notes: "Let this land — pause before continuing.",
      images: [],
    },
    {
      id: crypto.randomUUID(),
      order_index: 2,
      layout: "body-text",
      title: "Background",
      bullets: [],
      body_text: `${topic} has been a subject of intense study for decades. Researchers have found that understanding its core principles leads to better outcomes across multiple disciplines and industries worldwide.`,
      speaker_notes: "Give historical context here.",
      images: [],
    },
    {
      id: crypto.randomUUID(),
      order_index: 3,
      layout: "two-col",
      title: "Traditional vs Modern Approach",
      bullets: [
        "Relies on manual processes",
        "Limited scalability",
        "Higher operational cost",
        "Automated and data-driven",
        "Scales with demand",
        "Lower long-term overhead",
      ],
      speaker_notes: "First 3 bullets = left column, last 3 = right column.",
      images: [],
    },
    {
      id: crypto.randomUUID(),
      order_index: 4,
      layout: "image-right",
      title: "Key Visual Evidence",
      bullets: [
        "Supporting point one",
        "Supporting point two",
        "Supporting point three",
      ],
      speaker_notes: "Reference the image directly.",
      images: [img(42)],
    },
    {
      id: crypto.randomUUID(),
      order_index: 5,
      layout: "image-left",
      title: "Another Perspective",
      bullets: [
        "Key insight from this view",
        "What it implies for the field",
        "How practitioners apply it",
      ],
      speaker_notes: "Contrast with previous slide.",
      images: [img(83)],
    },
    {
      id: crypto.randomUUID(),
      order_index: 6,
      layout: "full-image",
      title: "",
      bullets: [],
      caption: `The landscape of ${topic} today`,
      speaker_notes: "Let the image speak — minimal narration.",
      images: [img(1, 1280, 720)],
    },
    {
      id: crypto.randomUUID(),
      order_index: 7,
      layout: "image-top",
      title: "Real World Application",
      bullets: ["How it works in practice", "Why it matters at scale"],
      speaker_notes: "Tie back to opening context.",
      images: [img(20)],
    },
    {
      id: crypto.randomUUID(),
      order_index: 8,
      layout: "quote",
      title: "",
      bullets: [],
      quote: `The study of ${topic} is not just academic — it fundamentally shapes how we approach every challenge we face.`,
      quote_source: "Leading Researcher, 2024",
      speaker_notes: "Read the quote slowly.",
      images: [],
    },
    {
      id: crypto.randomUUID(),
      order_index: 9,
      layout: "two-images",
      title: "Before & After",
      bullets: ["The old approach", "The modern standard"],
      speaker_notes: "Contrast the two images side by side.",
      images: [img(55), img(99)],
    },
  ];
}

export const PresentationServiceMock: PresentationService = {
  async createPresentation(
    payload: PresentationCreatePayload,
  ): Promise<PresentationSession> {
    const id = crypto.randomUUID();
    const session: PresentationSession = {
      id,
      notebook: payload.notebook,
      title: `${payload.topic || "Untitled"} Presentation`,
      topic: payload.topic || "General",
      custom_prompt: payload.custom_prompt ?? "",
      slide_count: payload.slide_count,
      text_length: payload.text_length,
      theme: payload.theme ?? DEFAULT_PRESENTATION_THEME_KEY,
      status: "QUEUED",
      error_message: "",
      is_favourite: false,
      generated_at: new Date().toISOString(),
      completed_at: null,
      slides: [],
    };
    mockStore.set(id, session);

    setTimeout(() => {
      const existing = mockStore.get(id);
      if (!existing) return;
      mockStore.set(id, {
        ...existing,
        status: "COMPLETED",
        completed_at: new Date().toISOString(),
        slides: makeFakeSlides(existing.topic),
      });
    }, 3000);

    return session;
  },

  async getPresentation(presentationId: string): Promise<PresentationSession> {
    const session = mockStore.get(presentationId);
    if (!session) throw new Error(`Presentation ${presentationId} not found`);
    return { ...session };
  },

  async listPresentationsByNotebook(
    notebookId: string,
  ): Promise<PresentationSession[]> {
    return [...mockStore.values()].filter((p) => p.notebook === notebookId);
  },

  async updatePresentation(
    presentationId: string,
    payload: { title?: string; is_favourite?: boolean },
  ): Promise<PresentationSession> {
    const session = mockStore.get(presentationId);
    if (!session) throw new Error(`Presentation ${presentationId} not found`);
    const updated: PresentationSession = {
      ...session,
      ...(payload.title !== undefined ? { title: payload.title } : {}),
      ...(payload.is_favourite !== undefined
        ? { is_favourite: payload.is_favourite }
        : {}),
    };
    mockStore.set(presentationId, updated);
    return updated;
  },

  async deletePresentation(presentationId: string): Promise<void> {
    mockStore.delete(presentationId);
  },

  async updateSlide(
    presentationId: string,
    slideId: string,
    payload: SlideUpdatePayload,
  ): Promise<PresentationSlide> {
    const session = mockStore.get(presentationId);
    if (!session) throw new Error(`Presentation ${presentationId} not found`);
    const slides = session.slides ?? [];
    const idx = slides.findIndex((s) => s.id === slideId);
    if (idx === -1) throw new Error(`Slide ${slideId} not found`);
    const updatedSlide: PresentationSlide = { ...slides[idx], ...payload };
    const nextSlides = [...slides];
    nextSlides[idx] = updatedSlide;
    mockStore.set(presentationId, { ...session, slides: nextSlides });
    return updatedSlide;
  },

  async refineSlide(
    presentationId: string,
    slideId: string,
    feedback: string,
  ): Promise<PresentationSlide> {
    const session = mockStore.get(presentationId);
    if (!session) throw new Error(`Presentation ${presentationId} not found`);
    const slides = session.slides ?? [];
    const idx = slides.findIndex((s) => s.id === slideId);
    if (idx === -1) throw new Error(`Slide ${slideId} not found`);
    const refined: PresentationSlide = {
      ...slides[idx],
      speaker_notes: `${slides[idx].speaker_notes}\n\n[Refined: ${feedback}]`,
    };
    const nextSlides = [...slides];
    nextSlides[idx] = refined;
    mockStore.set(presentationId, { ...session, slides: nextSlides });
    return refined;
  },

  async listFavouritePresentations(): Promise<PresentationSession[]> {
    return [...mockStore.values()].filter((p) => p.is_favourite);
  },
};
