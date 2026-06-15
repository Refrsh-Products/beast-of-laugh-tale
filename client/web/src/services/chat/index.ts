import useChatServiceApi from "../../hooks/useChatService.api";
import ChatServiceMock from "./ChatService.mock";

const useMock = import.meta.env.VITE_USE_MOCK === "true";

const useChatService = () => {
  const apiService = useChatServiceApi();
  return useMock ? ChatServiceMock : apiService;
};

export default useChatService;
