import useTranscriptionServiceApi from "../../hooks/useTranscriptionService.api";
import TranscriptionServiceMock from "./TranscriptionService.mock";

const useMock = import.meta.env.VITE_USE_MOCK === "true";

const useTranscriptionService = () => {
  const apiService = useTranscriptionServiceApi();
  return useMock ? TranscriptionServiceMock : apiService;
};

export default useTranscriptionService;
