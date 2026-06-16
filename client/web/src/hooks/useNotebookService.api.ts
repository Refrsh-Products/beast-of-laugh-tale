import { useMemo } from "react";
import { createNotebookService, type NotebookService } from "@freshr/shared";
import { useFreshrServiceDeps } from "./useFreshrServiceDeps";

const useNotebookServiceApi = (): NotebookService => {
  const deps = useFreshrServiceDeps();
  return useMemo(() => createNotebookService(deps), [deps]);
};

export default useNotebookServiceApi;
