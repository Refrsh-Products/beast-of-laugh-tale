import { useMemo } from "react";
import { createChatService, type ChatServices } from "@freshr/shared";
import { useFreshrServiceDeps } from "./useFreshrServiceDeps";

const useChatServiceApi = (): ChatServices => {
  const deps = useFreshrServiceDeps(true);
  return useMemo(() => createChatService(deps), [deps]);
};

export default useChatServiceApi;
