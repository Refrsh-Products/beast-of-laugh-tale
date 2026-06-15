import PaymentServiceMock from "./PaymentService.mock";
import usePaymentServiceApi from "../../hooks/usePaymentService.api";

const useMock = import.meta.env.VITE_USE_MOCK === "true";

const usePaymentService = () => {
  const apiService = usePaymentServiceApi();
  return useMock ? PaymentServiceMock : apiService;
};

export default usePaymentService;
