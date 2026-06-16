import { useMemo } from "react";
import { createQuizService, type QuizService } from "@freshr/shared";
import { useFreshrServiceDeps } from "./useFreshrServiceDeps";

const useQuizServiceApi = (): QuizService => {
  const deps = useFreshrServiceDeps();
  return useMemo(() => createQuizService(deps), [deps]);
};

export default useQuizServiceApi;
