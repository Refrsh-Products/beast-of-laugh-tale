import { PresentationServiceMock } from "./Presentation.mock";
import usePresentationServiceApi from "../../hooks/usePresentationService.api";

const useMock = import.meta.env.VITE_USE_MOCK === "true";

const usePresentationService = () => {
  const apiService = usePresentationServiceApi();
  return useMock ? PresentationServiceMock : apiService;
};

export default usePresentationService;
