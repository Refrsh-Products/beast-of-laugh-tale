import { useMemo } from "react";
import { createQuizService, type QuizService } from "@freshr/shared";
import { useFreshrServiceDeps } from "./useFreshrServiceDeps";

// QuizQuestion/QuizSession moved to @freshr/shared; re-exported here for the
// components that still import them from this module (removed in 1.4).
export type { QuizQuestion, QuizSession } from "@freshr/shared";

const useQuizServiceApi = (): QuizService => {
  const deps = useFreshrServiceDeps();
  return useMemo(() => createQuizService(deps), [deps]);
};

export default useQuizServiceApi;
