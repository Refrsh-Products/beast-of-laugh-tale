import type { ServiceDeps } from "../platform/deps";
import { PresentationServiceApiEndpoints } from "./endpoints";

export type PresentationLayout =
  | "bullets"
  | "title-only"
  | "body-text"
  | "two-col"
  | "image-right"
  | "image-left"
  | "full-image"
  | "image-top"
  | "quote"
  | "two-images";

export type PresentationStatus =
  | "QUEUED"
  | "GENERATING"
  | "COMPLETED"
  | "FAILED";

export type TextLength = "BRIEF" | "BALANCED" | "DETAILED";

export interface PresentationCreatePayload {
  notebook: string;
  topic: string;
  topic_id?: string;
  custom_prompt?: string;
  slide_count: number;
  text_length: TextLength;
}

export interface SlideImage {
  query: string;
  url: string;
  attribution: string;
  source_page: string;
}

export interface PresentationSlide {
  id: string;
  order_index: number;
  layout: PresentationLayout;
  title: string;
  bullets: string[];
  body_text?: string;
  quote?: string;
  quote_source?: string;
  caption?: string;
  speaker_notes: string;
  images: SlideImage[];
}

export interface PresentationSession {
  id: string;
  notebook: string;
  title: string;
  topic: string;
  custom_prompt?: string;
  slide_count: number;
  text_length: TextLength;
  status: PresentationStatus;
  error_message?: string;
  is_favourite: boolean;
  generated_at: string;
  completed_at?: string | null;
  slides?: PresentationSlide[];
}

export interface SlideUpdatePayload {
  title?: string;
  layout?: PresentationLayout;
  bullets?: string[];
  body_text?: string;
  quote?: string;
  quote_source?: string;
  caption?: string;
  speaker_notes?: string;
  images?: SlideImage[];
}

export interface PresentationService {
  createPresentation: (
    payload: PresentationCreatePayload,
  ) => Promise<PresentationSession>;
  getPresentation: (presentationId: string) => Promise<PresentationSession>;
  listPresentationsByNotebook: (
    notebookId: string,
  ) => Promise<PresentationSession[]>;
  updatePresentation: (
    presentationId: string,
    payload: { title?: string; is_favourite?: boolean },
  ) => Promise<PresentationSession>;
  deletePresentation: (presentationId: string) => Promise<void>;
  updateSlide: (
    presentationId: string,
    slideId: string,
    payload: SlideUpdatePayload,
  ) => Promise<PresentationSlide>;
  refineSlide: (
    presentationId: string,
    slideId: string,
    feedback: string,
  ) => Promise<PresentationSlide>;
  listFavouritePresentations: () => Promise<PresentationSession[]>;
}

export function createPresentationService(
  deps: ServiceDeps,
): PresentationService {
  const { http } = deps;

  return {
    createPresentation: async (payload: PresentationCreatePayload) => {
      const { notebook, ...body } = payload;
      return await http.request<PresentationSession>(
        PresentationServiceApiEndpoints.createPresentation(notebook),
        "POST",
        body,
        { timeout: 120000 },
      );
    },

    getPresentation: async (presentationId: string) => {
      return await http.request<PresentationSession>(
        PresentationServiceApiEndpoints.getPresentation(presentationId),
        "GET",
      );
    },

    listPresentationsByNotebook: async (notebookId: string) => {
      return await http.request<PresentationSession[]>(
        PresentationServiceApiEndpoints.listPresentationsByNotebook(notebookId),
        "GET",
      );
    },

    updatePresentation: async (
      presentationId: string,
      payload: { title?: string; is_favourite?: boolean },
    ) => {
      return await http.request<PresentationSession>(
        PresentationServiceApiEndpoints.updatePresentation(presentationId),
        "PATCH",
        payload,
      );
    },

    deletePresentation: async (presentationId: string) => {
      await http.request(
        PresentationServiceApiEndpoints.deletePresentation(presentationId),
        "DELETE",
      );
    },

    updateSlide: async (
      presentationId: string,
      slideId: string,
      payload: SlideUpdatePayload,
    ) => {
      return await http.request<PresentationSlide>(
        PresentationServiceApiEndpoints.updateSlide(presentationId, slideId),
        "PATCH",
        payload,
      );
    },

    refineSlide: async (
      presentationId: string,
      slideId: string,
      feedback: string,
    ) => {
      return await http.request<PresentationSlide>(
        PresentationServiceApiEndpoints.refineSlide(presentationId, slideId),
        "POST",
        { feedback },
        { timeout: 120000 },
      );
    },

    listFavouritePresentations: async () => {
      return await http.request<PresentationSession[]>(
        PresentationServiceApiEndpoints.listFavouritePresentations,
        "GET",
      );
    },
  };
}
