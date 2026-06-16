import { useMemo } from "react";
import { createPaymentService, type PaymentService } from "@freshr/shared";
import { useFreshrServiceDeps } from "./useFreshrServiceDeps";

const usePaymentServiceApi = (): PaymentService => {
  const deps = useFreshrServiceDeps();
  return useMemo(() => createPaymentService(deps), [deps]);
};

export default usePaymentServiceApi;
