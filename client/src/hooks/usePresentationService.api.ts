import { useMemo } from "react";

import createFreshrApiInstance, {
  PresentationServiceApiEndpoints,
} from "../services/freshr-api";
import type {
  PresentationSession,
  PresentationCreatePayload,
  PresentationService,
  PresentationSlide,
  SlideUpdatePayload,
} from "../services/presentation/Presentation.types";
import useAxiosInterceptor from "./useAxiosInterceptor";
import { useFetch } from "./useFetch";

const usePresentationServiceApi = (): PresentationService => {
  const api = useMemo(() => createFreshrApiInstance(), []);
  const apiWithInterceptor = useAxiosInterceptor(api);
  const { fetchData } = useFetch(apiWithInterceptor);

  return {
    createPresentation: async (payload: PresentationCreatePayload) => {
      const { notebook, ...body } = payload;
      return await fetchData<PresentationSession>(
        PresentationServiceApiEndpoints.createPresentation(notebook),
        "POST",
        body,
      );
    },

    getPresentation: async (presentationId: string) => {
      return await fetchData<PresentationSession>(
        PresentationServiceApiEndpoints.getPresentation(presentationId),
        "GET",
      );
    },

    listPresentationsByNotebook: async (notebookId: string) => {
      return await fetchData<PresentationSession[]>(
        PresentationServiceApiEndpoints.listPresentationsByNotebook(notebookId),
        "GET",
      );
    },

    updatePresentation: async (
      presentationId: string,
      payload: { title?: string; is_favourite?: boolean },
    ) => {
      return await fetchData<PresentationSession>(
        PresentationServiceApiEndpoints.updatePresentation(presentationId),
        "PATCH",
        payload,
      );
    },

    deletePresentation: async (presentationId: string) => {
      await fetchData(
        PresentationServiceApiEndpoints.deletePresentation(presentationId),
        "DELETE",
      );
    },

    updateSlide: async (
      presentationId: string,
      slideId: string,
      payload: SlideUpdatePayload,
    ) => {
      return await fetchData<PresentationSlide>(
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
      return await fetchData<PresentationSlide>(
        PresentationServiceApiEndpoints.refineSlide(presentationId, slideId),
        "POST",
        { feedback },
      );
    },

    listFavouritePresentations: async () => {
      return await fetchData<PresentationSession[]>(
        PresentationServiceApiEndpoints.listFavouritePresentations,
        "GET",
      );
    },
  };
};

export default usePresentationServiceApi;
