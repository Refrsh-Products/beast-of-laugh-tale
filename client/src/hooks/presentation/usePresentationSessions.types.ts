import type { PresentationGenerateOptions } from "../../components/notebook/PresentationColumn";
import type {
  PresentationSlide,
  PresentationSession,
} from "../../services/presentation/Presentation.types";

export interface UsePresentationSessions {
  handleGeneratePresentation(
    options: PresentationGenerateOptions,
  ): Promise<void>;
  handlePresentationClick(presentation: PresentationSession): Promise<void>;
  handleDeletePresentations(ids: string[]): Promise<void>;
  handlePresentationUpdate(updatedSlides: PresentationSlide[]): void;
}
