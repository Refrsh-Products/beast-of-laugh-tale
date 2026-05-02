import type {
  PresentationCreatePayload,
  PresentationService,
  PresentationSession,
  PresentationSlide,
} from "./Presentation.types";

const mockStore = new Map<string, PresentationSession>();

function makeFakeSlides(topic: string, count: number): PresentationSlide[] {
  const templates = [
    {
      title: `Introduction to ${topic}`,
      bullets: [
        `Overview of key concepts in ${topic}`,
        "Why this topic matters",
        "What you will learn in this presentation",
      ],
      speaker_notes: `Start by engaging the audience with a question about ${topic}.`,
    },
    {
      title: `Core Concepts`,
      bullets: [
        `Foundational principles of ${topic}`,
        "Key terminology and definitions",
        "Historical context and development",
      ],
      speaker_notes: "Spend extra time on definitions — these underpin everything that follows.",
    },
    {
      title: `Key Findings`,
      bullets: [
        `Research highlights in ${topic}`,
        "Statistical evidence and data points",
        "Expert consensus on the subject",
      ],
      speaker_notes: "Reference primary sources where possible.",
    },
    {
      title: `Practical Applications`,
      bullets: [
        `Real-world use cases of ${topic}`,
        "Industry adoption and impact",
        "Case study walkthrough",
      ],
      speaker_notes: "Audience engagement moment — ask if anyone has personal experience.",
    },
    {
      title: `Challenges & Limitations`,
      bullets: [
        `Common obstacles in ${topic}`,
        "Current research gaps",
        "Ongoing debates in the field",
      ],
      speaker_notes: "Acknowledge complexity — avoid oversimplifying.",
    },
    {
      title: `Future Directions`,
      bullets: [
        `Emerging trends in ${topic}`,
        "Upcoming research opportunities",
        "What to watch in the next 5 years",
      ],
      speaker_notes: "End on a forward-looking note to inspire curiosity.",
    },
    {
      title: `Summary & Takeaways`,
      bullets: [
        `Key points covered today`,
        "Actionable next steps",
        "Resources for further reading",
      ],
      speaker_notes: "Recap the three most important points before Q&A.",
    },
  ];

  return Array.from({ length: count }, (_, i) => {
    const template = templates[i % templates.length];
    return {
      id: crypto.randomUUID(),
      order_index: i,
      layout: i === 0 ? "title" : "content",
      title: template.title,
      bullets: template.bullets,
      speaker_notes: template.speaker_notes,
      images: [],
    };
  });
}

export const PresentationServiceMock: PresentationService = {
  async listPresentations(notebookId: string): Promise<PresentationSession[]> {
    return [...mockStore.values()].filter((p) => p.notebook === notebookId);
  },

  async createPresentation(payload: PresentationCreatePayload): Promise<PresentationSession> {
    const id = crypto.randomUUID();
    const session: PresentationSession = {
      id,
      notebook: payload.notebook,
      title: `${payload.topic || "Untitled"} Presentation`,
      topic: payload.topic || "General",
      custom_prompt: payload.custom_prompt ?? "",
      slide_count: payload.slide_count,
      text_length: payload.text_length,
      status: "QUEUED",
      error_message: "",
      is_favourite: false,
      generated_at: new Date().toISOString(),
      completed_at: null,
      slides: [],
    };
    mockStore.set(id, session);

    // Simulate async generation — updates store after 3s
    setTimeout(() => {
      const existing = mockStore.get(id);
      if (!existing) return;
      mockStore.set(id, {
        ...existing,
        status: "COMPLETED",
        completed_at: new Date().toISOString(),
        slides: makeFakeSlides(existing.topic, existing.slide_count),
      });
    }, 3000);

    return session;
  },

  async getPresentation(presentationId: string): Promise<PresentationSession> {
    const session = mockStore.get(presentationId);
    if (!session) throw new Error(`Presentation ${presentationId} not found`);
    return { ...session };
  },

  async deletePresentation(presentationId: string): Promise<void> {
    mockStore.delete(presentationId);
  },

  async toggleFavourite(presentationId: string, value: boolean): Promise<PresentationSession> {
    const session = mockStore.get(presentationId);
    if (!session) throw new Error(`Presentation ${presentationId} not found`);
    const updated = { ...session, is_favourite: value };
    mockStore.set(presentationId, updated);
    return updated;
  },
};
