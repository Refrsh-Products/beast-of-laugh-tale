import { useMemo } from "react";
import createFreshrApiInstance, {
  PaymentServiceApiEndpoints,
} from "../services/freshr-api";
import useAxiosInterceptor from "./useAxiosInterceptor";
import { useFetch } from "./useFetch";
import {
  type Payment,
  type PaymentService,
} from "../services/payment/PaymentService.types";

const usePaymentServiceApi = (): PaymentService => {
  const api = useMemo(() => createFreshrApiInstance(), []);
  const apiWithInterceptor = useAxiosInterceptor(api);
  const { fetchData } = useFetch(apiWithInterceptor);

  return {
    listPayments: async () => {
      try {
        const response = await fetchData<Payment[]>(
          PaymentServiceApiEndpoints.getPayments,
          "GET",
        );
        return response;
      } catch (err) {
        throw err;
      }
    },

    initializePayment: async (billing_interval) => {
      try {
        const response = await fetchData<{ payment_url: string }>(
          PaymentServiceApiEndpoints.initiatePayment,
          "POST",
          { billing_interval: billing_interval },
        );
        return response;
      } catch (err) {
        throw err;
      }
    },
  };
};

export default usePaymentServiceApi;
