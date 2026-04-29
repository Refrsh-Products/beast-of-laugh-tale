export interface PresentationCreatePayload {
  notebook: string;
  topic: string;
  topic_id?: string;
  custom_prompt?: string;
  slide_count: number;
  text_length: "BRIEF" | "BALANCED" | "DETAILED";
}

export interface PresentationSlide {
  id: string;
  order_index: number;
  layout: string;
  title: string;
  bullets: string[];
  speaker_notes: string;
  images: never[];
}

export interface PresentationSession {
  id: string;
  notebook: string;
  title: string;
  topic: string;
  custom_prompt: string;
  slide_count: number;
  text_length: string;
  status: "QUEUED" | "GENERATING" | "COMPLETED" | "FAILED";
  error_message: string;
  is_favourite: boolean;
  generated_at: string;
  completed_at: string | null;
  slides?: PresentationSlide[];
}

export interface PresentationService {
  listPresentations(notebookId: string): Promise<PresentationSession[]>;
  createPresentation(payload: PresentationCreatePayload): Promise<PresentationSession>;
  getPresentation(presentationId: string): Promise<PresentationSession>;
  deletePresentation(presentationId: string): Promise<void>;
  toggleFavourite(presentationId: string, value: boolean): Promise<PresentationSession>;
}
