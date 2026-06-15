import NotebookServiceMock from "./NotebookService.mock";
import useNotebookServiceApi from "../../hooks/useNotebookService.api";

const useMock = import.meta.env.VITE_USE_MOCK === "true";

const useNotebookService = () => {
  const apiService = useNotebookServiceApi();
  return useMock ? NotebookServiceMock : apiService;
};

export default useNotebookService;
