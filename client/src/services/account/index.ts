import AccountServiceMock from "./Account.mock";
import useAccountServiceApi from "../../hooks/useAccountService.api";

const useMock = import.meta.env.VITE_USE_MOCK === "true";

const useAccountService = () => {
  const apiService = useAccountServiceApi();
  return useMock ? AccountServiceMock : apiService;
};

export default useAccountService;
