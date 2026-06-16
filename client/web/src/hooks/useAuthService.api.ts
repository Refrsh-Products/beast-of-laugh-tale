import { useMemo } from "react";
import { createAuthService, type AuthService } from "@freshr/shared";
import { useFreshrServiceDeps } from "./useFreshrServiceDeps";

const useAuthServiceApi = (): AuthService => {
  // Auth endpoints (login/register/verify/reset) run before a token exists, so
  // the request interceptor must not attach one.
  const deps = useFreshrServiceDeps(false);
  return useMemo(() => createAuthService(deps), [deps]);
};

export default useAuthServiceApi;
