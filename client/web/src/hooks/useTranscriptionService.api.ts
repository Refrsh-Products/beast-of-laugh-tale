import { useMemo } from "react";
import {
  createTranscriptionService,
  type TranscriptionService,
} from "@freshr/shared";
import { useFreshrServiceDeps } from "./useFreshrServiceDeps";

const useTranscriptionServiceApi = (): TranscriptionService => {
  const deps = useFreshrServiceDeps();
  return useMemo(() => createTranscriptionService(deps), [deps]);
};

export default useTranscriptionServiceApi;
