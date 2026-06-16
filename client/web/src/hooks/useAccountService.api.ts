import { useMemo } from "react";
import { createAccountService, type AccountService } from "@freshr/shared";
import { useFreshrServiceDeps } from "./useFreshrServiceDeps";

const useAccountServiceApi = (): AccountService => {
  const deps = useFreshrServiceDeps();
  return useMemo(() => createAccountService(deps), [deps]);
};

export default useAccountServiceApi;
