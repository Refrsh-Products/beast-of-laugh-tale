import type { PresentationGenerateOptions } from "../../components/notebook/PresentationColumn";
import type {
  PresentationSlide,
  PresentationSession,
} from "@freshr/shared";

export interface UsePresentationSessions {
  handleGeneratePresentation(
    options: PresentationGenerateOptions,
  ): Promise<void>;
  handlePresentationClick(presentation: PresentationSession): Promise<void>;
  handleDeletePresentations(ids: string[]): Promise<void>;
  handleUpdatePresentation(updatedSlides: PresentationSlide[]): void;
  handleRefineSlide(slideId: string, feedback: string): Promise<PresentationSlide>;
}
