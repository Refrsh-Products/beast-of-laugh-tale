import { useMemo } from "react";
import {
  createPresentationService,
  type PresentationService,
} from "@freshr/shared";
import { useFreshrServiceDeps } from "./useFreshrServiceDeps";

const usePresentationServiceApi = (): PresentationService => {
  const deps = useFreshrServiceDeps();
  return useMemo(() => createPresentationService(deps), [deps]);
};

export default usePresentationServiceApi;
