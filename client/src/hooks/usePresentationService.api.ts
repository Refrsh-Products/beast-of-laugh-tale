import type { PresentationService } from "../services/presentation/Presentation.types";

const usePresentationServiceApi = (): PresentationService => {
  return {
    listPresentations: async () => { throw new Error("Not implemented"); },
    createPresentation: async () => { throw new Error("Not implemented"); },
    getPresentation: async () => { throw new Error("Not implemented"); },
    deletePresentation: async () => { throw new Error("Not implemented"); },
    toggleFavourite: async () => { throw new Error("Not implemented"); },
  };
};

export default usePresentationServiceApi;
