import AuthServiceMock from "./AuthService.mock";
import useAuthServiceApi from "../../hooks/useAuthService.api";

const useMock = import.meta.env.VITE_USE_MOCK === "true";

const useAuthService = () => {
  const apiService = useAuthServiceApi();
  return useMock ? AuthServiceMock : apiService;
};

export default useAuthService;
