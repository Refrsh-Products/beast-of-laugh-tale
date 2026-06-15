import { QuizServiceMock } from "./Quiz.mock";
import useQuizServiceApi from "../../hooks/useQuizService.api";

const useMock = import.meta.env.VITE_USE_MOCK === "true";

const useQuizService = () => {
  const apiService = useQuizServiceApi();
  return useMock ? QuizServiceMock : apiService;
};

export default useQuizService;
