import axios from "axios";

// Endpoint path builders moved to @freshr/shared; re-exported here so existing
// `from "../services/freshr-api"` imports keep working.
export * from "@freshr/shared/services/endpoints";

const createFreshrApiInstance = () => {
  return axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL,
    timeout: 10000, // Request timeout in milliseconds
    headers: {
      "Content-Type": "application/json",
    },
  });
};

export default createFreshrApiInstance;
