import { useEffect, useRef, useState } from "react";
import type { UsePresentationSessions } from "./usePresentationSessions.types";
import usePresentationService from "../../services/presentation";
import type { ToastVariant } from "../useToast";
import type { ActiveView } from "../../components/notebook/types";
import type {
  PresentationCreatePayload,
  PresentationSession,
} from "@freshr/shared";
import type { NotebookTopic } from "@freshr/shared";
import useNotebookService from "../../services/notebooks";
import { track } from "../../lib/analytics";
import axios from "axios";

const usePresentationSessions = (
  notebookId: string,
  showToast: (msg: string, variant: ToastVariant) => void,
  activeView: ActiveView,
  onUpgradeRequired: () => void,
  onNotebookArchived: () => void,
): UsePresentationSessions & {
  presentations: PresentationSession[];
  activePresentation: PresentationSession | null;
  isGeneratingPresentation: boolean;
  presentationTopics: NotebookTopic[];
  isLoadingPresentationTopics: boolean;
  handleClosePresentation: () => void;
} => {
  const notebookService = useNotebookService();
  const presentationService = usePresentationService();
  const [activePresentation, setActivePresentation] =
    useState<PresentationSession | null>(null);
  const [presentationTopics, setPresentationTopics] = useState<NotebookTopic[]>(
    [],
  );

  const [isGeneratingPresentation, setIsGeneratingPresentation] =
    useState(false);
  const [presentations, setPresentations] = useState<PresentationSession[]>([]);
  const [isLoadingPresentationTopics, setIsLoadingPresentationTopics] =
    useState(false);

  const presentationPollRefs = useRef<Set<ReturnType<typeof setInterval>>>(
    new Set(),
  );

  // Clear any active presentation poll intervals on unmount
  useEffect(() => {
    return () => {
      presentationPollRefs.current.forEach(clearInterval);
    };
  }, []);

  useEffect(() => {
    if (activeView !== "presentation") return;
    // SHOULD I MODE THIS FUNCTION to A NEW FILE???
    async function loadPresentationData() {
      if (presentationTopics.length === 0) {
        setIsLoadingPresentationTopics(true);
        try {
          const topics = await notebookService.listTopics(notebookId);
          setPresentationTopics(topics);
        } catch (err) {
          console.error(err);
          setPresentationTopics([]);
        } finally {
          setIsLoadingPresentationTopics(false);
        }
      }
      try {
        const existing =
          await presentationService.listPresentationsByNotebook(notebookId);
        setPresentations(existing);
      } catch (err) {
        console.error(err);
      }
    }
    loadPresentationData();
  }, [activeView, notebookId]);

  return {
    presentations,
    activePresentation,
    isGeneratingPresentation,
    presentationTopics,
    isLoadingPresentationTopics,
    handleGeneratePresentation: async (options) => {
      track("generate-presentation");
      setIsGeneratingPresentation(true);
      const isAllTopics = options.topics.length === 0 && !options.customTopic;
      const payload: PresentationCreatePayload = {
        notebook: notebookId,
        topic: isAllTopics
          ? "All Topics"
          : options.topics.map((t) => t.name).join(", "),
        topic_id: isAllTopics ? undefined : options.topics[0]?.id,
        custom_prompt: options.customTopic || undefined,
        slide_count: options.numSlides,
        text_length: options.textLength.toUpperCase() as
          | "BRIEF"
          | "BALANCED"
          | "DETAILED",
        theme: options.theme,
      };

      try {
        const session = await presentationService.createPresentation(payload);
        setPresentations((prev) => [session, ...prev]);

        const intervalId = setInterval(async () => {
          try {
            const updated = await presentationService.getPresentation(
              session.id,
            );
            setPresentations((prev) =>
              prev.map((p) => (p.id === session.id ? updated : p)),
            );
            if (updated.status === "COMPLETED") {
              clearInterval(intervalId);
              presentationPollRefs.current.delete(intervalId);
              setIsGeneratingPresentation(false);
              showToast("Presentation ready", "neutral");
            } else if (updated.status === "FAILED") {
              clearInterval(intervalId);
              presentationPollRefs.current.delete(intervalId);
              setIsGeneratingPresentation(false);
              showToast("Presentation generation failed", "danger");
            }
          } catch {
            clearInterval(intervalId);
            presentationPollRefs.current.delete(intervalId);
            setIsGeneratingPresentation(false);
          }
        }, 5000);
        presentationPollRefs.current.add(intervalId);
      } catch (err) {
        if (axios.isAxiosError(err) && err.response?.status === 403) {
          if ((err.response.data as any)?.code === "notebook_archived") {
            onNotebookArchived();
          } else {
            onUpgradeRequired();
          }
        } else {
          showToast("Failed to generate presentation", "danger");
        }
        setIsGeneratingPresentation(false);
      }
    },
    handlePresentationClick: async (presentation) => {
      try {
        const full = await presentationService.getPresentation(presentation.id);
        setActivePresentation(full);
      } catch {
        setActivePresentation(presentation);
      }
    },
    handleDeletePresentations: async (ids) => {
      try {
        await Promise.all(
          ids.map((id) => presentationService.deletePresentation(id)),
        );
        setPresentations((prev) => prev.filter((p) => !ids.includes(p.id)));
        if (activePresentation && ids.includes(activePresentation.id)) {
          setActivePresentation(null);
        }
      } catch {
        showToast("Failed to delete presentations", "danger");
      }
    },
    handleUpdatePresentation: (updatedSlides) => {
      setPresentations((prev) =>
        prev.map((p) =>
          p.id === activePresentation?.id ? { ...p, slides: updatedSlides } : p,
        ),
      );
      setActivePresentation((prev) =>
        prev ? { ...prev, slides: updatedSlides } : null,
      );
    },
    handleRefineSlide: async (slideId, feedback) => {
      if (!activePresentation) throw new Error("No active presentation");
      return await presentationService.refineSlide(activePresentation.id, slideId, feedback);
    },
    handleClosePresentation: () => setActivePresentation(null),
  };
};

export default usePresentationSessions;
