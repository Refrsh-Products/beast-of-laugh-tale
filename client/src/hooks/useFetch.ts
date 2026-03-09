/*
This hook is used to fetch data from the API.
It handles the loading state of the request.
*/

import type { AxiosInstance, AxiosRequestConfig } from "axios";
import { useCallback, useState } from "react";

export const useFetch = (api: AxiosInstance) => {
  const [loading, setLoading] = useState(false);

  const fetchData = useCallback(
    async <T>(
      endpoint: string,
      method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE" = "GET",
      data: unknown = null,
      config: AxiosRequestConfig = {},
    ): Promise<T> => {
      setLoading(true);
      try {
        let response;
        switch (method) {
          case "GET":
            response = api.get(endpoint, config);
            break;
          case "POST":
            response = api.post(endpoint, data, config);
            break;
          case "PUT":
            response = api.put(endpoint, data, config);
            break;
          case "PATCH":
            response = api.patch(endpoint, data, config);
            break;
          case "DELETE":
            response = api.delete(endpoint, config);
            break;
          default:
            throw new Error(`Unsupported method: ${method}`);
        }
        return (await response).data;
      } catch (err) {
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [api],
  );

  return { fetchData, loading };
};
